import { getRedisClient } from "@/lib/redis/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    database: "ok" | "error";
    redis: "ok" | "error";
  };
}

export async function GET(): Promise<Response> {
  const timestamp = new Date().toISOString();

  const [dbResult, redisResult] = await Promise.allSettled([
    createAdminSupabaseClient()
      .from("products")
      .select("id", { count: "exact", head: true }),
    getRedisClient().ping(),
  ]);

  const database =
    dbResult.status === "fulfilled" && !dbResult.value.error
      ? "ok"
      : "error";

  const redis =
    redisResult.status === "fulfilled" && redisResult.value === "PONG"
      ? "ok"
      : "error";

  const overall: HealthStatus["status"] =
    database === "ok" && redis === "ok" ? "ok" : "degraded";

  const body: HealthStatus = {
    status: overall,
    timestamp,
    services: { database, redis },
  };

  return Response.json(body, {
    status: overall === "ok" ? 200 : 503,
  });
}