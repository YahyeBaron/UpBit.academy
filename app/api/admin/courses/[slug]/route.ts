import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminCourseBySlugAsync } from '@/lib/db-data';
import { requireStaffOrAdmin, requireAdminOnly, handleApiError } from '@/lib/auth-policy';
import { CourseUpdateSchema } from '@/lib/validation-schemas';
import { getCourseImageUrl } from '@/lib/course-image';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireStaffOrAdmin();

    const course = await getAdminCourseBySlugAsync(slug);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireStaffOrAdmin();

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsedData = CourseUpdateSchema.parse(rawBody);

    if (process.env.DATABASE_URL) {
      const existing = await prisma.course.findUnique({
        where: { slug },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      const totalLessons = parsedData.curriculum
        ? parsedData.curriculum.reduce((acc, s) => acc + s.lessons.length, 0)
        : parsedData.totalLessons !== undefined
        ? parsedData.totalLessons
        : undefined;

      let instructorName: string | undefined = undefined;
      if (parsedData.instructorId) {
        const inst = await prisma.instructor.findUnique({
          where: { id: parsedData.instructorId },
          select: { name: true },
        });
        if (inst) {
          instructorName = inst.name;
        }
      }

      const updatedCourse = await prisma.$transaction(async (tx) => {
        const course = await tx.course.update({
          where: { slug },
          data: {
            title: parsedData.title !== undefined ? parsedData.title : undefined,
            tagline: parsedData.tagline !== undefined ? parsedData.tagline : undefined,
            category: parsedData.category !== undefined ? parsedData.category : undefined,
            level: parsedData.level !== undefined ? parsedData.level : undefined,
            price: parsedData.price !== undefined ? parsedData.price : undefined,
            originalPrice: parsedData.originalPrice !== undefined ? parsedData.originalPrice : undefined,
            description: parsedData.description !== undefined ? parsedData.description : undefined,
            longDescription: parsedData.longDescription !== undefined ? parsedData.longDescription : undefined,
            image: parsedData.image !== undefined ? getCourseImageUrl(parsedData.image) : undefined,
            tags: parsedData.tags !== undefined ? parsedData.tags : undefined,
            duration: parsedData.duration !== undefined ? parsedData.duration : undefined,
            isPublished: parsedData.isPublished !== undefined ? parsedData.isPublished : undefined,
            hasCertificate: parsedData.hasCertificate !== undefined ? parsedData.hasCertificate : undefined,
            totalHours: parsedData.totalHours !== undefined ? parsedData.totalHours : undefined,
            completionCriteria: parsedData.completionCriteria !== undefined ? parsedData.completionCriteria : undefined,
            totalLessons: totalLessons !== undefined ? totalLessons : undefined,
            instructorId: parsedData.instructorId !== undefined ? parsedData.instructorId : undefined,
            ...(instructorName ? { instructors: [instructorName] } : {}),
            isComingSoon: parsedData.isComingSoon !== undefined ? parsedData.isComingSoon : undefined,
            releaseDate: parsedData.releaseDate !== undefined ? parsedData.releaseDate : undefined,
            seriesName: parsedData.seriesName !== undefined ? parsedData.seriesName : undefined,
            seriesOrder: parsedData.seriesOrder !== undefined ? parsedData.seriesOrder : undefined,
            nextCourseSlug: parsedData.nextCourseSlug !== undefined ? parsedData.nextCourseSlug : undefined,
            lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          },
        });

        // Update curriculum sections & lessons if provided
        if (parsedData.curriculum && Array.isArray(parsedData.curriculum)) {
          await tx.curriculumSection.deleteMany({
            where: { courseId: slug },
          });

          for (let i = 0; i < parsedData.curriculum.length; i++) {
            const sec = parsedData.curriculum[i];
            await tx.curriculumSection.create({
              data: {
                courseId: slug,
                title: sec.title || `Section ${i + 1}`,
                order: sec.order ?? i + 1,
                lessons: {
                  create: (sec.lessons || []).map((les, j) => ({
                    id: les.id || `les-${Date.now()}-${i}-${j}`,
                    title: les.title || `Lesson ${j + 1}`,
                    duration: les.duration || '10m',
                    type: les.type || 'video',
                    preview: les.preview || false,
                    muxPlaybackId: les.muxPlaybackId || null,
                    order: les.order ?? j + 1,
                  })),
                },
              },
            });
          }
        }

        return course;
      }, { maxWait: 15000, timeout: 60000 });

      revalidatePath('/courses');
      revalidatePath(`/courses/${slug}`);
      revalidatePath('/admin/courses');
      revalidatePath(`/admin/courses/${slug}/edit`);
      revalidatePath('/admin');

      const courseDTO = {
        ...updatedCourse,
        price: Number(updatedCourse.price),
        originalPrice: Number(updatedCourse.originalPrice),
        totalHours: Number(updatedCourse.totalHours),
      };

      return NextResponse.json({ course: courseDTO, message: 'Course updated successfully' });
    }

    return NextResponse.json({
      message: 'Course changes saved (mock mode)',
      course: { slug, ...parsedData },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ── Soft Delete Course (Archive) ──────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authContext = await requireStaffOrAdmin();
    const adminName = authContext.isDatabaseAdmin
      ? authContext.admin?.username || 'ADMIN'
      : authContext.user?.name || 'STAFF';

    if (process.env.DATABASE_URL) {
      await prisma.course.update({
        where: { slug },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminName,
          isPublished: false,
        },
      });

      revalidatePath('/courses');
      revalidatePath(`/courses/${slug}`);
      revalidatePath('/admin/courses');
    }

    return NextResponse.json({ message: `Course ${slug} archived successfully (soft-deleted)` });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// ── Restore Archived Course ───────────────────────────────────────────────────
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireAdminOnly();

    const body = await req.json().catch(() => null);
    if (body?.action === 'restore') {
      const publishOnRestore = body.publishOnRestore === true;

      if (process.env.DATABASE_URL) {
        await prisma.course.update({
          where: { slug },
          data: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            isPublished: publishOnRestore,
          },
        });

        revalidatePath('/courses');
        revalidatePath(`/courses/${slug}`);
        revalidatePath('/admin/courses');
      }
      return NextResponse.json({
        message: `Course ${slug} restored successfully (${publishOnRestore ? 'published' : 'saved as draft'})`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
