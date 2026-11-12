/**
 * Certificates tRPC Router
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server';

export const certificatesRouter = createTRPCRouter({
  /** Get all certificates for the authenticated user */
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    if (!process.env.DATABASE_URL) return [];

    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      select: { id: true },
    });
    if (!user) return [];

    return ctx.prisma.certificate.findMany({
      where: { userId: user.id },
      include: { course: { select: { title: true, slug: true, image: true } } },
      orderBy: { issuedAt: 'desc' },
    });
  }),

  /** Publicly verify a certificate by verification code */
  verify: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      if (!process.env.DATABASE_URL) return null;

      const cert = await ctx.prisma.certificate.findUnique({
        where: { verificationCode: input.code },
        include: {
          course: { select: { title: true, slug: true } },
          user: { select: { name: true } },
        },
      });

      if (!cert) throw new TRPCError({ code: 'NOT_FOUND', message: 'Certificate not found' });
      return {
        isValid: true,
        courseTitle: cert.course.title,
        studentName: cert.user.name,
        issuedAt: cert.issuedAt,
        verificationCode: cert.verificationCode,
      };
    }),
});
