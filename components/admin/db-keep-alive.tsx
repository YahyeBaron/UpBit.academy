'use client';

import { useEffect, useRef } from 'react';

/**
 * DbKeepAlive
 *
 * Silently pings /api/health?probe=readiness every INTERVAL_MS milliseconds
 * to prevent the Neon database from auto-suspending during active admin sessions.
 *
 * - Pauses when the tab is hidden (no wasted requests in background).
 * - Resumes immediately on tab focus so the DB is warm before the user acts.
 * - Renders nothing — zero visual footprint.
 */

const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes (Neon suspends after 5 min)

export default function DbKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async () => {
    try {
      await fetch('/api/health?probe=readiness', {
        method: 'GET',
        cache: 'no-store',
      });
    } catch {
      // Silently ignore — network errors shouldn't break the admin UI
    }
  };

  const startInterval = () => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(ping, INTERVAL_MS);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Ping immediately on mount so the DB is warm right away
    ping();
    startInterval();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible — ping immediately then restart interval
        ping();
        stopInterval();
        startInterval();
      } else {
        // Tab hidden — stop pinging to save resources
        stopInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
