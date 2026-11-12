import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  resolveCourseBySlug,
  handleApiError,
  badRequestResponse,
  conflictResponse,
  notFoundResponse,
  unauthorizedResponse,
} from '@/lib/auth-policy';
import { logger } from '@/lib/logger';

import { checkEnrollment } from '@/lib/payments/service';

// ─────────────────────────────────────────────
// GET /api/enroll?courseId=x
// Returns enrollment status for the current user
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const isPrivileged = dbUser.role === 'ADMIN' || dbUser.role === 'INSTRUCTOR';

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        isEnrolled: false,
        enrolledCourseIds: [],
        isAdmin: isPrivileged,
        isPrivileged,
      });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: dbUser.id, paymentStatus: 'COMPLETED' },
      select: { courseId: true },
    });

    // courseId already stores the course slug (it's the Course primary key)
    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    if (!courseId) {
      return NextResponse.json({
        enrolledCourseIds,
        isEnrolled: false,
        isAdmin: isPrivileged,
        isPrivileged,
      });
    }

    // Strict enrollment validation: must be an active, verified COMPLETED record
    const check = await checkEnrollment(dbUser.id, courseId);
    return NextResponse.json({
      isEnrolled: check.isEnrolled,
      enrolledCourseIds,
      isAdmin: isPrivileged,
      isPrivileged,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// POST /api/enroll
// Creates a free or verified payment-triggered enrollment.
// Direct paid enrollment without verified order is blocked.
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const body = await req.json().catch(() => null);
    if (!body || !body.courseId) {
      return badRequestResponse('Missing courseId');
    }

    const { courseId, transactionRef, amountPaid = 0 } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Enrolled successfully (no-DB mode)',
        enrollment: { userId: dbUser.id, courseId, progress: 0, paymentStatus: 'COMPLETED' },
      });
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { slug: courseId, isDeleted: false, isPublished: true },
      select: { slug: true, price: true, isComingSoon: true, releaseDate: true },
    });

    if (!course) {
      return notFoundResponse('Course not found or not currently available');
    }

    if ((course as any).isComingSoon && dbUser.role !== 'ADMIN' && dbUser.role !== 'INSTRUCTOR') {
      return badRequestResponse('This course is currently in Coming Soon mode and enrollment is locked. Please join the waitlist.');
    }

    // Verify paid courses have a verified completed order or existing completed payment record
    const isPaidCourse = Number(course.price) > 0;
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dbUser.id, courseId } },
    });

    let verifiedOrderId: string | null = null;

    if (isPaidCourse) {
      const isAlreadyPaid = existing?.paymentStatus === 'COMPLETED';

      if (!isAlreadyPaid) {
        // Strict requirement: paid courses MUST have a verified COMPLETED order in DB
        const matchingCompletedOrder = await prisma.checkoutOrder.findFirst({
          where: {
            userId: dbUser.id,
            courseId,
            status: 'COMPLETED',
          },
        });

        if (!matchingCompletedOrder) {
          return badRequestResponse('Paid courses require a completed and verified checkout order. Direct paid enrollment is not allowed.');
        }

        verifiedOrderId = matchingCompletedOrder.id;
      }
    }

    // Guard against duplicate paid enrollments with different payment refs
    if (existing?.paymentStatus === 'COMPLETED' && transactionRef && existing.transactionRef && existing.transactionRef !== transactionRef) {
      return conflictResponse('An active enrollment for this course already exists');
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: dbUser.id, courseId } },
      update: {
        // Preserve existing completed payment state & financial attributes
        ...(existing?.paymentStatus === 'COMPLETED'
          ? {}
          : {
              paymentStatus: 'COMPLETED',
              ...(transactionRef ? { transactionRef } : {}),
              ...(amountPaid > 0 ? { amountPaid } : {}),
              ...(verifiedOrderId ? { orderId: verifiedOrderId } : {}),
            }),
      },
      create: {
        userId: dbUser.id,
        courseId,
        progress: 0,
        paymentStatus: 'COMPLETED',
        transactionRef: transactionRef || undefined,
        amountPaid: isPaidCourse ? amountPaid : 0,
        orderId: verifiedOrderId || undefined,
      },
    });

    logger.info('User enrolled', { userId: dbUser.id, courseId, paymentStatus: 'COMPLETED' });

    return NextResponse.json({ message: 'Enrolled successfully', enrollment }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
