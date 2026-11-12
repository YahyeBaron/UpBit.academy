'use client';

import { useEffect, useRef } from 'react';
import PusherClient from 'pusher-js';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

let pusherClientSingleton: PusherClient | null = null;

function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined' || !PUSHER_KEY) return null;

  if (!pusherClientSingleton) {
    pusherClientSingleton = new PusherClient(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }

  return pusherClientSingleton;
}

export interface RealtimeSubscriptionOptions<T = any> {
  channel: string;
  event: string;
  onEvent: (data: T) => void;
  enabled?: boolean;
}

/**
 * Custom React hook to subscribe to a Pusher WebSocket channel event.
 * Cleans up subscriptions automatically on unmount or dependency change.
 */
export function useRealtimeSubscription<T = any>({
  channel,
  event,
  onEvent,
  enabled = true,
}: RealtimeSubscriptionOptions<T>) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !channel || !event) return;

    const pusher = getPusherClient();
    if (!pusher) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[useRealtimeSubscription] Pusher client key not set. Skipping subscription to ${channel}:${event}`);
      }
      return;
    }

    const pusherChannel = pusher.subscribe(channel);

    const handleEvent = (data: T) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    pusherChannel.bind(event, handleEvent);

    return () => {
      pusherChannel.unbind(event, handleEvent);
      pusher.unsubscribe(channel);
    };
  }, [channel, event, enabled]);
}
