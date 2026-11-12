import { NextResponse } from 'next/server';
import { requireStaffOrAdmin, handleApiError, badRequestResponse } from '@/lib/auth-policy';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireStaffOrAdmin();

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ quizzes: [] });
    }

    const quizzes = await prisma.quiz.findMany({
      where: lessonId ? { lessonId } : undefined,
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { choices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quizzes });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireStaffOrAdmin();

    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    const { lessonId, title, description, passingScore = 70, questions = [] } = body;

    if (!lessonId || !title) {
      return badRequestResponse('Lesson ID and Title are required.');
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        quiz: {
          id: `quiz-${Date.now()}`,
          lessonId,
          title,
          description,
          passingScore,
          questions,
        },
      }, { status: 201 });
    }

    // Delete any existing quiz for this lesson to keep 1 quiz per lesson
    const existingQuiz = await prisma.quiz.findFirst({ where: { lessonId } });
    if (existingQuiz) {
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
    }

    const newQuiz = await prisma.quiz.create({
      data: {
        lessonId,
        title,
        description,
        passingScore: Number(passingScore) || 70,
        questions: {
          create: questions.map((q: any, qIdx: number) => ({
            question: q.question,
            type: q.type || 'MULTIPLE_CHOICE',
            order: qIdx + 1,
            points: q.points || 1,
            choices: {
              create: (q.choices || []).map((c: any) => ({
                text: c.text,
                isCorrect: Boolean(c.isCorrect),
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { choices: true },
        },
      },
    });

    return NextResponse.json({ quiz: newQuiz, message: 'Quiz created successfully' }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
