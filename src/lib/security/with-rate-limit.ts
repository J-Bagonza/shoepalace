import { checkRateLimit, type RateLimitConfig } from "./rate-limit";
import type { ApiResponse } from "@/types/api";

type RouteHandler = (
  req: Request,
  context?: Record<string, unknown>,
) => Promise<Response>;


export function withRateLimit(
  config: RateLimitConfig,
  handler: RouteHandler,
): RouteHandler {
  return async (req: Request, context?: Record<string, unknown>) => {
    let result: {
      success: boolean;
      limit: number;
      remaining: number;
      reset: number;
    } | null = null;

    try {
      result = await checkRateLimit(req, config);
    } catch (err) {
      console.error(
        `[rate-limit] checkRateLimit failed for config="${config}" — ` +
          `failing open`,
        err,
      );
    }

    if (result && !result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

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

    if (result) {
      response.headers.set("X-RateLimit-Limit", String(result.limit));
      response.headers.set(
        "X-RateLimit-Remaining",
        String(result.remaining),
      );
      response.headers.set("X-RateLimit-Reset", String(result.reset));
    }

    return response;
  };
}