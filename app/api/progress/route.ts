import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  requireCourseAccess,
  validateLessonRelationship,
  handleApiError,
  badRequestResponse,
  privateJsonResponse,
} from '@/lib/auth-policy';
import { logger } from '@/lib/logger';
import { trackServerEvent, ANALYTICS_EVENTS } from '@/lib/posthog';
import { inngest } from '@/lib/inngest/client';

// ─────────────────────────────────────────────
// GET /api/progress?courseId=x
// Strictly read-only: returns completed lesson IDs, positions, and
// server-calculated progress. Does NOT perform any database writes.
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return badRequestResponse('Missing courseId parameter');
    }

    // Verify user enrollment or admin status
    await requireCourseAccess(dbUser.id, dbUser.role, courseId);

    if (!process.env.DATABASE_URL) {
      return privateJsonResponse({
        completedLessonIds: [],
        courseProgress: 0,
        lessonProgress: [],
        totalLessons: 0,
      });
    }

    // Fetch total eligible lessons for course
    const totalLessons = await prisma.lesson.count({
      where: {
        section: { courseId },
      },
    });

    // Fetch user lesson progress records
    const records = await prisma.lessonProgress.findMany({
      where: { userId: dbUser.id, courseId },
      select: {
        lessonId: true,
        completed: true,
        watchedPct: true,
        lastPositionSeconds: true,
        durationSeconds: true,
        completedAt: true,
      },
    });

    const completedLessonIds = records
      .filter((r) => r.completed)
      .map((r) => r.lessonId);

    // Calculate server-authoritative progress
    const serverProgress =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100)) : 0;

    // Read enrollment progress without writing (GET must be idempotent).
    // Any drift between enrollment.progress and serverProgress is reconciled
    // the next time the learner POSTs a progress update.
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dbUser.id, courseId } },
      select: { progress: true },
    });

    return privateJsonResponse({
      completedLessonIds,
      courseProgress: Math.max(enrollment?.progress ?? 0, serverProgress),
      lessonProgress: records,
      totalLessons,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// POST /api/progress
// Server-authoritative, monotonic progress mutation engine
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const dbUser = await requireAuthUser();

    // Parse body robustly (handles standard fetch as well as sendBeacon text/json blobs)
    let body: any = null;
    const contentType = req.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      }
    } catch (parseErr) {
      logger.warn('Failed to parse progress update body', { error: String(parseErr) });
      return badRequestResponse('Invalid JSON payload');
    }

    const {
      courseId,
      lessonId,
      positionSeconds,
      videoTime,
      durationSeconds,
      completed,
      explicitComplete,
      watchedPct: clientWatchedPct,
    } = body || {};

    if (!courseId || !lessonId) {
      return badRequestResponse('Missing required courseId or lessonId');
    }

    // Authorization & relationship checks
    await requireCourseAccess(dbUser.id, dbUser.role, courseId);
    await validateLessonRelationship(courseId, lessonId);

    // Normalize numeric values
    const rawPos = typeof positionSeconds === 'number' ? positionSeconds : typeof videoTime === 'number' ? videoTime : 0;
    const pos = isFinite(rawPos) && rawPos >= 0 ? rawPos : 0;

    const rawDur = typeof durationSeconds === 'number' ? durationSeconds : null;
    const dur = rawDur && isFinite(rawDur) && rawDur > 0 ? rawDur : null;

    let calcWatchedPct = 0;
    if (dur && dur > 0) {
      calcWatchedPct = Math.min(100, Math.round((pos / dur) * 100));
    } else if (typeof clientWatchedPct === 'number' && isFinite(clientWatchedPct)) {
      calcWatchedPct = Math.min(100, Math.max(0, Math.round(clientWatchedPct)));
    }

    if (!process.env.DATABASE_URL) {
      return privateJsonResponse({
        message: 'Progress tracked (in-memory mode)',
        completed: Boolean(completed || explicitComplete || calcWatchedPct >= 90),
        lastPositionSeconds: pos,
        watchedPct: calcWatchedPct,
      });
    }

    // Execute atomic transaction for progress update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing lesson progress
      const existingLessonProgress = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: dbUser.id, lessonId } },
      });

      // Monotonic completion check: once completed, remains completed
      const isNowCompleted = Boolean(
        existingLessonProgress?.completed ||
        completed === true ||
        explicitComplete === true ||
        calcWatchedPct >= 90
      );

      // Monotonic values: never regress position or watched percentage
      const finalPosition = Math.max(existingLessonProgress?.lastPositionSeconds || 0, pos);
      const finalWatchedPct = Math.max(existingLessonProgress?.watchedPct || 0, calcWatchedPct);

      const updatedProgressRecord = await tx.lessonProgress.upsert({
        where: { userId_lessonId: { userId: dbUser.id, lessonId } },
        update: {
          completed: isNowCompleted,
          watchedPct: finalWatchedPct,
          lastPositionSeconds: finalPosition,
          ...(dur ? { durationSeconds: dur } : {}),
          ...(isNowCompleted && !existingLessonProgress?.completed ? { completedAt: new Date() } : {}),
        },
        create: {
          userId: dbUser.id,
          lessonId,
          courseId,
          completed: isNowCompleted,
          watchedPct: finalWatchedPct,
          lastPositionSeconds: finalPosition,
          durationSeconds: dur,
          ...(isNowCompleted ? { completedAt: new Date() } : {}),
        },
      });

      // 2. Recalculate total course progress server-side
      const totalLessons = await tx.lesson.count({
        where: { section: { courseId } },
      });

      const completedCount = await tx.lessonProgress.count({
        where: {
          userId: dbUser.id,
          courseId,
          completed: true,
        },
      });

      const serverCalculatedProgress =
        totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

      // 3. Upsert Enrollment progress (monotonic)
      const existingEnrollment = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: dbUser.id, courseId } },
      });

      const finalEnrollmentProgress = existingEnrollment
        ? Math.max(existingEnrollment.progress, serverCalculatedProgress)
        : serverCalculatedProgress;

      if (existingEnrollment) {
        await tx.enrollment.update({
          where: { userId_courseId: { userId: dbUser.id, courseId } },
          data: { progress: finalEnrollmentProgress },
        });
      }

      // 4. Auto-issue Certificate if 100% completed
      let courseTitle: string | undefined;
      if (finalEnrollmentProgress >= 100) {
        const targetCourse = await tx.course.findUnique({
          where: { slug: courseId },
          select: { title: true, hasCertificate: true },
        });
        courseTitle = targetCourse?.title;

        if (!targetCourse || targetCourse.hasCertificate !== false) {
          await tx.certificate.upsert({
            where: { userId_courseId: { userId: dbUser.id, courseId } },
            update: {},
            create: {
              userId: dbUser.id,
              courseId,
            },
          }).catch((certErr) => {
            logger.warn('Non-fatal: Certificate auto-issuance skipped or already exists', certErr);
          });
        }
      }

      return {
        lessonProgressRecord: updatedProgressRecord,
        courseProgress: finalEnrollmentProgress,
        completedCount,
        totalLessons,
        courseTitle,
      };
    }, { maxWait: 15000, timeout: 30000 });

    if (result.courseProgress >= 100 && dbUser.email) {
      inngest.send({
        name: 'certificate/generate',
        data: {
          userId: dbUser.id,
          courseId,
          userEmail: dbUser.email,
          courseTitle: result.courseTitle || courseId,
        },
      }).catch((err) => {
        logger.warn('Non-fatal: Inngest certificate generation dispatch skipped', err);
      });
    }

    if (result.lessonProgressRecord.completed) {
      await trackServerEvent(
        ANALYTICS_EVENTS.LESSON_COMPLETED,
        dbUser.id,
        {
          courseId,
          lessonId,
          courseProgress: result.courseProgress,
          watchedPct: result.lessonProgressRecord.watchedPct,
        }
      );
    }

    return privateJsonResponse({
      message: 'Progress updated successfully',
      completed: result.lessonProgressRecord.completed,
      lastPositionSeconds: result.lessonProgressRecord.lastPositionSeconds,
      watchedPct: result.lessonProgressRecord.watchedPct,
      courseProgress: result.courseProgress,
      completedCount: result.completedCount,
      totalLessons: result.totalLessons,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
