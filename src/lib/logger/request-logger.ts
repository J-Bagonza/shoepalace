import { logger } from "./index";
import { randomUUID } from "crypto";
import * as Sentry from "@sentry/nextjs";

export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  ip?: string;
}

/**
 * Creates a child logger bound to a single request lifecycle.
 * Reads x-request-id header if set by middleware.
 * IP is hashed — never stored raw.
 * All log.error calls are automatically forwarded to Sentry.
 */
export function createRequestLogger(req: Request): {
  log: typeof logger;
  requestId: string;
} {
  const requestId =
    req.headers.get("x-request-id") ?? randomUUID();

  const url = new URL(req.url);
  const rawIp =
    req.headers.get("x-forwarded-for") ?? "unknown";
  const hashedIp = hashIp(rawIp);

  const child = logger.child({
    requestId,
    method: req.method,
    path: url.pathname,
    ip: hashedIp,
  });

  // Wrap the child logger so every .error() call also
  // captures to Sentry automatically — no per-route changes needed
  const log = new Proxy(child, {
    get(target, prop) {
      if (prop === "error") {
        return (obj: Record<string, unknown>, msg?: string) => {
          // Forward to Sentry
          const error = obj["err"] instanceof Error
            ? obj["err"]
            : new Error(msg ?? obj["event"] as string ?? "Unknown error");

          Sentry.captureException(error, {
            tags: {
              requestId,
              event: obj["event"] as string ?? "unknown",
              path: url.pathname,
              method: req.method,
            },
            extra: obj,
          });

          // Still log normally
          return target.error(obj, msg);
        };
      }
      return target[prop as keyof typeof target];
    },
  }) as typeof logger;

  return { log, requestId };
}

function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `ip_${Math.abs(hash).toString(16)}`;
}