import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { z } from 'zod';

const WaitlistJoinSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase()),
  name: z.string().trim().max(100).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => null);

    const parseResult = WaitlistJoinSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues?.[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, name } = parseResult.data;

    // Optional auth user check
    const authUser = await getCurrentDbUserAsync().catch(() => null);

    if (process.env.DATABASE_URL) {
      const courses: any = await prisma.$queryRaw`
        SELECT "slug", "title", "isPublished", "isComingSoon", "releaseDate"
        FROM "Course"
        WHERE "slug" = ${slug} AND "isDeleted" = false
        LIMIT 1
      `;
      const course = courses?.[0];

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Check if already on waitlist
      const existing: any = await prisma.$queryRaw`
        SELECT "id" FROM "CourseWaitlist"
        WHERE "courseId" = ${slug} AND "email" = ${email}
        LIMIT 1
      `;

      const countResult: any = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "CourseWaitlist" WHERE "courseId" = ${slug}
      `;
      const currentCount = Number(countResult?.[0]?.count ?? 0);

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          alreadyJoined: true,
          message: "You're already on the priority waitlist for this course!",
          waitlistCount: currentCount,
        });
      }

      // Insert new waitlist entry
      const newId = crypto.randomUUID();
      const userName = name || authUser?.name || null;
      const userId = authUser?.id || null;

      await prisma.$executeRaw`
        INSERT INTO "CourseWaitlist" ("id", "courseId", "email", "name", "userId", "createdAt")
        VALUES (${newId}, ${slug}, ${email}, ${userName}, ${userId}, NOW())
        ON CONFLICT ("courseId", "email") DO NOTHING
      `;

      return NextResponse.json({
        success: true,
        alreadyJoined: false,
        message: 'Successfully joined the waitlist! We will notify you when enrollment opens.',
        waitlistCount: currentCount + 1,
      });
    }

    // Fallback if no DATABASE_URL configured
    return NextResponse.json({
      success: true,
      alreadyJoined: false,
      message: 'Successfully joined the waitlist!',
      waitlistCount: 42,
    });
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authUser = await getCurrentDbUserAsync().catch(() => null);
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email')?.toLowerCase();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        waitlistCount: 0,
        isUserWaitlisted: false,
      });
    }

    const countResult: any = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "CourseWaitlist" WHERE "courseId" = ${slug}
    `;
    const count = Number(countResult?.[0]?.count ?? 0);

    let isUserWaitlisted = false;
    const targetEmail = authUser?.email || emailParam;

    if (targetEmail) {
      const entry: any = await prisma.$queryRaw`
        SELECT "id" FROM "CourseWaitlist"
        WHERE "courseId" = ${slug} AND "email" = ${targetEmail}
        LIMIT 1
      `;
      isUserWaitlisted = Boolean(entry && entry.length > 0);
    }

    return NextResponse.json({
      waitlistCount: count,
      isUserWaitlisted,
    });
  } catch (error: any) {
    console.error('Error checking waitlist status:', error);
    return NextResponse.json(
      { error: 'Failed to check waitlist status' },
      { status: 500 }
    );
  }
}
