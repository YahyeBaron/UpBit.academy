import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
//
// Minimal liveness probe — safe to expose publicly.
// Returns only: { status, timestamp } without internal details.
//
// Readiness check (database connectivity + config warnings) is guarded by an
// optional query parameter: ?probe=readiness
// Even then it only reports pass/fail, never schema, env values, or diagnostics.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const probe = searchParams.get('probe');

  // ── Liveness probe (default) ─────────────────────────────────────────────
  // Just confirms the process is running. No DB call, no env exposure.
  if (!probe || probe === 'liveness') {
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }

  // ── Readiness probe ───────────────────────────────────────────────────────
  // Checks that downstream dependencies (DB) are reachable.
  // Reports pass/fail only — no latency numbers, error messages, or schema info
  // in the response body (those details go to server-side logs only).
  if (probe === 'readiness') {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      // Log internally only; never expose DB error details to callers.
      console.error('[health/readiness] Database connectivity check failed.');
    }

    // Config sanity checks (warn without blocking readiness)
    const emailSandbox = (process.env.RESEND_FROM_EMAIL ?? '').includes('onboarding@resend.dev');
    const clerkWebhookMissing =
      !process.env.CLERK_WEBHOOK_SECRET ||
      process.env.CLERK_WEBHOOK_SECRET === 'whsec_placeholder_clerk_webhook_secret';
    const inngestMissing =
      !process.env.INNGEST_SIGNING_KEY || !process.env.INNGEST_EVENT_KEY;
    const sentryMissing = !process.env.NEXT_PUBLIC_SENTRY_DSN;

    const warnings: string[] = [];
    if (emailSandbox) warnings.push('email_sandbox_domain');
    if (clerkWebhookMissing) warnings.push('clerk_webhook_unconfigured');
    if (inngestMissing) warnings.push('inngest_keys_missing');
    if (sentryMissing) warnings.push('sentry_dsn_missing');

    const ready = dbOk;
    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbOk ? 'pass' : 'fail',
        },
        // Warnings are informational — do NOT affect HTTP status code.
        // They are NOT included in liveness response to avoid leaking config state.
        ...(warnings.length > 0 && { warnings }),
      },
      { status: ready ? 200 : 503 }
    );
  }

  // Unknown probe type
  return NextResponse.json(
    { error: 'Unknown probe type. Use ?probe=liveness or ?probe=readiness' },
    { status: 400 }
  );
}
