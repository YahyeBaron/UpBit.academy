/**
 * ════════════════════════════════════════════════════════════════
 * Telemetry & Exception Tracking Service
 * ════════════════════════════════════════════════════════════════
 * Provides structured runtime error logging and optional Sentry tracking.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export interface TelemetryContext {
  userId?: string;
  transactionRef?: string;
  courseSlug?: string;
  endpoint?: string;
  provider?: string;
  [key: string]: any;
}

/**
 * Log and report a operational error or exception
 */
export function captureException(error: unknown, context?: TelemetryContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logPayload = {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    stack: errorStack,
    context: context || {},
  };

  console.error('[Telemetry Exception Captured]', JSON.stringify(logPayload, null, 2));

  if (SENTRY_DSN) {
    // If Sentry HTTP webhook/ingest is available, send telemetry event via fetch
    try {
      fetch(SENTRY_DSN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload),
      }).catch(() => {});
    } catch {
      // Ignore Sentry fetch error to prevent cascading failures
    }
  }
}

/**
 * Log a targeted alert (e.g. payment signature mismatch, connection timeout, etc.)
 */
export function captureAlert(title: string, message: string, context?: TelemetryContext): void {
  const alertPayload = {
    timestamp: new Date().toISOString(),
    alert: title,
    details: message,
    context: context || {},
  };

  console.warn('[Telemetry Alert Triggered]', JSON.stringify(alertPayload, null, 2));
}
