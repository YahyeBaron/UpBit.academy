/**
 * Progress tRPC Router
 * Read-only access to lesson and course progress for the authenticated user.
 */
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';

export const progressRouter = createTRPCRouter({
  /** Get all lesson progress for a course */
  getCourseProgress: protectedProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) {
        return { completedLessonIds: [], courseProgress: 0, totalLessons: 0 };
      }

      const user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        select: { id: true },
      });
      if (!user) return { completedLessonIds: [], courseProgress: 0, totalLessons: 0 };

      const [records, totalLessons, enrollment] = await Promise.all([
        ctx.prisma.lessonProgress.findMany({
          where: { userId: user.id, courseId: input.courseId },
          select: {
            lessonId: true,
            completed: true,
            watchedPct: true,
            lastPositionSeconds: true,
            completedAt: true,
          },
        }),
        ctx.prisma.lesson.count({ where: { section: { courseId: input.courseId } } }),
        ctx.prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: input.courseId } },
          select: { progress: true },
        }),
      ]);

      const completedLessonIds = records.filter((r) => r.completed).map((r) => r.lessonId);
      const serverProgress = totalLessons > 0
        ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100))
        : 0;

      return {
        completedLessonIds,
        lessonProgress: records,
        courseProgress: Math.max(enrollment?.progress ?? 0, serverProgress),
        totalLessons,
      };
    }),

  /** Get resume position for a specific lesson */
  getLessonPosition: protectedProcedure
    .input(z.object({ lessonId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) return null;

      const user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        select: { id: true },
      });
      if (!user) return null;

      return ctx.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId: input.lessonId } },
        select: { lastPositionSeconds: true, watchedPct: true, completed: true },
      });
    }),
});
