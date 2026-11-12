import { redisSlidingWindow, isRedisConfigured } from '@/lib/redis';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export interface RateLimitOptions {
  limit: number;      // Maximum allowed requests in window
  windowMs: number;   // Window size in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Fallback — Development Only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-memory store for rate limit records.
 * ONLY used as a fallback when Redis is unavailable (non-production / dev mode).
 * In production without Redis: rate limit is always ALLOWED with a warning logged once.
 */
const _devRateLimitStore = new Map<string, RateLimitRecord>();
let _prodNoRedisFallbackWarned = false;

function _checkInMemoryRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();

  // Bounded cleanup: prevent unbounded memory growth
  if (_devRateLimitStore.size > 2000) {
    for (const [key, val] of _devRateLimitStore.entries()) {
      if (val.resetTime < now) {
        _devRateLimitStore.delete(key);
      }
    }
  }

  const record = _devRateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    _devRateLimitStore.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetTimeMs: newRecord.resetTime,
    };
  }

  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetTimeMs: record.resetTime,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Distributed Rate Limiter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distributed Rate Limiter:
 * - In production with Redis: uses Upstash Redis sliding window (source of truth).
 * - In dev without Redis: uses bounded in-memory fallback.
 * - In production without Redis: allows all requests + emits a one-time warning.
 *   This preserves availability but operators are alerted to configure Redis.
 */
export async function checkRateLimitAsync(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (isRedisConfigured) {
    const redisResult = await redisSlidingWindow(
      `ratelimit:${identifier}`,
      options.limit,
      options.windowMs
    );
    if (redisResult) {
      return redisResult;
    }
    // Redis configured but request failed — fall through to in-memory
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !isRedisConfigured) {
    if (!_prodNoRedisFallbackWarned) {
      _prodNoRedisFallbackWarned = true;
      console.warn('[RateLimit] Upstash Redis is not configured in production. Rate limiting is disabled. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
    }
    // Fail open in production without Redis to preserve availability
    return { allowed: true, remaining: options.limit, resetTimeMs: Date.now() + options.windowMs };
  }

  // Development-only in-memory fallback
  return _checkInMemoryRateLimit(identifier, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite-Key Rate Limiters for Specific Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checkout creation: 10 attempts per minute.
 * Key: composite of IP + authenticated userId (prevents bypass by rotating IPs or user accounts).
 */
export async function checkCheckoutRateLimit(
  ip: string,
  userId: string
): Promise<RateLimitResult> {
  return checkRateLimitAsync(
    `checkout:${ip}:${userId}`,
    { limit: 10, windowMs: 60 * 1000 }
  );
}

/**
 * Promo code validation: 10 attempts per minute.
 * Key: composite of IP + userId + normalized promo code.
 * Prevents info-probing of code existence by unauthenticated users.
 */
export async function checkPromoRateLimit(
  ip: string,
  userId: string,
  promoCode: string
): Promise<RateLimitResult> {
  const normalizedCode = promoCode.trim().toUpperCase().slice(0, 30);
  return checkRateLimitAsync(
    `promo:${ip}:${userId}:${normalizedCode}`,
    { limit: 10, windowMs: 60 * 1000 }
  );
}

/**
 * Sifalo webhook callback: 30 attempts per minute, keyed by IP only (no user context available).
 */
export async function checkSifaloCallbackRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimitAsync(
    `sifalo_webhook:${ip}`,
    { limit: 30, windowMs: 60 * 1000 }
  );
}

/**
 * Auth endpoints: 5 attempts per 15 minutes.
 */
export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimitAsync(`auth:${identifier}`, { limit: 5, windowMs: 15 * 60 * 1000 });
}

/**
 * Public API routes (e.g. newsletter subscribe): 60 attempts per minute.
 */
export async function checkPublicApiRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimitAsync(`public_api:${identifier}`, { limit: 60, windowMs: 60 * 1000 });
}

/**
 * Admin login: 5 attempts per 15 minutes keyed by IP.
 */
export async function checkAdminLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimitAsync(`admin_login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
}
