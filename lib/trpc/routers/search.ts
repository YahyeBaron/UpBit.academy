/**
 * Search tRPC Router — Meilisearch-backed course search
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../server';
import { searchCourses } from '@/lib/search/indexer';

export const searchRouter = createTRPCRouter({
  /** Full-text search across course title, description, instructor, tags */
  courses: publicProcedure
    .input(
      z.object({
        q: z.string().default(''),
        level: z.string().optional(),
        maxPrice: z.number().nonnegative().optional(),
        limit: z.number().int().min(1).max(50).default(12),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      return searchCourses({
        query: input.q,
        level: input.level,
        maxPrice: input.maxPrice,
        limit: input.limit,
        offset: input.offset,
      });
    }),
});
