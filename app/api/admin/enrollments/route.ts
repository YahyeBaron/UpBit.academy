import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly, handleApiError, badRequestResponse, notFoundResponse } from '@/lib/auth-policy';
import { ManualEnrollmentSchema } from '@/lib/validation-schemas';

export async function GET(req: NextRequest) {
  try {
    await requireAdminOnly();

    const { searchParams } = new URL(req.url);
    const courseSlug = searchParams.get('courseSlug');
    const status = searchParams.get('status');

    const where: any = {
      ...(courseSlug ? { courseId: courseSlug } : {}),
      ...(status ? { paymentStatus: status } : {}),
    };

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ enrollments: [] });
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { slug: true, title: true, price: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ enrollments });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOnly();

    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    const parsed = ManualEnrollmentSchema.parse(body);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Manual enrollment simulated (no DB)' });
    }

    // Find or create student user by email
    let user = await prisma.user.findUnique({
      where: { email: parsed.studentEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: parsed.studentEmail,
          name: parsed.studentEmail.split('@')[0],
          clerkId: `manual_${Date.now()}`,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: 'STUDENT',
          joinedDate: new Date().toISOString(),
        },
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { slug: parsed.courseSlug },
    });

    if (!course) {
      return notFoundResponse('Course not found');
    }

    // Upsert enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.slug,
        },
      },
      update: {
        paymentStatus: parsed.paymentStatus,
        amountPaid: parsed.amountPaid,
        provider: parsed.provider,
      },
      create: {
        userId: user.id,
        courseId: course.slug,
        progress: 0,
        paymentStatus: parsed.paymentStatus,
        amountPaid: parsed.amountPaid,
        provider: parsed.provider,
        transactionRef: `MANUAL-${Date.now()}`,
      },
    });

    return NextResponse.json({ enrollment, message: 'Student enrolled successfully' }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdminOnly();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return badRequestResponse('Enrollment ID is required');
    }

    if (process.env.DATABASE_URL) {
      await prisma.enrollment.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true, message: 'Enrollment revoked' });
  } catch (error: any) {
    return handleApiError(error);
  }
}
