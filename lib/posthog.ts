/**
 * ════════════════════════════════════════════════════════════════
 * PostHog Product & Behavior Analytics Service
 * ════════════════════════════════════════════════════════════════
 * Server-side: uses posthog-node (safe in API routes / Inngest / Edge).
 * Client-side: trackClientEvent / identifyUserSession use posthog-js via
 *   dynamic require — ONLY call from 'use client' components.
 */

import { PostHog } from 'posthog-node';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const isPostHogConfigured = Boolean(POSTHOG_KEY);

// Server-side PostHog client
let posthogServerNodeClient: PostHog | null = null;

if (isPostHogConfigured) {
  try {
    posthogServerNodeClient = new PostHog(POSTHOG_KEY!, {
      host: POSTHOG_HOST,
      flushInterval: 1000,
      flushAt: 1,
    });
  } catch (err) {
    console.error('[PostHog Server] Failed to initialize PostHog Node client:', err);
  }
}

/**
 * Standardized Analytics Events Map
 */
export const ANALYTICS_EVENTS = {
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  LESSON_STARTED: 'lesson_started',
  LESSON_COMPLETED: 'lesson_completed',
  DISCUSSION_THREAD_CREATED: 'discussion_thread_created',
  DISCUSSION_REPLY_POSTED: 'discussion_reply_posted',
  CERTIFICATE_ISSUED: 'certificate_issued',
  SUBSCRIBE_NEWSLETTER: 'subscribe_newsletter',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Track an analytics event on the server side (API routes, webhooks, background queues).
 */
export async function trackServerEvent(
  eventName: AnalyticsEventName | string,
  distinctId: string,
  properties?: Record<string, any>
): Promise<void> {
  const payload = {
    distinctId,
    event: eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  };

  if (posthogServerNodeClient) {
    try {
      posthogServerNodeClient.capture(payload);
      await posthogServerNodeClient.flush();
    } catch (err) {
      console.error(`[PostHog Server Error] Failed to capture ${eventName}:`, err);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[PostHog Server Analytics Log] ${eventName} (user: ${distinctId}):`, properties);
  }
}

/**
 * Track an analytics event on the client side.
 * ONLY call from 'use client' components — uses posthog-js via dynamic require.
 */
export function trackClientEvent(
  eventName: AnalyticsEventName | string,
  properties?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const posthog = require('posthog-js').default;
    if (posthog?.__loaded) {
      posthog.capture(eventName, properties);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[PostHog Client Analytics Log] ${eventName}:`, properties);
    }
  } catch {
    // posthog-js not available in this server context — safe no-op
  }
}

/**
 * Identify a user session on the client side.
 * ONLY call from 'use client' components — uses posthog-js via dynamic require.
 */
export function identifyUserSession(distinctId: string, traits?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const posthog = require('posthog-js').default;
    if (posthog?.__loaded) {
      posthog.identify(distinctId, traits);
    }
  } catch {
    // posthog-js not available in this server context — safe no-op
  }
}
