import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// ─── Rate limit configs ───────────────────────────────────────────

const CONFIGS = {
  // Auth routes — strict, per IP
  auth: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:auth",
    analytics: true,
  }),

  // Public API — per tenant
  api: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "rl:api",
    analytics: true,
  }),

  // Admin API — per tenant, more generous
  admin: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(300, "1 m"),
    prefix: "rl:admin",
    analytics: true,
  }),

  // Search — per tenant
  search: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "rl:search",
    analytics: true,
  }),

  // File uploads — per tenant, strict
  upload: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rl:upload",
    analytics: true,
  }),
} as const;

export type RateLimitConfig = keyof typeof CONFIGS;

/**
 * Returns identifier for rate limiting.
 * Admin routes use tenant_id for per-tenant limiting.
 * Auth routes use IP to prevent brute force.
 * Public routes use tenant_id to isolate tenant traffic.
 */
export function getRateLimitIdentifier(
  req: Request,
  config: RateLimitConfig,
): string {
  // Always use IP for auth routes
  if (config === "auth") {
    return (
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown"
    );
  }

  // Use tenant_id for all other routes
  const tenantId =
    req.headers.get("x-tenant-id") ??
    "00000000-0000-0000-0000-000000000010";

  return tenantId;
}

export async function checkRateLimit(
  req: Request,
  config: RateLimitConfig,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = CONFIGS[config];
  const identifier = getRateLimitIdentifier(req, config);

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}