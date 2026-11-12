import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  requireCourseAccess,
  handleApiError,
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/auth-policy';
import { logger } from '@/lib/logger';

/**
 * Generates a cryptographically secure, human-readable verification code.
 * Format: CERT-XXXX-XXXX-XXXX (16-char uppercase hex)
 */
function generateVerificationCode(): string {
  const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
  const part1 = randomBytes.slice(0, 4);
  const part2 = randomBytes.slice(4, 8);
  const part3 = randomBytes.slice(8, 12);
  const part4 = randomBytes.slice(12, 16);
  return `CERT-${part1}-${part2}-${part3}-${part4}`;
}

// ─────────────────────────────────────────────
// GET /api/certificates?code=x OR ?courseId=y
// - ?code=x: Public certificate verification (no auth required)
// - ?courseId=y: Authenticated certificate issuance/retrieval
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const courseId = searchParams.get('courseId');

    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === 'production') {
        return serverErrorResponse('Database connection not configured');
      }
      // Non-production fallback for local development without DB
      if (code) {
        return NextResponse.json({
          certificate: {
            id: 'mock-cert-id',
            verificationCode: code,
            issuedAt: new Date().toISOString(),
            studentName: 'Demo Student',
            courseTitle: 'Demo Course',
            courseSlug: 'demo-course',
            instructors: ['BIT Academy'],
          },
          isValid: true,
        });
      }
      return NextResponse.json({
        certificate: {
          id: 'mock-cert-id',
          verificationCode: 'CERT-DEMO-LOCAL-ONLY',
          issuedAt: new Date().toISOString(),
          user: { name: 'Demo Student', email: 'student@example.com' },
          course: { title: 'Demo Course', slug: courseId || 'demo-course', instructors: ['BIT Academy'] },
        },
      });
    }

    // ─────────────────────────────────────────
    // 1. PUBLIC CERTIFICATE VERIFICATION BY CODE
    // ─────────────────────────────────────────
    if (code) {
      const certificate = await prisma.certificate.findUnique({
        where: { verificationCode: code },
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          course: { select: { title: true, slug: true, duration: true, instructors: true } },
        },
      });

      if (!certificate) {
        return notFoundResponse('Certificate not found or verification code is invalid');
      }

      return NextResponse.json({
        certificate: {
          id: certificate.id,
          verificationCode: certificate.verificationCode,
          issuedAt: certificate.issuedAt.toISOString(),
          studentName: certificate.user.name,
          courseTitle: certificate.course.title,
          courseSlug: certificate.course.slug,
          instructors: certificate.course.instructors,
        },
        isValid: true,
      });
    }

    // ─────────────────────────────────────────
    // 2. AUTHENTICATED CERTIFICATE ISSUANCE BY COURSE ID
    // ─────────────────────────────────────────
    if (courseId) {
      const dbUser = await requireAuthUser();

      // Enforce course access / active enrollment check
      await requireCourseAccess(dbUser.id, dbUser.role, courseId);

      // Verify certificate eligibility for this course
      const targetCourse = await prisma.course.findUnique({
        where: { slug: courseId },
        select: { hasCertificate: true },
      });

      if (targetCourse && targetCourse.hasCertificate === false) {
        return badRequestResponse('Certificates are not available for this course');
      }

      // Check if certificate already exists (idempotent lookup)
      const existingCert = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId: dbUser.id, courseId } },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true, slug: true, instructors: true } },
        },
      });

      if (existingCert) {
        return NextResponse.json({ certificate: existingCert });
      }

      // Authoritative server-side completion recalculation:
      // Count total published lessons in course vs user completed lessons
      const totalLessons = await prisma.lesson.count({
        where: { section: { courseId } },
      });

      const completedCount = await prisma.lessonProgress.count({
        where: { userId: dbUser.id, courseId, completed: true },
      });

      const calculatedProgress =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      // Restrict certificate issuance to 100% completion (with Admin role bypass)
      if (calculatedProgress < 100 && dbUser.role !== 'ADMIN') {
        logger.warn('Certificate issuance rejected: incomplete course', {
          userId: dbUser.id,
          courseId,
          completedCount,
          totalLessons,
          calculatedProgress,
        });
        return badRequestResponse(
          `Course completion requirements not fulfilled (${completedCount}/${totalLessons} lessons completed, ${calculatedProgress}%)`
        );
      }

      // Generate cryptographically safe verification code
      const verificationCode = generateVerificationCode();

      // Idempotently create certificate record
      const certificate = await prisma.certificate.upsert({
        where: { userId_courseId: { userId: dbUser.id, courseId } },
        update: {},
        create: {
          userId: dbUser.id,
          courseId,
          verificationCode,
        },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true, slug: true, instructors: true } },
        },
      });

      logger.info('Certificate issued', {
        certificateId: certificate.id,
        userId: dbUser.id,
        courseId,
        verificationCode: certificate.verificationCode,
      });

      return NextResponse.json({ certificate }, { status: 201 });
    }

    return badRequestResponse('Missing code or courseId query parameter');
  } catch (error) {
    return handleApiError(error);
  }
}
