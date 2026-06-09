import { checkRateLimit, type RateLimitConfig } from "./rate-limit";
import type { ApiResponse } from "@/types/api";

type RouteHandler = (
  req: Request,
  context?: Record<string, unknown>,
) => Promise<Response>;

/**
 * Wraps a route handler with per-tenant rate limiting.
 * Returns 429 with Retry-After header when limit exceeded.
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: RouteHandler,
): RouteHandler {
  return async (req: Request, context?: Record<string, unknown>) => {
    const result = await checkRateLimit(req, config);

    if (!result.success) {
      const retryAfter = Math.ceil(
        (result.reset - Date.now()) / 1000,
      );

      const body: ApiResponse = {
        data: null,
        error: "Too many requests. Please slow down.",
        status: 429,
      };

      return Response.json(body, {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter > 0 ? retryAfter : 60),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      });
    }

    const response = await handler(req, context);

    // Attach rate limit headers to every response
    response.headers.set("X-RateLimit-Limit", String(result.limit));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(result.remaining),
    );
    response.headers.set("X-RateLimit-Reset", String(result.reset));

    return response;
  };
}