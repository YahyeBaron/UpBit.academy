/**
 * ════════════════════════════════════════════════════════════════
 * Inngest Background Job Handler — /api/inngest
 * ════════════════════════════════════════════════════════════════
 * Serves the Inngest event handler for background function execution.
 * Inngest calls this endpoint to deliver, retry, and orchestrate step functions.
 *
 * Local development: run `npx inngest-cli@latest dev` to start the Inngest Dev Server.
 * Production: register this endpoint in the Inngest dashboard.
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { inngestFunctions } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
