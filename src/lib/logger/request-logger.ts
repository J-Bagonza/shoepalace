import { logger } from "./index";
import { randomUUID } from "crypto";

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

  const log = logger.child({
    requestId,
    method: req.method,
    path: url.pathname,
    ip: hashedIp,
  });

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