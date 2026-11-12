import { NextResponse } from 'next/server';
import { dbTelemetry } from '@/lib/db-telemetry';
import { isRedisConfigured } from '@/lib/redis';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * GET /api/db-metrics
 *
 * INTERNAL ONLY — Returns live database latency percentiles, slow query counts,
 * and pool saturation signals.
 *
 * Access control (defence-in-depth):
 *   1. Active admin session cookie (primary), OR
 *   2. INTERNAL_METRICS_TOKEN bearer token (for monitoring automation)
 *
 * Never exposed to unauthenticated callers.
 */
export async function GET(request: Request) {
  // ── 1. Token-based internal access (monitoring systems / dashboards) ──────
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const metricsToken = process.env.INTERNAL_METRICS_TOKEN;

  const tokenValid =
    metricsToken &&
    metricsToken.length >= 32 &&
    bearerToken === metricsToken;

  // ── 2. Admin session fallback (browser-accessible admin dashboard) ─────────
  const admin = tokenValid ? null : await getAdminSession();

  if (!tokenValid && !admin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin session or metrics token required.' },
      { status: 401 }
    );
  }

  // ── 3. Return metrics snapshot ─────────────────────────────────────────────
  const snapshot = dbTelemetry.getSnapshot();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    dbPerformance: snapshot,
    infrastructure: {
      redisDistributed: isRedisConfigured,
      prismaExtensionActive: true,
      slowQueryThresholdMs: 200,
    },
  });
}
