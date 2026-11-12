/**
 * Courses tRPC Router
 * Provides type-safe, cached read access to course data.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server';

export const coursesRouter = createTRPCRouter({
  /** List all published courses — optionally filtered by category/level */
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          level: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(20),
          cursor: z.string().optional(), // last course slug for cursor pagination
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) {
        return { courses: [], nextCursor: null };
      }
      const limit = input?.limit ?? 20;
      const courses = await ctx.prisma.course.findMany({
        where: {
          isPublished: true,
          isDeleted: false,
          ...(input?.category ? { category: input.category } : {}),
          ...(input?.level ? { level: input.level } : {}),
          ...(input?.cursor ? { slug: { gt: input.cursor } } : {}),
        },
        select: {
          slug: true,
          title: true,
          description: true,
          price: true,
          image: true,
          level: true,
          category: true,
          isComingSoon: true,
          instructor: { select: { name: true, avatar: true } },
          _count: { select: { curriculum: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      });

      const hasMore = courses.length > limit;
      const page = hasMore ? courses.slice(0, limit) : courses;
      return {
        courses: page,
        nextCursor: hasMore ? page[page.length - 1].slug : null,
      };
    }),

  /** Get a single course by slug with full curriculum */
  getCourse: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) return null;

      const course = await ctx.prisma.course.findUnique({
        where: { slug: input.slug, isPublished: true, isDeleted: false },
        include: {
          instructor: true,
          curriculum: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  order: true,
                  duration: true,
                  type: true,
                  preview: true,
                  muxPlaybackId: true,
                },
              },
            },
          },
          _count: { select: { enrollments: true } },
        },
      });

      if (!course) throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      return course;
    }),

  /** Check if authenticated user is enrolled in a course */
  isEnrolled: protectedProcedure
    .input(z.object({ courseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) return false;

      const user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        select: { id: true },
      });
      if (!user) return false;

      const enrollment = await ctx.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: input.courseId } },
        select: { paymentStatus: true },
      });
      return enrollment?.paymentStatus === 'COMPLETED';
    }),
});
