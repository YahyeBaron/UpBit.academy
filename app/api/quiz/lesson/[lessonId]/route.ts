import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, requireCourseAccess, handleApiError, notFoundResponse } from '@/lib/auth-policy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const dbUser = await requireAuthUser();
    const { lessonId } = await params;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ quiz: null });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } },
    });

    if (!lesson) {
      return notFoundResponse('Lesson not found');
    }

    await requireCourseAccess(dbUser.id, dbUser.role, lesson.section.courseId);

    const quiz = await prisma.quiz.findFirst({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            question: true,
            type: true,
            order: true,
            points: true,
            choices: {
              select: {
                id: true,
                text: true,
                // Do NOT expose isCorrect to prevent client cheating
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ quiz: quiz || null });
  } catch (error) {
    return handleApiError(error);
  }
}
