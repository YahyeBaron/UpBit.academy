'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white flex min-h-screen flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.04] border border-white/10 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            An unexpected error occurred. Our engineering team has been automatically alerted via Sentry telemetry.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/25"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
