/**
 * ════════════════════════════════════════════════════════════════
 * Inngest Background Step Functions (v4 API)
 * ════════════════════════════════════════════════════════════════
 * Inngest v4 createFunction signature:
 *   inngest.createFunction({ id, triggers: [{ event }], retries }, handler)
 *
 * Runtime safety: all event.data payloads are validated with Zod schemas
 * before use. This catches malformed events early and prevents unsafe `as`
 * casts from hiding shape mismatches at runtime.
 */
import { z } from 'zod';
import { inngest } from '@/lib/inngest/client';
import {
  sendWelcomeEmail,
  sendEnrollmentReceiptEmail,
  sendCertificateIssuedEmail,
  sendOperationalAlertEmail,
  EmailDispatchResult,
} from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { captureException, captureAlert } from '@/lib/telemetry';
import { recordEmailDelivery, buildUnsubscribeUrl } from '@/lib/email-delivery';

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schemas for event.data Payloads
//
// Replacing unsafe `as` type casts with runtime validation so that malformed
// Inngest events are rejected at function entry rather than causing silent
// runtime errors inside step handlers.
// ─────────────────────────────────────────────────────────────────────────────

const EmailSendEventSchema = z.object({
  type: z.enum(['welcome', 'receipt', 'certificate', 'alert'] as const),
  to: z.string().email(),
  data: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
});

const CertificateGenerateEventSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  userEmail: z.string().email(),
  courseTitle: z.string().min(1),
});

const MuxVideoStateEventSchema = z.object({
  lessonId: z.string().min(1),
  muxAssetId: z.string().min(1),
  muxPlaybackId: z.string().optional(),
  status: z.enum(['ready', 'errored', 'preparing', 'deleted']),
});

const StorageUploadCompleteEventSchema = z.object({
  fileKey: z.string().min(1),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileType: z.string().min(1),
  userId: z.string().min(1),
  lessonId: z.string().optional(),
  courseId: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Transactional & Lifecycle Email Delivery
// ─────────────────────────────────────────────────────────────────────────────

export const sendTransactionalEmailFn = inngest.createFunction(
  {
    id: 'send-transactional-email',
    name: 'Send Email Gateway (Resend)',
    retries: 4,
    triggers: [{ event: 'email/send' as const }],
  },
  async ({ event, step }) => {
    // ── Runtime payload validation ─────────────────────────────────────────
    const parseResult = EmailSendEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      captureAlert(
        'Inngest Email Event Schema Validation Failed',
        'Received malformed email/send event payload',
        { errors: parseResult.error.flatten().fieldErrors }
      );
      // Return without throwing so Inngest does not retry an unrecoverable schema error
      return { skipped: true, reason: 'invalid_event_schema', errors: parseResult.error.flatten() };
    }

    const { type, to, data, idempotencyKey } = parseResult.data;

    // Step 0: For marketing/welcome emails, verify consent / active subscriber state
    if (type === 'welcome') {
      const subscriber = await step.run('check-subscriber-consent', async () => {
        return await prisma.newsletterSubscriber.findUnique({
          where: { email: to.toLowerCase().trim() },
          select: { active: true },
        });
      });

      if (subscriber && !subscriber.active) {
        return { skipped: true, reason: 'recipient_unsubscribed', to };
      }
    }

    const result: EmailDispatchResult = await step.run('dispatch-email', async () => {
      if (type === 'welcome') {
        const unsubscribeUrl = buildUnsubscribeUrl(to);
        const deterministicKey = idempotencyKey || `welcome/${to.toLowerCase().trim()}`;
        return await sendWelcomeEmail(to, {
          idempotencyKey: deterministicKey,
          unsubscribeUrl,
        });
      } else if (type === 'receipt' && data) {
        const courseTitle = String(data.courseTitle ?? '');
        const amountPaid = Number(data.amountPaid ?? 0);
        const transactionRef = String(data.transactionRef ?? data.orderId ?? '');
        const provider = String(data.provider ?? 'Sifalo Pay');
        const courseUrl = data.courseUrl != null ? String(data.courseUrl) : undefined;
        const deterministicKey = idempotencyKey || `receipt/${transactionRef}`;
        return await sendEnrollmentReceiptEmail(
          { recipientEmail: to, courseTitle, amountPaid, transactionRef, provider, courseUrl },
          { idempotencyKey: deterministicKey }
        );
      } else if (type === 'certificate' && data) {
        const courseTitle = String(data.courseTitle ?? '');
        const studentName = data.studentName != null ? String(data.studentName) : undefined;
        const verificationCode = String(data.verificationCode ?? '');
        const certificateId = String(data.certificateId ?? '');
        const deterministicKey = idempotencyKey || `certificate/${certificateId}`;
        return await sendCertificateIssuedEmail(
          { recipientEmail: to, courseTitle, studentName, verificationCode, certificateId },
          { idempotencyKey: deterministicKey }
        );
      } else if (type === 'alert' && data) {
        const subject = String(data.subject ?? '');
        const message = String(data.message ?? '');
        const details = data.details != null ? String(data.details) : undefined;
        return await sendOperationalAlertEmail({ subject, message, details });
      }
      throw new Error(`Unknown email type: ${type}`);
    });

    // Step 2: Record durable delivery record
    await step.run('record-delivery-status', async () => {
      await recordEmailDelivery({
        eventKey: result.idempotencyKey || `${type}/${to}/${Date.now()}`,
        recipient: to,
        category: result.category,
        template: type,
        status: result.success ? 'SENT' : 'FAILED',
        providerMessageId: result.messageId,
        lastError: result.error,
      });
    });

    if (!result.success) {
      captureAlert('Inngest Email Delivery Failed', `Failed to send ${type} email to ${to}: ${result.error}`, {
        to,
        type,
        error: result.error,
      });
    }

    return { dispatched: result.success, messageId: result.messageId, error: result.error };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Course Certificate Generation
// ─────────────────────────────────────────────────────────────────────────────

export const generateCourseCertificateFn = inngest.createFunction(
  {
    id: 'generate-course-certificate',
    name: 'Generate Course Completion Certificate',
    retries: 3,
    triggers: [{ event: 'certificate/generate' as const }],
  },
  async ({ event, step }) => {
    // ── Runtime payload validation ─────────────────────────────────────────
    const parseResult = CertificateGenerateEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      captureAlert(
        'Inngest Certificate Event Schema Validation Failed',
        'Received malformed certificate/generate event payload',
        { errors: parseResult.error.flatten().fieldErrors }
      );
      return { skipped: true, reason: 'invalid_event_schema', errors: parseResult.error.flatten() };
    }

    const { userId, courseId, userEmail, courseTitle } = parseResult.data;

    // Step 1: Verify enrollment payment AND authoritative 100% course completion in DB
    const verification = await step.run('verify-course-completion', async () => {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: {
          course: {
            select: {
              title: true,
              hasCertificate: true,
            },
          },
        },
      });

      if (!enrollment || enrollment.paymentStatus !== 'COMPLETED') {
        return { eligible: false, reason: 'enrollment_not_completed' as const };
      }

      if (enrollment.course && enrollment.course.hasCertificate === false) {
        return { eligible: false, reason: 'course_has_no_certificate' as const };
      }

      // Authoritative completion validation: count published lessons vs user completed lessons
      const totalLessons = await prisma.lesson.count({
        where: { section: { courseId } },
      });

      const completedCount = await prisma.lessonProgress.count({
        where: { userId, courseId, completed: true },
      });

      const isCompleted =
        enrollment.progress >= 100 ||
        (totalLessons > 0 && completedCount >= totalLessons);

      if (!isCompleted) {
        return {
          eligible: false,
          reason: 'course_not_completed' as string,
          progress: enrollment.progress,
          completedCount,
          totalLessons,
        };
      }

      return {
        eligible: true,
        reason: null as string | null,
        progress: enrollment.progress,
        completedCount,
        totalLessons,
      };
    });

    if (!verification.eligible) {
      const denialReason = ('reason' in verification && verification.reason) ? String(verification.reason) : 'course_not_completed';
      captureAlert(
        'Certificate Generation Blocked: Course Not Completed',
        `Certificate was requested prematurely before full completion (reason: ${denialReason})`,
        { userId, courseId, verification }
      );
      return { skipped: true, reason: denialReason, details: verification };
    }

    // Step 2: Upsert certificate record
    const certificate = await step.run('upsert-certificate-record', async () => {
      return await prisma.certificate.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      });
    });

    // Step 3: Dispatch certificate email through the unified email/send outbox pipeline.
    // This ensures consistent delivery tracking, retry logic, and consent checks
    // rather than invoking the raw mailer directly.
    await step.run('dispatch-certificate-email', async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await inngest.send({
        name: 'email/send',
        data: {
          type: 'certificate',
          to: userEmail,
          data: {
            courseTitle,
            studentName: user?.name,
            verificationCode: certificate.verificationCode,
            certificateId: certificate.id,
          },
          idempotencyKey: `certificate/${certificate.id}`,
        },
      });
    });

    return {
      certificateId: certificate.id,
      verificationCode: certificate.verificationCode,
    };
  }
);


// ─────────────────────────────────────────────────────────────────────────────
// 3. Mux Video State Reconciliation
// ─────────────────────────────────────────────────────────────────────────────

export const reconcileMuxVideoStateFn = inngest.createFunction(
  {
    id: 'reconcile-mux-video-state',
    name: 'Reconcile Mux Video Processing State',
    retries: 5,
    triggers: [{ event: 'mux/video.state' as const }],
  },
  async ({ event, step }) => {
    // ── Runtime payload validation ─────────────────────────────────────────
    const parseResult = MuxVideoStateEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      captureAlert(
        'Inngest Mux Event Schema Validation Failed',
        'Received malformed mux/video.state event payload',
        { errors: parseResult.error.flatten().fieldErrors }
      );
      return { skipped: true, reason: 'invalid_event_schema', errors: parseResult.error.flatten() };
    }

    const { lessonId, muxAssetId, muxPlaybackId, status } = parseResult.data;

    // Step 1: Record Mux webhook event for idempotency
    await step.run('record-webhook-event', async () => {
      await prisma.webhookEvent.upsert({
        where: { provider_eventId: { provider: 'MUX', eventId: muxAssetId } },
        create: {
          provider: 'MUX',
          eventId: muxAssetId,
          eventType: status,
          payload: event.data,
        },
        update: {
          eventType: status,
          payload: event.data,
        },
      });
    });

    // Step 2: Update lesson's muxPlaybackId if video is ready
    if (status === 'ready' && muxPlaybackId) {
      await step.run('update-lesson-playback-id', async () => {
        await prisma.lesson.update({
          where: { id: lessonId },
          data: { muxPlaybackId },
        });
      });
    }

    if (status === 'errored') {
      captureAlert('Mux Video Processing Error', `Asset ${muxAssetId} failed for lesson ${lessonId}`, {
        lessonId, muxAssetId, status,
      });
    }

    return { lessonId, muxAssetId, status, processed: true };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Storage Upload Metadata Aggregation
// ─────────────────────────────────────────────────────────────────────────────

export const processStorageUploadFn = inngest.createFunction(
  {
    id: 'process-storage-upload',
    name: 'Process UploadThing Storage File Metadata',
    retries: 3,
    triggers: [{ event: 'storage/upload.complete' as const }],
  },
  async ({ event, step }) => {
    // ── Runtime payload validation ─────────────────────────────────────────
    const parseResult = StorageUploadCompleteEventSchema.safeParse(event.data);
    if (!parseResult.success) {
      captureAlert(
        'Inngest Storage Event Schema Validation Failed',
        'Received malformed storage/upload.complete event payload',
        { errors: parseResult.error.flatten().fieldErrors }
      );
      return { skipped: true, reason: 'invalid_event_schema', errors: parseResult.error.flatten() };
    }

    const { fileKey, fileUrl, fileName, fileSize, fileType, userId, lessonId, courseId } = parseResult.data;

    // Step 1: Persist file metadata in database
    const record = await step.run('persist-file-metadata', async () => {
      return await prisma.uploadedFile.upsert({
        where: { key: fileKey },
        create: {
          key: fileKey,
          url: fileUrl,
          name: fileName,
          size: fileSize,
          type: fileType,
          userId,
          uploadedBy: userId,
          lessonId: lessonId || null,
          courseId: courseId || null,
        },
        update: {
          url: fileUrl,
          name: fileName,
          size: fileSize,
          type: fileType,
        },
      });
    });

    return { fileId: record.id, fileKey, persisted: true };
  }
);

// All functions exported for the Inngest handler
export const inngestFunctions = [
  sendTransactionalEmailFn,
  generateCourseCertificateFn,
  reconcileMuxVideoStateFn,
  processStorageUploadFn,
];
