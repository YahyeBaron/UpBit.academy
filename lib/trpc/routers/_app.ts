/**
 * Root AppRouter — merges all domain routers
 * Import `AppRouter` type anywhere for end-to-end type safety.
 */
import { createTRPCRouter } from '../server';
import { coursesRouter } from './courses';
import { progressRouter } from './progress';
import { certificatesRouter } from './certificates';
import { searchRouter } from './search';

export const appRouter = createTRPCRouter({
  courses: coursesRouter,
  progress: progressRouter,
  certificates: certificatesRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
