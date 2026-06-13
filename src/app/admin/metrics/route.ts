import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const admin = createAdminSupabaseClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  const { data: metrics, error } = await admin
    .from("tenant_usage_metrics")
    .select("date, api_requests, page_views, orders_placed, revenue_kes")
    .eq("tenant_id", auth.tenantId)
    .gte("date", thirtyDaysAgo)
    .order("date", { ascending: false });

  if (error) {
    log.error(
      { requestId, event: "admin.metrics.error" },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to fetch metrics.", status: 500 },
      { status: 500 },
    );
  }

  const summary = {
    total_requests: metrics?.reduce((a, m) => a + (m.api_requests || 0), 0) ?? 0,
    total_orders: metrics?.reduce((a, m) => a + (m.orders_placed || 0), 0) ?? 0,
    total_revenue: metrics?.reduce((a, m) => a + (Number(m.revenue_kes) || 0), 0) ?? 0,
    daily: metrics ?? [],
  };

  const body: ApiResponse<typeof summary> = {
    data: summary,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);