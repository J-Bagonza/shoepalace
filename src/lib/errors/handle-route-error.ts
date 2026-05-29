import * as Sentry from "@sentry/nextjs";
import { AppError } from "./app-error";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/types/api";

/**
 * Catches any thrown error in a Route Handler and returns
 * a safe, structured JSON response.
 * SECURITY: never exposes stack traces or internal messages.
 */
export function handleRouteError(
  error: unknown,
  context?: Record<string, string>,
): Response {
  // Known operational errors — safe to surface message
  if (error instanceof AppError && error.isOperational) {
    logger.warn(
      { code: error.code, ...context },
      error.message,
    );

    const body: ApiResponse = {
      data: null,
      error: error.message,
      status: error.statusCode,
    };
    return Response.json(body, { status: error.statusCode });
  }

  // Unknown errors — log full detail internally, return generic message
  logger.error(
    { error, ...context },
    "Unhandled route error",
  );

  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error);
  }

  const body: ApiResponse = {
    data: null,
    error: "An unexpected error occurred.",
    status: 500,
  };
  return Response.json(body, { status: 500 });
}