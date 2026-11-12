import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Route Classification
//   public        – accessible without authentication
//   clerk-auth    – requires valid Clerk session
//   admin         – requires separate admin session (lib/admin-auth.ts)
// ─────────────────────────────────────────────────────────────────────────────

function isClerkProtectedPath(pathname: string): boolean {
  if (pathname.startsWith('/dashboard')) return true;
  if (pathname.startsWith('/checkout')) return true;
  // Only /courses/:slug/learn — not the catalog or detail page
  if (/^\/courses\/[^/]+\/learn/.test(pathname)) return true;
  return false;
}

// clerkMiddleware MUST be the direct default export for Next.js Edge Runtime.
// All logic lives inside the callback — no conditional wrapping allowed.
export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // ── Edge Protection for Admin Control Panel ───────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = req.cookies.get('admin_session')?.value;
    if (!adminToken || adminToken.length < 32) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Clerk Auth Protection ─────────────────────────────────────────────────
  if (isClerkProtectedPath(pathname)) {
    const returnUrl = pathname + req.nextUrl.search;
    const unauthenticatedUrl = new URL(
      `/login?redirect_url=${encodeURIComponent(returnUrl)}`,
      req.url
    ).toString();

    await auth.protect({ unauthenticatedUrl });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
