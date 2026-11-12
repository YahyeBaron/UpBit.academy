/**
 * tRPC Server Initialization & Context Factory
 *
 * Context carries the authenticated user (from Clerk) and the Prisma client.
 * Each tRPC procedure can access `ctx.userId` and `ctx.prisma`.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ZodError } from 'zod';

// ── Context ───────────────────────────────────────────────────────────────────

export async function createTRPCContext(opts: { headers: Headers }) {
  const { userId } = await auth();

  return {
    prisma,
    userId,          // null when unauthenticated
    headers: opts.headers,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// ── Initialise tRPC ───────────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ── Reusable building blocks ──────────────────────────────────────────────────

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Public procedure — no authentication required */
export const publicProcedure = t.procedure;

/** Protected procedure — throws UNAUTHORIZED if no Clerk session */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign in required' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // narrowed: string (not null)
    },
  });
});
