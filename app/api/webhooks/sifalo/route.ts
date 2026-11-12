import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';
import { checkSifaloCallbackRateLimit } from '@/lib/rate-limit';
import { captureException, captureAlert } from '@/lib/telemetry';
import { inngest } from '@/lib/inngest/client';
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/posthog';
import { PAYMENT_STATUS } from '@/lib/payments/domain';
import { getSifaloWebhookSecret } from '@/lib/sifalo-config';
import { finalizeSuccessfulPayment, handlePaymentReversal, handlePaymentFailure } from '@/lib/payments/service';
import { logger } from '@/lib/logger';

const MAX_PAYLOAD_SIZE_BYTES = 65536; // 64 KB

const SifaloWebhookPayloadSchema = z.object({
  reference: z.string().min(1).max(256),
  status: z.string().min(1).max(64),
  amount: z.union([z.number(), z.string()]).transform((val) => Number(val)).refine((n) => Number.isFinite(n) && n >= 0, {
    message: 'Amount must be a non-negative finite number',
  }),
  currency: z.string().max(10).optional().default('USD'),
  channel: z.string().max(64).optional(),
  eventId: z.string().max(256).optional(),
  payerAccount: z.string().max(128).optional(),
});

function verifyHmacSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf-8')
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateLimit = await checkSifaloCallbackRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let webhookSecret: string;
    try {
      webhookSecret = getSifaloWebhookSecret();
    } catch {
      captureAlert('Sifalo Webhook Configuration Error', 'SIFALO_WEBHOOK_SECRET is not configured.');
      return NextResponse.json(
        { error: 'Webhook processing temporarily unavailable.' },
        { status: 503, headers: { 'Retry-After': '60' } }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const signature =
      req.headers.get('x-sifalo-signature') ||
      req.headers.get('x-sifalo-webhook-secret');

    if (!signature || !verifyHmacSignature(rawBody, signature, webhookSecret)) {
      captureAlert('Invalid Sifalo Webhook Signature', 'HMAC signature verification failed', { ip, hasSignature: Boolean(signature) });
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook signature' }, { status: 401 });
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const parseResult = SifaloWebhookPayloadSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      reference,
      status,
      amount: numAmount,
      currency,
      channel,
      eventId,
    } = parseResult.data;

    const normalizedStatus = (status || '').toUpperCase();
    const paymentStatus =
      normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCESS'
        ? PAYMENT_STATUS.COMPLETED
        : normalizedStatus === 'FAILED'
        ? PAYMENT_STATUS.FAILED
        : normalizedStatus === 'REFUNDED' || normalizedStatus === 'REVERSED'
        ? PAYMENT_STATUS.REVERSED
        : PAYMENT_STATUS.PENDING;

    if (paymentStatus === PAYMENT_STATUS.PENDING) {
      return NextResponse.json({ received: true, action: 'none' });
    }

    // ── Find matching CheckoutOrder by server-created provider reference or order ID
    const existingOrder = await prisma.checkoutOrder.findFirst({
      where: {
        OR: [
          { providerRef: reference },
          { id: reference },
        ],
      },
    });

    if (existingOrder) {
      // Amount matching after rounding policy
      const expectedAmount = Math.round((Number(existingOrder.finalAmount) + Number.EPSILON) * 100) / 100;
      const actualAmount = Math.round((numAmount + Number.EPSILON) * 100) / 100;

      if (expectedAmount !== actualAmount) {
        logger.error(`[Sifalo Webhook] Amount mismatch for order ${existingOrder.id}`, { expectedAmount, actualAmount });
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      // Currency matching
      if (currency && existingOrder.currency && currency.toUpperCase() !== existingOrder.currency.toUpperCase()) {
        logger.error(`[Sifalo Webhook] Currency mismatch for order ${existingOrder.id}`);
        return NextResponse.json({ error: 'Payment currency mismatch' }, { status: 400 });
      }

      // Status regression prevention
      if (existingOrder.status === PAYMENT_STATUS.COMPLETED && paymentStatus !== PAYMENT_STATUS.COMPLETED && paymentStatus !== PAYMENT_STATUS.REVERSED) {
        return NextResponse.json({ error: 'Status regression not allowed' }, { status: 400 });
      }
    }

    // ── Derive Cryptographic Deterministic Event ID ─────────────────────────
    const digest = crypto
      .createHash('sha256')
      .update(`SIFALO:${reference}:${normalizedStatus}:${numAmount}`)
      .digest('hex')
      .slice(0, 24);

    const eventIdToRecord = eventId || `${reference}_${normalizedStatus}_${digest}`;

    // ── Check if already durably processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: 'SIFALO',
          eventId: eventIdToRecord,
        },
      },
    });

    if (existingEvent && !existingEvent.eventType.endsWith('_PROCESSING')) {
      logger.info(`[Sifalo Webhook Idempotency] Event ref ${eventIdToRecord} already processed.`);
      return NextResponse.json({ received: true, action: 'already_processed_event' });
    }

    // ── Atomic Claim Insertion to prevent concurrency races ──────────────────
    if (!existingEvent) {
      try {
        await prisma.webhookEvent.create({
          data: {
            provider: 'SIFALO',
            eventId: eventIdToRecord,
            eventType: `${status}_PROCESSING`,
            payload: { reference, status, amount: numAmount, channel: channel || 'SIFALO' },
          },
        });
      } catch (claimErr: any) {
        // If unique constraint collision occurs, another concurrent worker claimed this event!
        if (claimErr?.code === 'P2002') {
          logger.info(`[Sifalo Webhook Concurrency] Event ${eventIdToRecord} claimed by concurrent worker.`);
          return NextResponse.json({ received: true, action: 'already_processed_event' });
        }
        throw claimErr;
      }
    }

    // ── Execute Payment State Transition ───────────────────────────────────
    let finalizeResult: any = null;
    try {
      if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
        finalizeResult = await finalizeSuccessfulPayment({
          orderIdOrRef: reference,
          provider: channel || 'SIFALO',
          providerRef: reference,
          providerPayload: { reference, status, amount: numAmount },
          authoritativeAmount: numAmount,
        });
      } else if (paymentStatus === PAYMENT_STATUS.REVERSED) {
        await handlePaymentReversal({
          orderIdOrRef: reference,
          provider: channel || 'SIFALO',
          reason: status,
          providerPayload: { reference, status, amount: numAmount },
        });
      } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
        await handlePaymentFailure({
          orderIdOrRef: reference,
          provider: channel || 'SIFALO',
          reason: status,
          providerPayload: { reference, status, amount: numAmount },
        });
      }

      // Mark event finalized
      await prisma.webhookEvent.update({
        where: { provider_eventId: { provider: 'SIFALO', eventId: eventIdToRecord } },
        data: { eventType: status },
      });
    } catch (processErr) {
      // If payment transition threw, remove or release claim so it can be retried
      await prisma.webhookEvent.delete({
        where: { provider_eventId: { provider: 'SIFALO', eventId: eventIdToRecord } },
      }).catch(() => {});
      throw processErr;
    }

    logger.info(`[Sifalo Webhook Success] Transaction ref ${reference} marked ${paymentStatus}`);

    // Re-fetch enrollment to ensure latest data for analytics & email
    const updatedEnrollment = await prisma.enrollment.findFirst({
      where: {
        OR: [
          { transactionRef: reference },
          ...(existingOrder ? [{ orderId: existingOrder.id }] : []),
        ],
      },
      include: { course: true, user: true },
    });

    if (updatedEnrollment) {
      // Track payment outcome in PostHog analytics
      await trackServerEvent(
        paymentStatus === PAYMENT_STATUS.COMPLETED ? ANALYTICS_EVENTS.PAYMENT_COMPLETED : ANALYTICS_EVENTS.PAYMENT_FAILED,
        updatedEnrollment.userId,
        {
          transactionRef: reference,
          courseId: updatedEnrollment.courseId,
          amount: numAmount ?? Number(updatedEnrollment.amountPaid),
          provider: channel || updatedEnrollment.provider,
          paymentStatus,
        }
      );

      // ── Dispatch purchase receipt email to Inngest ───────────────────────────
      // Dispatch only on first completion (finalizeResult.idempotent === false)
      // NOTE: Completion certificate is strictly NEVER issued on payment!
      // Certificates are exclusively issued when course progress reaches 100%.
      if (paymentStatus === PAYMENT_STATUS.COMPLETED && updatedEnrollment.user?.email && finalizeResult && !finalizeResult.idempotent) {
        inngest.send({
          name: 'email/send',
          data: {
            type: 'receipt',
            to: updatedEnrollment.user.email,
            data: {
              courseTitle: updatedEnrollment.course.title,
              amountPaid: numAmount ?? Number(updatedEnrollment.amountPaid),
              transactionRef: reference,
              provider: channel || updatedEnrollment.provider || 'Sifalo Pay',
            },
            idempotencyKey: `receipt/${reference}`,
          },
        }).catch((err) => {
          captureException(err, { context: 'inngest.send receipt inside sifalo webhook' });
        });
      }
    }

    return NextResponse.json({
      received: true,
      action: 'enrollment_updated',
      status: paymentStatus,
    });

  } catch (err: unknown) {
    captureException(err, { endpoint: 'POST /api/webhooks/sifalo' });
    logger.error('Sifalo webhook processing error', { error: String(err) });
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
