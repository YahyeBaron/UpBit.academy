/**
 * ════════════════════════════════════════════════════════════════
 * Database Query Timing Extension
 * ════════════════════════════════════════════════════════════════
 * Attaches a Prisma $extends query middleware that instruments every
 * database operation and emits a structured telemetry alert when
 * execution time exceeds SLOW_QUERY_THRESHOLD_MS (default: 200ms).
 */

import { captureAlert } from './telemetry.ts';
import { dbTelemetry } from './db-telemetry.ts';

export const SLOW_QUERY_THRESHOLD_MS = 200;

/**
 * Prisma $extends query extension to track execution time.
 * Usage: const prismaWithTiming = basePrismaClient.$extends(queryTimingExtension);
 */
export const queryTimingExtension = {
  query: {
    $allModels: {
      async $allOperations({
        model,
        operation,
        args,
        query,
      }: {
        model: string;
        operation: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        const start = performance.now();

        try {
          const result = await query(args);
          const durationMs = Math.round(performance.now() - start);

          // Record timing in rolling telemetry
          dbTelemetry.recordQuery(durationMs);

          if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
            const message = `Slow query detected: ${model}.${operation} took ${durationMs}ms (threshold: ${SLOW_QUERY_THRESHOLD_MS}ms)`;
            console.warn(`[DB Timing] ⚠️  ${message}`);
            captureAlert('Slow Database Query', message, {
              model,
              operation,
              durationMs,
              threshold: SLOW_QUERY_THRESHOLD_MS,
            });
          } else if (process.env.NODE_ENV === 'development') {
            console.debug(`[DB Timing] ${model}.${operation} — ${durationMs}ms`);
          }

          return result;
        } catch (err) {
          const durationMs = Math.round(performance.now() - start);
          console.error(`[DB Timing] ${model}.${operation} failed after ${durationMs}ms`, err);
          throw err;
        }
      },
    },
  },
};
