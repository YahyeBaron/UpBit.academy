/**
 * ════════════════════════════════════════════════════════════════
 * Upstash Redis REST Client (Serverless HTTP Primitive)
 * ════════════════════════════════════════════════════════════════
 * Works across Vercel serverless / Edge functions without persistent TCP pools.
 * Falls back seamlessly to process memory if Upstash credentials are unset.
 */

const UPSTASH_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export const isRedisConfigured = Boolean(UPSTASH_REST_URL && UPSTASH_REST_TOKEN);

/**
 * Execute a REST command against Upstash Redis
 */
export async function redisCommand<T = any>(command: (string | number)[]): Promise<T | null> {
  if (!isRedisConfigured) {
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_REST_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`[Redis HTTP Error] ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`[Redis Command Error] ${data.error}`);
      return null;
    }

    return data.result as T;
  } catch (err) {
    console.warn('[Redis Fetch Failure]', err);
    return null;
  }
}

/**
 * Distributed Sliding Window Counter in Redis (Lua Script)
 */
export async function redisSlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTimeMs: number } | null> {
  if (!isRedisConfigured) return null;

  const now = Date.now();
  const windowStart = now - windowMs;

  const luaScript = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local windowMs = tonumber(ARGV[4])

    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
    local currentCount = redis.call('ZCARD', key)

    if currentCount < limit then
      redis.call('ZADD', key, now, now)
      redis.call('PEXPIRE', key, windowMs)
      return { 1, limit - currentCount - 1, now + windowMs }
    else
      return { 0, 0, now + windowMs }
    end
  `;

  try {
    const result = await redisCommand<[number, number, number]>([
      'EVAL',
      luaScript,
      1,
      key,
      now,
      windowStart,
      limit,
      windowMs,
    ]);

    if (!result || !Array.isArray(result)) return null;

    return {
      allowed: result[0] === 1,
      remaining: Math.max(0, result[1]),
      resetTimeMs: result[2],
    };
  } catch (err) {
    console.warn('[Redis RateLimit Lua Failure]', err);
    return null;
  }
}
