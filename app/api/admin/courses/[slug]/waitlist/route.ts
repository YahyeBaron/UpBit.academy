import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffOrAdmin, handleApiError } from '@/lib/auth-policy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await requireStaffOrAdmin();
    const { slug } = await params;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        waitlist: [],
        total: 0,
      });
    }

    const courses: any = await prisma.$queryRaw`
      SELECT "slug", "title", "isComingSoon", "releaseDate" FROM "Course" WHERE "slug" = ${slug} LIMIT 1
    `;
    const course = courses?.[0];

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const waitlist: any = await prisma.$queryRaw`
      SELECT "id", "email", "name", "createdAt", "userId"
      FROM "CourseWaitlist"
      WHERE "courseId" = ${slug}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({
      course,
      waitlist: waitlist || [],
      total: waitlist?.length || 0,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
