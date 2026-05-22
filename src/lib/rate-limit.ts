/**
 * src/lib/rate-limit.ts
 * In-memory sliding window rate limiter for public API routes.
 * Swap out the store for Redis/Upstash in production multi-instance environments.
 * Config is per-route and easy to tune via the `rateLimitConfig` export.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

// In-process store — works for single-instance (Vercel serverless: one instance per invocation).
// For multi-instance production, replace with Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export const rateLimitConfig = {
  orders: { limit: 5, windowMs: 60_000 },           // 5 orders per minute per IP
  customRequest: { limit: 3, windowMs: 60_000 },     // 3 inquiries per minute per IP
  promoValidate: { limit: 15, windowMs: 60_000 },    // 15 promo checks per minute per IP
} satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  limit: number;
}

/**
 * Check whether the given key is within the rate limit window.
 * Key should be derived from IP + route (never include PII like phone/name).
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // Start a fresh window
    const entry: RateLimitEntry = { count: 1, resetAt: now + config.windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: config.limit - 1, resetAt: entry.resetAt, limit: config.limit };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit: config.limit };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
    limit: config.limit,
  };
}

/**
 * Extract a safe rate-limit key from a Next.js Request.
 * Falls back to a generic key if IP headers are absent (e.g. local dev).
 */
export function getRateLimitKey(request: Request, route: string): string {
  // Vercel forwards real IP in x-forwarded-for; Cloudflare uses cf-connecting-ip
  const headers = request.headers as Headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const cfIp = headers.get('cf-connecting-ip');
  const realIp = headers.get('x-real-ip');
  const ip = cfIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp || 'local';
  return `${route}:${ip}`;
}
