/**
 * ════════════════════════════════════════════════════════════════
 * EraySame Tech Academy — Standalone Dedicated Worker Daemon
 * ════════════════════════════════════════════════════════════════
 * This script runs as a persistent background process outside the Next.js
 * HTTP request path. Used for bulk operations, scheduled sync jobs, and
 * background queue execution on dedicated hosts (Fly.io, Render, Coolify, AWS ECS).
 */

import { prisma, withDbRetry } from '../lib/prisma';
import { dbTelemetry } from '../lib/db-telemetry';
import { inngestFunctions } from '../lib/inngest/functions';

let isRunning = true;
const WORKER_ID = process.env.WORKER_ID || `worker-${Math.random().toString(36).substring(2, 9)}`;
const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '10000', 10);

console.log(`[Worker Daemon] Starting EraySame Academy Dedicated Worker (ID: ${WORKER_ID})`);
console.log(`[Worker Daemon] Loaded ${inngestFunctions.length} background step functions.`);

/**
 * Health Ping & Maintenance Loop
 */
async function workerLoop() {
  while (isRunning) {
    try {
      // 1. Database connection heartbeat
      await withDbRetry(async () => {
        await prisma.$queryRaw`SELECT 1`;
      });

      // 2. Telemetry snapshot log
      const snap = dbTelemetry.getSnapshot();
      if (snap.totalQueries > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[Worker Daemon Heartbeat] Total DB Queries: ${snap.totalQueries} | p95: ${snap.p95Ms}ms`);
      }
    } catch (err) {
      console.error(`[Worker Daemon Heartbeat Error] Health check failed:`, err);
    }

    // Sleep before next iteration
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Graceful Shutdown Signal Handlers
 */
function handleShutdown(signal: string) {
  console.log(`[Worker Daemon] Received ${signal}. Shutting down worker gracefully...`);
  isRunning = false;

  setTimeout(async () => {
    try {
      await prisma.$disconnect();
      console.log(`[Worker Daemon] Prisma client disconnected. Worker process exited.`);
      process.exit(0);
    } catch (err) {
      console.error(`[Worker Daemon Error] Error during shutdown:`, err);
      process.exit(1);
    }
  }, 1000);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Start worker daemon loop
workerLoop().catch((err) => {
  console.error('[Worker Daemon Fatal] Worker loop crashed:', err);
  process.exit(1);
});
