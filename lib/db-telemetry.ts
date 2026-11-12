/**
 * ════════════════════════════════════════════════════════════════
 * Database Latency & Performance Telemetry
 * ════════════════════════════════════════════════════════════════
 * Tracks a rolling window of database query timings to compute
 * p50/p95/p99 percentiles, connection pool saturation signals,
 * and cold-start frequency metrics.
 */

export interface DbPerformanceSnapshot {
  totalQueries: number;
  slowQueries: number;
  slowQueryRate: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  minMs: number;
  avgMs: number;
  coldStartCount: number;
  lastResetAt: string;
}

const ROLLING_WINDOW_SIZE = 500;   // Keep last 500 query timings
const SLOW_THRESHOLD_MS   = 200;

class DbTelemetryTracker {
  private timings: number[] = [];
  private totalQueries      = 0;
  private slowQueries       = 0;
  private coldStartCount    = 0;
  private startedAt         = new Date().toISOString();

  recordQuery(durationMs: number): void {
    this.totalQueries++;
    if (durationMs >= SLOW_THRESHOLD_MS) this.slowQueries++;

    // Rolling window — drop oldest when full
    if (this.timings.length >= ROLLING_WINDOW_SIZE) {
      this.timings.shift();
    }
    this.timings.push(durationMs);
  }

  recordColdStart(): void {
    this.coldStartCount++;
    console.warn(`[DB Telemetry] Cold start detected — total: ${this.coldStartCount}`);
  }

  getSnapshot(): DbPerformanceSnapshot {
    if (this.timings.length === 0) {
      return {
        totalQueries:  this.totalQueries,
        slowQueries:   this.slowQueries,
        slowQueryRate: '0.00%',
        p50Ms: 0, p95Ms: 0, p99Ms: 0,
        maxMs: 0, minMs: 0, avgMs: 0,
        coldStartCount: this.coldStartCount,
        lastResetAt: this.startedAt,
      };
    }

    const sorted = [...this.timings].sort((a, b) => a - b);
    const pct = (p: number) => sorted[Math.max(0, Math.floor((sorted.length - 1) * p / 100))];
    const sum = sorted.reduce((a, b) => a + b, 0);

    const slowRate = this.totalQueries > 0
      ? ((this.slowQueries / this.totalQueries) * 100).toFixed(2) + '%'
      : '0.00%';

    return {
      totalQueries:  this.totalQueries,
      slowQueries:   this.slowQueries,
      slowQueryRate: slowRate,
      p50Ms: pct(50),
      p95Ms: pct(95),
      p99Ms: pct(99),
      maxMs: sorted[sorted.length - 1],
      minMs: sorted[0],
      avgMs: Math.round(sum / sorted.length),
      coldStartCount: this.coldStartCount,
      lastResetAt: this.startedAt,
    };
  }

  reset(): void {
    this.timings       = [];
    this.totalQueries  = 0;
    this.slowQueries   = 0;
    this.coldStartCount = 0;
    this.startedAt     = new Date().toISOString();
  }

  logSnapshot(): void {
    const snap = this.getSnapshot();
    console.log(
      `[DB Telemetry Snapshot]\n` +
      `  Total queries:  ${snap.totalQueries} (${snap.slowQueries} slow — ${snap.slowQueryRate})\n` +
      `  p50: ${snap.p50Ms}ms  p95: ${snap.p95Ms}ms  p99: ${snap.p99Ms}ms\n` +
      `  min: ${snap.minMs}ms  max: ${snap.maxMs}ms  avg: ${snap.avgMs}ms\n` +
      `  Cold starts: ${snap.coldStartCount}`
    );
  }
}

// Singleton — survives across requests within the same serverless instance
const globalDbTelemetry = globalThis as unknown as {
  _dbTelemetry: DbTelemetryTracker | undefined;
};

export const dbTelemetry: DbTelemetryTracker =
  globalDbTelemetry._dbTelemetry ?? new DbTelemetryTracker();

if (!globalDbTelemetry._dbTelemetry) {
  globalDbTelemetry._dbTelemetry = dbTelemetry;
}
