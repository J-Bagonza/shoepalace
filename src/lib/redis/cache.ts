import { getRedisClient } from "./client";

const DEFAULT_TTL = 60; // seconds

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, value, { ex: ttlSeconds });
}

export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}