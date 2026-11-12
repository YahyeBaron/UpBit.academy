import { PrismaClient } from '@prisma/client';
import { queryTimingExtension } from './db-timing.ts';
import { dbTelemetry } from './db-telemetry.ts';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof buildPrismaClient> | undefined;
};

// Neon PostgreSQL serverless pooler setup
function buildPrismaClient() {
  let url = process.env.DATABASE_URL || '';

  // Append Neon PgBouncer parameters for pooler endpoints
  if (url) {
    if (url.includes('-pooler') && !url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    if (!url.includes('connect_timeout')) {
      url += (url.includes('?') ? '&' : '?') + 'connect_timeout=30';
    } else {
      url = url.replace(/connect_timeout=[0-9]+/, 'connect_timeout=30');
    }
    if (!url.includes('pool_timeout')) {
      url += (url.includes('?') ? '&' : '?') + 'pool_timeout=30';
    }
    if (!url.includes('connection_limit')) {
      url += (url.includes('?') ? '&' : '?') + 'connection_limit=20';
    }
  }

  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url },
    },
  });

  // Attach query timing extension for >200ms slow query detection & p50/p95/p99 telemetry
  return base.$extends(queryTimingExtension);
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Utility to retry Prisma DB operations if a serverless Neon connection was closed by idle timeout.
 * Also records each cold-start reconnect attempt in dbTelemetry.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isClosedError =
      err?.message?.includes('Closed') ||
      err?.message?.includes('kind: Closed') ||
      err?.code === 'P1001' ||
      err?.code === 'P1002' ||
      err?.code === 'P2024';

    if (retries > 0 && isClosedError) {
      dbTelemetry.recordColdStart();
      console.warn(`[Prisma Retry] Database connection timeout/closed (${err?.code || 'Closed'}). Retrying (${retries} attempts left)...`);
      await new Promise((r) => setTimeout(r, 150));
      return withDbRetry(fn, retries - 1);
    }
    throw err;
  }
}

export default prisma;
