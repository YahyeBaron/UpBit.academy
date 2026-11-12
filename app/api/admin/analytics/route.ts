import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOnly, handleApiError, badRequestResponse } from '@/lib/auth-policy';

export async function GET(req: NextRequest) {
  try {
    await requireAdminOnly();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'overview';
    const courseSlug = searchParams.get('courseSlug');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        totalCourses: 6,
        totalStudents: 1240,
        totalRevenue: 48920,
        recentEnrollments: [],
        period: 'mock',
      });
    }

    // Overview Statistics
    if (type === 'overview') {
      const [totalCourses, totalStudents, revenueAggregation, recentEnrollments] = await Promise.all([
        prisma.course.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { role: { in: ['student', 'STUDENT'] } } }),
        prisma.enrollment.aggregate({
          _sum: { amountPaid: true },
          where: { paymentStatus: 'COMPLETED' },
        }),
        prisma.enrollment.findMany({
          where: { paymentStatus: 'COMPLETED' },
          include: {
            user: { select: { name: true, email: true } },
            course: { select: { title: true, slug: true } },
          },
          orderBy: { enrolledAt: 'desc' },
          take: 10,
        }),
      ]);

      return NextResponse.json({
        totalCourses,
        totalStudents,
        totalRevenue: revenueAggregation._sum.amountPaid || 0,
        recentEnrollments,
      });
    }

    // Course Specific Analytics
    if (type === 'course' && courseSlug) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: courseSlug },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      const totalRevenue = enrollments
        .filter((e) => e.paymentStatus === 'COMPLETED')
        .reduce((sum, e) => sum + (Number(e.amountPaid) || 0), 0);

      const completedPayments = enrollments.filter((e) => e.paymentStatus === 'COMPLETED').length;

      return NextResponse.json({
        courseSlug,
        totalEnrollments: enrollments.length,
        completedPayments,
        totalRevenue,
        averageRevenuePerUser: completedPayments > 0 ? Math.round((totalRevenue / completedPayments) * 100) / 100 : 0,
        enrollments,
      });
    }

    // Payment Provider Breakdown (ZAAD, EDAHAB, EVC Plus, etc.)
    if (type === 'providers') {
      const providerBreakdown = await prisma.enrollment.groupBy({
        by: ['provider'],
        where: { paymentStatus: 'COMPLETED' },
        _sum: { amountPaid: true },
        _count: true,
      });

      return NextResponse.json({ providerBreakdown });
    }

    return badRequestResponse('Invalid analytics query type');
  } catch (error: any) {
    return handleApiError(error);
  }
}
