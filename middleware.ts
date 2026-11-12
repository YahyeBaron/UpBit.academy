import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Route Classification
//
// Route Classes (defence-in-depth applies at the handler level too):
//   public            – accessible without any authentication
//   clerk-auth        – requires valid Clerk session (users)
//   admin             – requires separate admin session (see lib/admin-auth.ts)
//   signed-webhook    – validated by raw-body HMAC (Sifalo, Clerk, Stripe)
//   internal-only     – requires INTERNAL_METRICS_TOKEN header or admin session
// ─────────────────────────────────────────────────────────────────────────────

const isClerkProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/courses/:slug/learn(.*)',
  '/checkout(.*)',
]);

// Clerk keys are required in production. Missing keys are a hard configuration
// error — never bypass authentication by falling through to NextResponse.next().
function isClerkConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isClerkConfigured()) {
    if (isProduction) {
      // FAIL CLOSED in production: never silently bypass authentication.
      // Return a 503 configuration error so the problem is visible immediately.
      console.error(
        '[middleware] CRITICAL: Clerk authentication keys are not configured. ' +
          'Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY environment variables.'
      );
      return new NextResponse(
        JSON.stringify({ error: 'Service unavailable: authentication not configured.' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
        }
      );
    }

    // Development-only fallback: allow traffic with a loud warning so developers
    // notice the misconfiguration immediately without blocking local setup.
    console.warn(
      '[middleware][DEV] Clerk keys are missing. Auth is DISABLED for local development. ' +
        'This would be a hard failure in production.'
    );
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth, req) => {
    const pathname = req.nextUrl.pathname;

    // ── Edge Protection for Admin Control Panel ──────────────────────────────
    // PURPOSE: Fast routing guard. This check validates only that an
    // admin_session cookie is present and has a plausible token length (≥32 chars).
    //
    // AUTHORITATIVE AUTH: This is NOT the cryptographic session validation.
    // Full validation (DB lookup, expiry check, isActive flag) is performed by
    // getAdminSession() inside every admin route handler (lib/admin-auth.ts).
    //
    // DEFENCE-IN-DEPTH: Even if this edge guard were bypassed, every protected
    // admin API handler independently calls getAdminSession() / validateAdminAuth()
    // and rejects unauthenticated or deactivated sessions.
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      const adminToken = req.cookies.get('admin_session')?.value;
      if (!adminToken || adminToken.length < 32) {
        const loginUrl = new URL('/admin/login', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    if (isClerkProtectedRoute(req)) {
      // Defence-in-depth: protect() enforces auth even if middleware were somehow
      // misconfigured. Individual route handlers MUST still verify auth independently.
      const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
      const unauthenticatedUrl = new URL(`/login?redirect_url=${encodeURIComponent(returnUrl)}`, req.url).toString();

      await auth.protect({
        unauthenticatedUrl,
      });
    }
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
