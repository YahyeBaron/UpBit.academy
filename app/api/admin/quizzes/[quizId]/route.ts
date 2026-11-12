import { NextResponse } from 'next/server';
import { requireStaffOrAdmin, handleApiError, notFoundResponse, badRequestResponse } from '@/lib/auth-policy';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    await requireStaffOrAdmin();

    if (!process.env.DATABASE_URL) {
      return notFoundResponse('Database unavailable');
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { choices: true },
        },
      },
    });

    if (!quiz) return notFoundResponse('Quiz not found');
    return NextResponse.json({ quiz });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    await requireStaffOrAdmin();

    const body = await req.json().catch(() => null);
    if (!body) {
      return badRequestResponse('Invalid JSON payload');
    }

    const { title, description, passingScore, questions } = body;

    if (process.env.DATABASE_URL) {
      // Update basic fields
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: title ?? undefined,
          description: description ?? undefined,
          passingScore: passingScore !== undefined ? Number(passingScore) : undefined,
        },
      });

      // Update questions if passed
      if (questions && Array.isArray(questions)) {
        // Remove existing questions
        await prisma.quizQuestion.deleteMany({ where: { quizId } });

        // Re-create questions
        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          await prisma.quizQuestion.create({
            data: {
              quizId,
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
            },
          });
        }
      }

      const updatedQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: { include: { choices: true } } },
      });

      return NextResponse.json({ quiz: updatedQuiz, message: 'Quiz updated successfully' });
    }

    return NextResponse.json({ message: 'Quiz updated (mock)' });
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    await requireStaffOrAdmin();

    if (process.env.DATABASE_URL) {
      await prisma.quiz.delete({ where: { id: quizId } });
    }

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    return handleApiError(error);
  }
}
