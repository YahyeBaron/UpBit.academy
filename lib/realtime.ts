/**
 * ════════════════════════════════════════════════════════════════
 * Managed Real-Time Transport (Pusher / WebSockets)
 * ════════════════════════════════════════════════════════════════
 * Enforces DB-first persistence before broadcasting transient events.
 * Provides channel topology utilities for course, thread, and user streams.
 * Includes graceful fallbacks when Pusher credentials are not configured.
 */

import Pusher from 'pusher';
import { captureAlert, captureException } from '@/lib/telemetry';

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

export const isPusherConfigured = Boolean(PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET);

// Server-side Pusher instance
let pusherServerClient: Pusher | null = null;

if (isPusherConfigured) {
  try {
    pusherServerClient = new Pusher({
      appId: PUSHER_APP_ID!,
      key: PUSHER_KEY!,
      secret: PUSHER_SECRET!,
      cluster: PUSHER_CLUSTER!,
      useTLS: true,
    });
  } catch (err) {
    console.error('[Pusher Setup] Failed to initialize Pusher server client:', err);
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Pusher Setup] Pusher credentials missing. Real-time events will operate in fallback log-only mode.');
  }
}

/**
 * Standardized Channel Topology Formatters
 */
export const realTimeChannels = {
  course: (courseId: string) => `course-${courseId}`,
  thread: (threadId: string) => `thread-${threadId}`,
  user: (userId: string) => `user-${userId}`,
};

/**
 * Standardized Real-Time Event Types
 */
export type RealtimeEvent =
  | 'new-thread'
  | 'thread-deleted'
  | 'new-reply'
  | 'reply-deleted'
  | 'lesson-progress'
  | 'user-notification';

/**
 * Broadcast a real-time event via Pusher.
 * Always call this AFTER successful PostgreSQL database write operations.
 */
export async function broadcastRealtimeEvent(
  channel: string,
  event: RealtimeEvent,
  payload: Record<string, any>
): Promise<boolean> {
  const eventData = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (!pusherServerClient) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Realtime Broadcast Fallback] Channel: ${channel} | Event: ${event}`, eventData);
    }
    return false;
  }

  try {
    await pusherServerClient.trigger(channel, event, eventData);
    return true;
  } catch (error) {
    captureException(error, { context: 'broadcastRealtimeEvent', channel, event });
    captureAlert('Realtime Broadcast Failed', `Failed to emit ${event} to channel ${channel}`, { channel, event });
    return false;
  }
}
