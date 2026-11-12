import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuthUser,
  requireCourseAccess,
  handleApiError,
  badRequestResponse,
  notFoundResponse,
} from '@/lib/auth-policy';
import { logger } from '@/lib/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Quiz Attempt Rate-Limiting
//
// Prevents automated brute-forcing of quiz answer keys.
// Allows up to QUIZ_ATTEMPT_LIMIT attempts within the WINDOW_MS rolling window,
// enforced at the database level so it survives restarts and scales across
// multiple instances.
// ─────────────────────────────────────────────────────────────────────────────
const QUIZ_ATTEMPT_LIMIT = 5;
const QUIZ_ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

async function checkQuizAttemptRateLimit(
  userId: string,
  quizId: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!process.env.DATABASE_URL) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const windowStart = new Date(Date.now() - QUIZ_ATTEMPT_WINDOW_MS);

  const recentAttempts = await prisma.quizAttempt.count({
    where: {
      userId,
      quizId,
      completedAt: { gte: windowStart },
    },
  });

  if (recentAttempts >= QUIZ_ATTEMPT_LIMIT) {
    // Find oldest attempt in window to compute retry-after
    const oldest = await prisma.quizAttempt.findFirst({
      where: { userId, quizId, completedAt: { gte: windowStart } },
      orderBy: { completedAt: 'asc' },
      select: { completedAt: true },
    });

    const retryAfterMs = oldest
      ? oldest.completedAt.getTime() + QUIZ_ATTEMPT_WINDOW_MS - Date.now()
      : QUIZ_ATTEMPT_WINDOW_MS;

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const dbUser = await requireAuthUser();
    const { quizId } = await params;

    const body = await req.json().catch(() => null);
    if (!body || !body.answers || typeof body.answers !== 'object') {
      return badRequestResponse('Invalid submission answers format');
    }

    const { answers } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        score: 100,
        passed: true,
        totalQuestions: Object.keys(answers).length,
        correctCount: Object.keys(answers).length,
      });
    }

    // ── Rate-limit check: max 5 attempts per 10 minutes per user+quiz ─────────
    const rateLimit = await checkQuizAttemptRateLimit(dbUser.id, quizId);
    if (!rateLimit.allowed) {
      logger.warn('[Quiz Submit] Rate limit exceeded', { userId: dbUser.id, quizId });
      return NextResponse.json(
        {
          error: 'Too many quiz attempts. Please wait before trying again.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { choices: true },
        },
      },
    });

    if (!quiz) {
      return notFoundResponse('Quiz not found');
    }

    // Find lesson and course context for authorization & progress
    const lesson = await prisma.lesson.findUnique({
      where: { id: quiz.lessonId },
      include: { section: { select: { courseId: true } } },
    });

    if (lesson) {
      await requireCourseAccess(dbUser.id, dbUser.role, lesson.section.courseId);
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    let correctCount = 0;

    // Internal results include the correct choice for server-side logic only
    const internalResults: Record<string, { correctChoiceId: string; userChoiceId: string; isCorrect: boolean }> = {};

    for (const q of quiz.questions) {
      totalPoints += q.points;
      const correctChoice = q.choices.find((c) => c.isCorrect);
      const userChoiceId = answers[q.id];

      const isCorrect = Boolean(correctChoice && userChoiceId === correctChoice.id);
      if (isCorrect) {
        earnedPoints += q.points;
        correctCount++;
      }

      internalResults[q.id] = {
        correctChoiceId: correctChoice?.id || '',
        userChoiceId: userChoiceId || '',
        isCorrect,
      };
    }

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= quiz.passingScore;

    // Save quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: dbUser.id,
        score: scorePercentage,
        passed,
      },
    });

    // If passed and lesson exists, trigger lesson completion in database!
    if (passed && lesson) {
      const courseId = lesson.section.courseId;
      try {
        await prisma.$transaction(async (tx) => {
          const existingLP = await tx.lessonProgress.findUnique({
            where: { userId_lessonId: { userId: dbUser.id, lessonId: lesson.id } },
          });

          await tx.lessonProgress.upsert({
            where: { userId_lessonId: { userId: dbUser.id, lessonId: lesson.id } },
            update: {
              completed: true,
              watchedPct: 100,
              ...(existingLP?.completed ? {} : { completedAt: new Date() }),
            },
            create: {
              userId: dbUser.id,
              lessonId: lesson.id,
              courseId,
              completed: true,
              watchedPct: 100,
              completedAt: new Date(),
            },
          });

          const totalLessons = await tx.lesson.count({
            where: { section: { courseId } },
          });

          const completedCount = await tx.lessonProgress.count({
            where: { userId: dbUser.id, courseId, completed: true },
          });

          const serverProgress =
            totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;

          await tx.enrollment.updateMany({
            where: { userId: dbUser.id, courseId },
            data: { progress: serverProgress },
          });
        }, { maxWait: 15000, timeout: 30000 });
      } catch (progressErr) {
        logger.warn('Failed to update lesson progress after quiz pass', { error: String(progressErr) });
      }
    }

    // ── Answer Key Redaction Policy ───────────────────────────────────────────
    // On a failed attempt: return only isCorrect per question (not the key).
    // On a passed attempt: reveal the full correct choice IDs so the learner
    // can review what they got right/wrong with full context.
    const clientResults: Record<string, { userChoiceId: string; isCorrect: boolean; correctChoiceId?: string }> = {};
    for (const [qId, result] of Object.entries(internalResults)) {
      clientResults[qId] = {
        userChoiceId: result.userChoiceId,
        isCorrect: result.isCorrect,
        // Only reveal the correct choice ID when the student has passed
        ...(passed ? { correctChoiceId: result.correctChoiceId } : {}),
      };
    }

    return NextResponse.json({
      score: scorePercentage,
      passed,
      passingScore: quiz.passingScore,
      earnedPoints,
      totalPoints,
      totalQuestions: quiz.questions.length,
      correctCount,
      results: clientResults,
      attemptId: attempt.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
