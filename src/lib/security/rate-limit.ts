import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "@/lib/redis";

/**
 * Pre-configured rate limiters for different route sensitivity levels.
 * All use sliding window algorithm.
 */
export const rateLimiters = {
  /** Strict: auth routes — 5 requests per 10 minutes */
  auth: new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:auth",
  }),

  /** Standard: public API routes — 60 requests per minute */
  api: new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "rl:api",
  }),

  /** Strict: search routes — 30 requests per minute */
  search: new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:search",
  }),

  /** Upload routes — 10 requests per minute */
  upload: new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:upload",
  }),
} as const;

export type RateLimiterKey = keyof typeof rateLimiters;

/**
 * Returns identifier for rate limiting.
 * Uses forwarded IP, falls back to a generic key.
 * IP is NOT hashed here — Upstash stores only the key internally.
 */
export function getRateLimitIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : "anonymous";
  return ip ?? "anonymous";
}