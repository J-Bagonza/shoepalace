import { rateLimiters, getRateLimitIdentifier, RateLimiterKey } from "./rate-limit";
import type { ApiResponse } from "@/types/api";

/**
 * Wraps a Route Handler with rate limiting.
 * Returns 429 with Retry-After header if limit exceeded.
 */
export function withRateLimit(
  limiterKey: RateLimiterKey,
  handler: (req: Request, context?: Record<string, unknown>) => Promise<Response>,
) {
  return async (
    req: Request,
    context?: Record<string, unknown>,
  ): Promise<Response> => {
    const identifier = getRateLimitIdentifier(req);
    const limiter = rateLimiters[limiterKey];
    const { success, reset } = await limiter.limit(identifier);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      const body: ApiResponse = {
        data: null,
        error: "Too many requests. Please try again later.",
        status: 429,
      };
      return Response.json(body, {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": "exceeded",
        },
      });
    }

    return handler(req, context);
  };
}