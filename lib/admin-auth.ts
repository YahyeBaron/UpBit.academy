import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────────────────────────────────────
// Process-local session cache (per-instance, 30s TTL)
//
// Purpose: Reduces DB round-trips for repeated requests within the same
// instance's render cycle. The 30-second window is intentionally short to
// bound the lag between admin deactivation and access revocation.
//
// Shared-instance consistency: In multi-instance deployments, deactivation
// is visible to all instances within ≤30 seconds (cache TTL). For immediate
// revocation, call clearAdminSessionCache() after deactivating an admin.
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_CACHE_MAX_SIZE = 100;

interface CachedSession {
  admin: {
    id: string;
    username: string;
    email: string | null;
    role: string;
    isActive: boolean;
  };
  expiresAt: number; // Date.now() + TTL
}

const sessionCache = new Map<string, CachedSession>();

function pruneExpiredAndBoundCache() {
  const now = Date.now();
  for (const [key, val] of sessionCache.entries()) {
    if (val.expiresAt <= now) {
      sessionCache.delete(key);
    }
  }
  while (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
    const oldestKey = sessionCache.keys().next().value;
    if (oldestKey) {
      sessionCache.delete(oldestKey);
    } else {
      break;
    }
  }
}

/**
 * Invalidate one or all cached admin sessions.
 * Call after: admin deactivation, password change, logout, role change.
 */
export function clearAdminSessionCache(token?: string) {
  if (token) {
    sessionCache.delete(token);
  } else {
    sessionCache.clear();
  }
}

/**
 * Resolve and validate an admin session from the request cookie.
 *
 * Returns the admin record if the session is active and not expired,
 * or null if the session is absent, expired, or the admin is deactivated.
 *
 * Uses React cache() for per-request deduplication (multiple calls in the
 * same request share one DB lookup).
 */
export const getAdminSession = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token || token.length < 32) {
      return null;
    }

    // Check process-local cache first
    const now = Date.now();
    const cached = sessionCache.get(token);
    if (cached && cached.expiresAt > now) {
      // Re-validate isActive from cache — if admin was deactivated in DB,
      // the cache entry remains until TTL expires (≤30s window).
      if (!cached.admin.isActive) {
        sessionCache.delete(token);
        return null;
      }
      return cached.admin;
    }

    // Cache miss or expired — query the database
    const session = await prisma.adminSession.findUnique({
      where: { token },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Validate session exists, is not expired, and admin is active
    if (!session || session.expiresAt < new Date() || !session.admin.isActive) {
      sessionCache.delete(token);
      return null;
    }

    // Populate cache
    sessionCache.set(token, {
      admin: session.admin,
      expiresAt: now + SESSION_CACHE_TTL_MS,
    });

    return session.admin;
  } catch (error) {
    // Never leak error details — log internally only
    console.error('[admin-auth] Session validation error (details redacted)');
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    return null;
  }
});

/**
 * Enforce admin authentication. Throws on failure.
 * Use in API route handlers that require an active admin.
 */
export async function validateAdminAuth() {
  const admin = await getAdminSession();
  if (!admin) {
    throw new Error('Unauthorized: Admin session invalid or expired');
  }
  return admin;
}

/**
 * Admin cookie settings.
 * Exported for use in login/logout handlers to ensure consistency.
 */
export const ADMIN_COOKIE_OPTIONS = {
  name: 'admin_session',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // 24-hour session lifetime (strict session rotation)
  maxAge: 60 * 60 * 24,
};
