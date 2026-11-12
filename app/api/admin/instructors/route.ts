import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStaffOrAdmin, handleApiError, badRequestResponse } from '@/lib/auth-policy';
import { z } from 'zod';

const InstructorInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, 'Instructor ID must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'ID can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  title: z.string().trim().min(2, 'Title is required').max(150),
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(2000),
  avatar: z.string().trim().min(1, 'Avatar URL is required'),
  cover: z.string().trim().optional().default('/assets/The20Ultimate20Next.png'),
  expertise: z
    .array(z.string().trim().min(1))
    .or(z.string().transform((str) => str.split(',').map((s) => s.trim()).filter(Boolean)))
    .default(['Coding']),
  github: z.string().trim().optional().nullable(),
  twitter: z.string().trim().optional().nullable(),
  linkedin: z.string().trim().optional().nullable(),
});

// ── GET /api/admin/instructors ────────────────────────────────────────────────
export async function GET() {
  try {
    await requireStaffOrAdmin();

    if (!process.env.DATABASE_URL) {
      const { INSTRUCTORS } = await import('@/lib/data');
      return NextResponse.json({ instructors: INSTRUCTORS });
    }

    const instructors = await prisma.instructor.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            courseList: { where: { isDeleted: false } },
          },
        },
      },
    });

    const formatted = instructors.map((inst) => ({
      id: inst.id,
      name: inst.name,
      title: inst.title,
      bio: inst.bio,
      avatar: inst.avatar,
      cover: inst.cover,
      rating: inst.rating,
      reviews: inst.reviews,
      students: inst.students,
      coursesCount: inst._count?.courseList ?? 0,
      expertise: inst.expertise,
      social: {
        github: inst.github || undefined,
        twitter: inst.twitter || undefined,
        linkedin: inst.linkedin || undefined,
      },
    }));

    return NextResponse.json({ instructors: formatted });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ── POST /api/admin/instructors ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await requireStaffOrAdmin();

    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON body');
    }

    const parsed = InstructorInputSchema.parse(body);

    const generatedId =
      parsed.id ||
      parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Instructor created (mock mode)',
        instructor: { id: generatedId, ...parsed },
      });
    }

    // Check for existing ID
    const existing = await prisma.instructor.findUnique({
      where: { id: generatedId },
    });

    if (existing) {
      return badRequestResponse(`An instructor with ID '${generatedId}' already exists.`);
    }

    const newInstructor = await prisma.instructor.create({
      data: {
        id: generatedId,
        name: parsed.name,
        title: parsed.title,
        bio: parsed.bio,
        avatar: parsed.avatar,
        cover: parsed.cover || '/assets/The20Ultimate20Next.png',
        expertise: parsed.expertise,
        github: parsed.github || null,
        twitter: parsed.twitter || null,
        linkedin: parsed.linkedin || null,
        rating: 5.0,
        reviews: 0,
        students: 0,
        courses: 0,
      },
    });

    return NextResponse.json(
      { message: 'Instructor created successfully', instructor: newInstructor },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
