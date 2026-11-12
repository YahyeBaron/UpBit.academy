import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminCoursesAsync } from '@/lib/db-data';
import { requireStaffOrAdmin, handleApiError } from '@/lib/auth-policy';
import { CourseCreateSchema } from '@/lib/validation-schemas';
import { getCourseImageUrl } from '@/lib/course-image';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireStaffOrAdmin();

    const courses = await getAdminCoursesAsync();
    return NextResponse.json({ courses });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaffOrAdmin();

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Validate request body using Zod schema
    const parsedData = CourseCreateSchema.parse(rawBody);

    const generatedSlug =
      parsedData.slug ||
      parsedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const resolvedImage = getCourseImageUrl(parsedData.image);
    const resolvedOriginalPrice =
      parsedData.originalPrice !== undefined
        ? parsedData.originalPrice
        : Math.round(parsedData.price * 1.5 * 100) / 100;

    // Check slug uniqueness if DB is available
    if (process.env.DATABASE_URL) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug: generatedSlug },
      });

      if (existingCourse) {
        return NextResponse.json(
          { error: 'A course with this slug already exists.' },
          { status: 400 }
        );
      }

      let instructorId = parsedData.instructorId;
      let instructorName = 'Yahye Baron';
      const foundInstructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
      });

      if (foundInstructor) {
        instructorName = foundInstructor.name;
      } else {
        const firstInst = await prisma.instructor.findFirst();
        if (firstInst) {
          instructorId = firstInst.id;
          instructorName = firstInst.name;
        }
      }

      const totalLessons = parsedData.curriculum
        ? parsedData.curriculum.reduce((acc, s) => acc + s.lessons.length, 0)
        : 1;

      const newCourse = await prisma.course.create({
        data: {
          slug: generatedSlug,
          title: parsedData.title,
          tagline: parsedData.tagline || parsedData.title,
          category: parsedData.category,
          level: parsedData.level,
          price: parsedData.price,
          originalPrice: resolvedOriginalPrice,
          description: parsedData.description,
          longDescription: parsedData.longDescription || parsedData.description,
          image: resolvedImage,
          tags: parsedData.tags,
          instructorId,
          instructors: [instructorName],
          rating: 5.0,
          reviews: 0,
          students: 0,
          duration: parsedData.duration,
          totalLessons,
          includes: ['Lifetime Access', 'Certificate of Completion'],
          whatYouLearn: ['Build modern web applications'],
          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isPublished: parsedData.isPublished,
          isComingSoon: parsedData.isComingSoon ?? false,
          releaseDate: parsedData.releaseDate ?? null,
          seriesName: parsedData.seriesName ?? null,
          seriesOrder: parsedData.seriesOrder ?? null,
          nextCourseSlug: parsedData.nextCourseSlug ?? null,
          hasCertificate: parsedData.hasCertificate,
          totalHours: parsedData.totalHours,
          completionCriteria: parsedData.completionCriteria,
          curriculum: parsedData.curriculum
            ? {
                create: parsedData.curriculum.map((sec, i) => ({
                  title: sec.title || `Section ${i + 1}`,
                  order: sec.order ?? i + 1,
                  lessons: {
                    create: (sec.lessons || []).map((les, j) => ({
                      id: les.id || `les-${Date.now()}-${i}-${j}`,
                      title: les.title || `Lesson ${j + 1}`,
                      duration: les.duration || '10:00',
                      type: les.type || 'video',
                      preview: les.preview ?? false,
                      muxPlaybackId: les.muxPlaybackId || null,
                      order: les.order ?? j + 1,
                    })),
                  },
                })),
              }
            : undefined,
        },
      });

      revalidatePath('/courses');
      revalidatePath('/admin/courses');
      revalidatePath('/admin');

      const courseDTO = {
        ...newCourse,
        price: Number(newCourse.price),
        originalPrice: Number(newCourse.originalPrice),
        totalHours: Number(newCourse.totalHours),
      };

      return NextResponse.json({ course: courseDTO, message: 'Course created successfully' }, { status: 201 });
    }

    return NextResponse.json(
      {
        course: {
          slug: generatedSlug,
          ...parsedData,
          image: resolvedImage,
          originalPrice: resolvedOriginalPrice,
        },
        message: 'Course validated and created (mock mode)',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return handleApiError(error);
  }
}
