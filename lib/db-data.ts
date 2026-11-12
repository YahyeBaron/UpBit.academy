import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { COURSES, INSTRUCTORS, Course, Instructor, Lesson } from './data';
import { withDbRetry } from './prisma';
import { logger } from './logger';

// ───────────────────────────────────────────
// ENVIRONMENT BEHAVIOR
// ───────────────────────────────────────────
// In production (NODE_ENV === 'production'), we NEVER silently substitute
// database failures or missing data with static mock fixtures.
// ALLOW_STATIC_FALLBACK=true enables static fallback explicitly (dev/demo only).
const isProduction = process.env.NODE_ENV === 'production';
const allowStaticFallback = process.env.ALLOW_STATIC_FALLBACK === 'true';
const canUseFallback = !isProduction || allowStaticFallback;

// ───────────────────────────────────────────
// PRISMA ORM DATABASE QUERIES (SERVER ONLY, REACT CACHED)
// ───────────────────────────────────────────

export const getCourseAndInstructorAsync = cache(
  async (slug: string): Promise<{ course?: Course; instructor?: Instructor; error?: string }> => {
    noStore();

    // No DATABASE_URL: only return static data if fallback is allowed
    if (!process.env.DATABASE_URL) {
      if (!canUseFallback) {
        logger.error('Database is not configured in production', undefined, { slug });
        return { error: 'Database is not configured' };
      }
      const course = COURSES.find((c) => c.slug === slug);
      const instructor = course ? INSTRUCTORS.find((i) => i.id === course.instructorId) : undefined;
      return { course, instructor };
    }

    try {
      const { prisma } = await import('@/lib/prisma');
      const course = await withDbRetry(() =>
        prisma.course.findUnique({
          where: { slug, isDeleted: false },
          include: {
            instructor: true,
            curriculum: {
              orderBy: { order: 'asc' },
              include: {
                lessons: { orderBy: { order: 'asc' } },
              },
            },
          },
        })
      );

      // Course not in DB: no fallback in production
      if (!course) {
        if (canUseFallback) {
          logger.warn('Course not found in DB, using static fallback', { slug });
          const fallbackCourse = COURSES.find((c) => c.slug === slug);
          const fallbackInstructor = fallbackCourse
            ? INSTRUCTORS.find((i) => i.id === fallbackCourse.instructorId)
            : undefined;
          return { course: fallbackCourse, instructor: fallbackInstructor };
        }
        return {}; // Not found, no error — let callers render 404
      }

      const formattedCourse: Course = {
        slug: course.slug,
        title: course.title,
        tagline: course.tagline,
        category: course.category as Course['category'],
        image: course.image,
        description: course.description,
        longDescription: course.longDescription,
        instructorId: course.instructorId,
        instructors: course.instructors,
        rating: course.rating,
        reviews: course.reviews,
        students: course.students,
        duration: course.duration,
        totalLessons: course.totalLessons,
        level: course.level as Course['level'],
        price: Number(course.price),
        originalPrice: Number(course.originalPrice),
        tags: course.tags,
        lastUpdated: course.lastUpdated,
        includes: course.includes,
        whatYouLearn: course.whatYouLearn,
        hasCertificate: (course as any).hasCertificate ?? true,
        totalHours: Number((course as any).totalHours ?? 0),
        completionCriteria: (course as any).completionCriteria ?? 'Complete all lessons and knowledge checks to earn your certificate.',
        isPublished: course.isPublished ?? true,
        isComingSoon: (course as any).isComingSoon ?? false,
        releaseDate: (course as any).releaseDate ?? undefined,
        seriesName: (course as any).seriesName ?? undefined,
        seriesOrder: (course as any).seriesOrder ?? undefined,
        nextCourseSlug: (course as any).nextCourseSlug ?? undefined,
        waitlistCount: (course as any)._count?.waitlistEntries ?? ((course as any).waitlistEntries?.length ?? 0),
        isDeleted: course.isDeleted ?? false,
        curriculum: course.curriculum.map((sec) => ({
          title: sec.title,
          lessons: sec.lessons.map((les) => ({
            id: les.id,
            title: les.title,
            duration: les.duration,
            type: les.type as Lesson['type'],
            preview: les.preview,
            muxPlaybackId: les.muxPlaybackId ?? undefined,
          })),
        })),
      };

      const formattedInstructor: Instructor | undefined = course.instructor
        ? {
            id: course.instructor.id,
            name: course.instructor.name,
            title: course.instructor.title,
            bio: course.instructor.bio,
            avatar: course.instructor.avatar,
            cover: course.instructor.cover,
            rating: course.instructor.rating,
            reviews: course.instructor.reviews,
            students: course.instructor.students,
            courses: course.instructor.courses,
            expertise: course.instructor.expertise,
            social: {
              github: course.instructor.github ?? undefined,
              twitter: course.instructor.twitter ?? undefined,
              linkedin: course.instructor.linkedin ?? undefined,
            },
          }
        : undefined;

      return { course: formattedCourse, instructor: formattedInstructor };
    } catch (error) {
      if (canUseFallback) {
        logger.warn('Prisma DB query failed, using static fallback', { slug });
        const fallbackCourse = COURSES.find((c) => c.slug === slug);
        const fallbackInstructor = fallbackCourse
          ? INSTRUCTORS.find((i) => i.id === fallbackCourse.instructorId)
          : undefined;
        return { course: fallbackCourse, instructor: fallbackInstructor };
      }

      // Production: surface the error, never silently substitute
      logger.error('Prisma DB query failed in production for getCourseAndInstructorAsync', error, { slug });
      return { error: 'Database error occurred. Please try again later.' };
    }
  }
);

export const getCourseAsync = cache(async (slug: string): Promise<Course | undefined> => {
  const { course } = await getCourseAndInstructorAsync(slug);
  return course;
});

export const getCoursesAsync = cache(async (): Promise<Course[]> => {
  noStore();

  if (!process.env.DATABASE_URL) {
    if (!canUseFallback) {
      logger.error('Database is not configured in production for getCoursesAsync');
      return [];
    }
    return COURSES;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const courses = await withDbRetry(() =>
      prisma.course.findMany({
        where: { isDeleted: false, isPublished: true },
        include: {
          instructor: true,
          curriculum: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' } },
            },
          },
        },
      })
    );

    if (!courses || courses.length === 0) {
      if (canUseFallback) {
        logger.warn('No courses in DB, using static fallback for course list');
        return COURSES;
      }
      return [];
    }

    return courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      category: course.category as Course['category'],
      image: course.image,
      description: course.description,
      longDescription: course.longDescription,
      instructorId: course.instructorId,
      instructors: course.instructors,
      instructorAvatars: course.instructor?.avatar ? [course.instructor.avatar] : [],
      rating: course.rating,
      reviews: course.reviews,
      students: course.students,
      duration: course.duration,
      totalLessons: course.totalLessons,
      level: course.level as Course['level'],
      price: Number(course.price),
      originalPrice: Number(course.originalPrice),
      tags: course.tags,
      lastUpdated: course.lastUpdated,
      includes: course.includes,
      whatYouLearn: course.whatYouLearn,
      hasCertificate: (course as any).hasCertificate ?? true,
      totalHours: Number((course as any).totalHours ?? 0),
      completionCriteria: (course as any).completionCriteria ?? 'Complete all lessons and knowledge checks to earn your certificate.',
      isPublished: course.isPublished ?? true,
      isComingSoon: (course as any).isComingSoon ?? false,
      releaseDate: (course as any).releaseDate ?? undefined,
      seriesName: (course as any).seriesName ?? undefined,
      seriesOrder: (course as any).seriesOrder ?? undefined,
      nextCourseSlug: (course as any).nextCourseSlug ?? undefined,
      isDeleted: course.isDeleted ?? false,
      curriculum: course.curriculum.map((sec) => ({
        title: sec.title,
        lessons: sec.lessons.map((les) => ({
          id: les.id,
          title: les.title,
          duration: les.duration,
          type: les.type as Lesson['type'],
          preview: les.preview,
          muxPlaybackId: les.muxPlaybackId ?? undefined,
        })),
      })),
    }));
  } catch (error) {
    if (canUseFallback) {
      logger.warn('Prisma DB query failed for getCoursesAsync, using static fallback');
      return COURSES;
    }
    logger.error('Prisma DB query failed in production for getCoursesAsync', error);
    return [];
  }
});

export const getInstructorCoursesAsync = cache(async (instructorId: string): Promise<Course[]> => {
  const allCourses = await getCoursesAsync();
  return allCourses.filter((c) => c.instructorId === instructorId);
});

export const getInstructorAsync = cache(async (id: string): Promise<Instructor | undefined> => {
  if (!process.env.DATABASE_URL) {
    if (!canUseFallback) return undefined;
    return INSTRUCTORS.find((i) => i.id === id);
  }
  try {
    const { prisma } = await import('@/lib/prisma');
    const inst = await withDbRetry(() => prisma.instructor.findUnique({ where: { id } }));
    if (!inst) {
      if (canUseFallback) return INSTRUCTORS.find((i) => i.id === id);
      return undefined;
    }

    return {
      id: inst.id,
      name: inst.name,
      title: inst.title,
      bio: inst.bio,
      avatar: inst.avatar,
      cover: inst.cover,
      rating: inst.rating,
      reviews: inst.reviews,
      students: inst.students,
      courses: inst.courses,
      expertise: inst.expertise,
      social: {
        github: inst.github ?? undefined,
        twitter: inst.twitter ?? undefined,
        linkedin: inst.linkedin ?? undefined,
      },
    };
  } catch (error) {
    if (canUseFallback) {
      logger.warn('Prisma DB query failed, using static fallback for instructor', { id });
      return INSTRUCTORS.find((i) => i.id === id);
    }
    logger.error('Prisma DB query failed for getInstructorAsync in production', error, { id });
    return undefined;
  }
});

export const getInstructorsAsync = cache(async (): Promise<Instructor[]> => {
  if (!process.env.DATABASE_URL) {
    if (!canUseFallback) return [];
    return INSTRUCTORS;
  }
  try {
    const { prisma } = await import('@/lib/prisma');
    const list = await withDbRetry(() =>
      prisma.instructor.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { courseList: { where: { isDeleted: false } } },
          },
        },
      })
    );
    return list.map((inst) => ({
      id: inst.id,
      name: inst.name,
      title: inst.title,
      bio: inst.bio,
      avatar: inst.avatar,
      cover: inst.cover,
      rating: inst.rating,
      reviews: inst.reviews,
      students: inst.students,
      courses: inst._count?.courseList ?? inst.courses,
      expertise: inst.expertise,
      social: {
        github: inst.github ?? undefined,
        twitter: inst.twitter ?? undefined,
        linkedin: inst.linkedin ?? undefined,
      },
    }));
  } catch (error) {
    if (canUseFallback) return INSTRUCTORS;
    logger.error('Prisma DB query failed for getInstructorsAsync in production', error);
    return [];
  }
});

export const getCurrentDbUserAsync = cache(async () => {
  try {
    const { currentUser } = await import('@clerk/nextjs/server');
    const user = await currentUser();
    if (!user) return null;

    // Require a verified primary email — no anonymous sessions
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Student';
    const avatar = user.imageUrl || '/assets/w-rc.jpg';
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const defaultRole = 'student';

    if (process.env.DATABASE_URL) {
      const { prisma } = await import('@/lib/prisma');

      // 1. Try resolving by clerkId first (authoritative — avoids duplicate records)
      const byClerkId = await withDbRetry(() =>
        prisma.user.findUnique({
          where: { clerkId: user.id },
          include: {
            enrollments: { include: { course: true } },
            achievements: true,
          },
        })
      );

      if (byClerkId) {
        // Update mutable fields (name, avatar) but never change existing role
        await withDbRetry(() =>
          prisma.user.update({
            where: { clerkId: user.id },
            data: {
              name: fullName,
              avatar: avatar,
              // Sync email only if it has changed (controlled — no email hijacking)
              ...(byClerkId.email !== email ? { email } : {}),
            },
          })
        ).catch(() => null); // Non-blocking profile sync
        return byClerkId;
      }

      // 2. Fallback: find by email (existing user without clerkId linked) and link clerkId
      const byEmail = await withDbRetry(() =>
        prisma.user.findUnique({
          where: { email },
          include: {
            enrollments: { include: { course: true } },
            achievements: true,
          },
        })
      );

      if (byEmail) {
        // Link clerkId to this email-matched user, update profile
        const linked = await withDbRetry(() =>
          prisma.user.update({
            where: { email },
            data: {
              clerkId: user.id,
              name: fullName,
              avatar: avatar,
            },
            include: {
              enrollments: { include: { course: true } },
              achievements: true,
            },
          })
        );
        return linked;
      }

      // 3. New user — create with clerkId as primary identifier (always student by default)
      const dbUser = await withDbRetry(() =>
        prisma.user.create({
          data: {
            clerkId: user.id,
            email: email,
            name: fullName,
            avatar: avatar,
            role: defaultRole,
            joinedDate: joinedDate,
          },
          include: {
            enrollments: { include: { course: true } },
            achievements: true,
          },
        })
      );
      return dbUser;
    }

    // No DATABASE_URL — only allow session-only user in non-production
    if (!canUseFallback) {
      logger.error('Database not configured; cannot create user session in production');
      return null;
    }

    return {
      id: user.id,
      clerkId: user.id,
      name: fullName,
      email: email,
      avatar: avatar,
      role: defaultRole,
      joinedDate: joinedDate,
      enrollments: [],
      achievements: [],
    };
  } catch (error) {
    logger.error('Error syncing current Clerk user to DB', error);
    return null;
  }
});

// ───────────────────────────────────────────
// ADMIN COURSE QUERIES (INCLUDES DRAFTS)
// ───────────────────────────────────────────
export const getAdminCoursesAsync = cache(async (): Promise<Course[]> => {
  noStore();

  if (!process.env.DATABASE_URL) {
    if (!canUseFallback) {
      logger.error('Database is not configured in production for getAdminCoursesAsync');
      return [];
    }
    return COURSES;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const courses = await withDbRetry(() =>
      prisma.course.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          curriculum: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' } },
            },
          },
          _count: {
            select: {
              enrollments: true,
              waitlistEntries: true,
            },
          },
        },
      })
    );

    return courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      category: course.category as Course['category'],
      image: course.image,
      description: course.description,
      longDescription: course.longDescription,
      instructorId: course.instructorId,
      instructors: course.instructors,
      rating: course.rating,
      reviews: course.reviews,
      students: (course as any)._count?.enrollments ?? 0,
      duration: course.duration,
      totalLessons: course.totalLessons,
      level: course.level as Course['level'],
      price: Number(course.price),
      originalPrice: Number(course.originalPrice),
      tags: course.tags,
      lastUpdated: course.lastUpdated,
      includes: course.includes,
      whatYouLearn: course.whatYouLearn,
      hasCertificate: (course as any).hasCertificate ?? true,
      totalHours: Number((course as any).totalHours ?? 0),
      completionCriteria: (course as any).completionCriteria ?? 'Complete all lessons and knowledge checks to earn your certificate.',
      isPublished: course.isPublished,
      isComingSoon: (course as any).isComingSoon ?? false,
      releaseDate: (course as any).releaseDate ?? undefined,
      seriesName: (course as any).seriesName ?? undefined,
      seriesOrder: (course as any).seriesOrder ?? undefined,
      nextCourseSlug: (course as any).nextCourseSlug ?? undefined,
      waitlistCount: (course as any)._count?.waitlistEntries ?? 0,
      isDeleted: course.isDeleted,
      curriculum: course.curriculum.map((sec) => ({
        title: sec.title,
        lessons: sec.lessons.map((les) => ({
          id: les.id,
          title: les.title,
          duration: les.duration,
          type: les.type as Lesson['type'],
          preview: les.preview,
          muxPlaybackId: les.muxPlaybackId ?? undefined,
        })),
      })),
    }));
  } catch (error) {
    if (canUseFallback) {
      logger.warn('Prisma DB query failed for getAdminCoursesAsync, using static fallback');
      return COURSES;
    }
    logger.error('Prisma DB query failed in production for getAdminCoursesAsync', error);
    return [];
  }
});

export const getAdminCourseBySlugAsync = cache(async (slug: string): Promise<Course | undefined> => {
  noStore();

  if (!process.env.DATABASE_URL) {
    if (!canUseFallback) {
      logger.error('Database is not configured in production for getAdminCourseBySlugAsync', undefined, { slug });
      return undefined;
    }
    return COURSES.find((c) => c.slug === slug);
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const course = await withDbRetry(() =>
      prisma.course.findUnique({
        where: { slug },
        include: {
          curriculum: {
            orderBy: { order: 'asc' },
            include: {
              lessons: { orderBy: { order: 'asc' } },
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      })
    );

    if (!course) {
      if (canUseFallback) {
        return COURSES.find((c) => c.slug === slug);
      }
      return undefined;
    }

    return {
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      category: course.category as Course['category'],
      image: course.image,
      description: course.description,
      longDescription: course.longDescription,
      instructorId: course.instructorId,
      instructors: course.instructors,
      rating: course.rating,
      reviews: course.reviews,
      students: (course as any)._count?.enrollments ?? 0,
      duration: course.duration,
      totalLessons: course.totalLessons,
      level: course.level as Course['level'],
      price: Number(course.price),
      originalPrice: Number(course.originalPrice),
      tags: course.tags,
      lastUpdated: course.lastUpdated,
      includes: course.includes,
      whatYouLearn: course.whatYouLearn,
      hasCertificate: (course as any).hasCertificate ?? true,
      totalHours: Number((course as any).totalHours ?? 0),
      completionCriteria: (course as any).completionCriteria ?? 'Complete all lessons and knowledge checks to earn your certificate.',
      isPublished: course.isPublished,
      isComingSoon: (course as any).isComingSoon ?? false,
      releaseDate: (course as any).releaseDate ?? undefined,
      seriesName: (course as any).seriesName ?? undefined,
      seriesOrder: (course as any).seriesOrder ?? undefined,
      nextCourseSlug: (course as any).nextCourseSlug ?? undefined,
      waitlistCount: (course as any)._count?.waitlistEntries ?? 0,
      isDeleted: course.isDeleted,
      curriculum: course.curriculum.map((sec) => ({
        title: sec.title,
        lessons: sec.lessons.map((les) => ({
          id: les.id,
          title: les.title,
          duration: les.duration,
          type: les.type as Lesson['type'],
          preview: les.preview,
          muxPlaybackId: les.muxPlaybackId ?? undefined,
        })),
      })),
    };
  } catch (error) {
    if (canUseFallback) {
      return COURSES.find((c) => c.slug === slug);
    }
    logger.error('Prisma DB query failed in production for getAdminCourseBySlugAsync', error, { slug });
    return undefined;
  }
});

// Alias exports for compatibility
export const getDbCourseBySlugAsync = getAdminCourseBySlugAsync;
export const getDbCoursesAsync = getAdminCoursesAsync;

export const getSeriesCoursesAsync = cache(async (seriesName: string): Promise<Course[]> => {
  const allCourses = await getCoursesAsync();
  return allCourses
    .filter((c) => c.seriesName?.toLowerCase() === seriesName.toLowerCase())
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
});

