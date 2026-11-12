import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffOrAdmin, handleApiError, notFoundResponse, badRequestResponse } from '@/lib/auth-policy';
import { z } from 'zod';

const InstructorUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  title: z.string().trim().min(2, 'Title is required').max(150).optional(),
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(2000).optional(),
  avatar: z.string().trim().min(1, 'Avatar URL is required').optional(),
  cover: z.string().trim().optional(),
  expertise: z
    .array(z.string().trim().min(1))
    .or(z.string().transform((str) => str.split(',').map((s) => s.trim()).filter(Boolean)))
    .optional(),
  github: z.string().trim().optional().nullable(),
  twitter: z.string().trim().optional().nullable(),
  linkedin: z.string().trim().optional().nullable(),
});

// ── GET /api/admin/instructors/[id] ───────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    if (!process.env.DATABASE_URL) {
      const { INSTRUCTORS } = await import('@/lib/data');
      const found = INSTRUCTORS.find((i) => i.id === id);
      if (!found) return notFoundResponse('Instructor not found');
      return NextResponse.json({ instructor: found });
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        courseList: {
          where: { isDeleted: false },
          select: { slug: true, title: true, isPublished: true },
        },
      },
    });

    if (!instructor) {
      return notFoundResponse('Instructor not found');
    }

    return NextResponse.json({ instructor });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ── PUT /api/admin/instructors/[id] ───────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return badRequestResponse('Invalid JSON body');

    const parsed = InstructorUpdateSchema.parse(body);

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Instructor updated (mock mode)',
        instructor: { id, ...parsed },
      });
    }

    const existing = await prisma.instructor.findUnique({
      where: { id },
    });

    if (!existing) {
      return notFoundResponse('Instructor not found');
    }

    const updated = await prisma.instructor.update({
      where: { id },
      data: {
        name: parsed.name !== undefined ? parsed.name : undefined,
        title: parsed.title !== undefined ? parsed.title : undefined,
        bio: parsed.bio !== undefined ? parsed.bio : undefined,
        avatar: parsed.avatar !== undefined ? parsed.avatar : undefined,
        cover: parsed.cover !== undefined ? parsed.cover : undefined,
        expertise: parsed.expertise !== undefined ? parsed.expertise : undefined,
        github: parsed.github !== undefined ? parsed.github : undefined,
        twitter: parsed.twitter !== undefined ? parsed.twitter : undefined,
        linkedin: parsed.linkedin !== undefined ? parsed.linkedin : undefined,
      },
    });

    return NextResponse.json({
      message: 'Instructor updated successfully',
      instructor: updated,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ── DELETE /api/admin/instructors/[id] ────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Instructor deleted (mock mode)' });
    }

    // Safety check: ensure no active courses are assigned to this instructor
    const linkedCoursesCount = await prisma.course.count({
      where: { instructorId: id, isDeleted: false },
    });

    if (linkedCoursesCount > 0) {
      return badRequestResponse(
        `Cannot delete instructor: ${linkedCoursesCount} active course(s) are currently assigned to this instructor. Please reassign the courses first.`
      );
    }

    await prisma.instructor.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Instructor deleted successfully',
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
