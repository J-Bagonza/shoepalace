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
  // Auth — strict per IP, prevents brute force
  auth: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:auth",
    analytics: true,
  }),

  // Public API — per IP, stops individual scrapers/bots
  api: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "rl:api",
    analytics: true,
  }),

  admin: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(300, "1 m"),
    prefix: "rl:admin",
    analytics: true,
  }),

  // Search — per IP, debounced on client but still protect server
  search: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "rl:search",
    analytics: true,
  }),

  // Uploads — per IP + tenant, strict
  upload: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rl:upload",
    analytics: true,
  }),

  // Per-recipient email limiting — prevents email bombing
  // a single address regardless of attacker IP
  emailTarget: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "rl:email-target",
    analytics: true,
  }),

  // Global circuit breaker — caps total app-wide email sends per hour.
  // Protects against a distributed attack using many different
  // recipient addresses, each individually under the emailTarget limit.
  emailGlobal: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(500, "1 h"),
    prefix: "rl:email-global",
    analytics: true,
  }),
} as const;

export type RateLimitConfig = keyof typeof CONFIGS;

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function getRateLimitIdentifier(
  req: Request,
  config: RateLimitConfig,
): string {
  const ip = getClientIp(req);
  const tenantId = req.headers.get("x-tenant-id") ?? "unknown";

  switch (config) {
    case "auth":
    case "api":
    case "search":
      return ip;

    case "admin":
    case "upload":
      return `${ip}:${tenantId}`;

    default:
      return ip;
  }
}

export async function checkRateLimit(
  req: Request,
  config: RateLimitConfig,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
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

/**
 * Limits by an arbitrary identifier rather than a Request object.
 * Used for non-HTTP-route contexts like sendEmail(), which is called
 * from fire-and-forget background tasks, not directly from a route handler.
 */
export async function checkRateLimitByKey(
  config: RateLimitConfig,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const limiter = CONFIGS[config];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}