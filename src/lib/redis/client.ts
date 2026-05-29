import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

/**
 * Singleton Upstash Redis client.
 * Only usable server-side — never import in Client Components.
 */
export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Upstash Redis credentials. Check environment variables.");
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}