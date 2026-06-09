import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export interface TenantMetricsSummary {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  today_requests: number;
  today_orders: number;
  today_revenue: number;
  week_requests: number;
  week_orders: number;
  week_revenue: number;
  total_products: number;
  total_orders: number;
  is_active: boolean;
}

export interface PlatformHealthSummary {
  total_tenants: number;
  active_tenants: number;
  pending_requests: number;
  today_total_orders: number;
  today_total_revenue: number;
  week_total_orders: number;
  week_total_revenue: number;
  tenants: TenantMetricsSummary[];
}

export async function fetchPlatformHealth(): Promise<PlatformHealthSummary> {
  const admin = createAdminSupabaseClient();

  const today = new Date().toISOString().split("T")[0]!;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  const [tenantsResult, metricsResult, pendingResult, productsResult, ordersResult] =
    await Promise.all([
      admin
        .from("tenants")
        .select("id, name, slug, is_active")
        .order("created_at", { ascending: false }),

      admin
        .from("tenant_usage_metrics")
        .select("tenant_id, date, api_requests, orders_placed, revenue_kes")
        .gte("date", weekAgo),

      admin
        .from("tenant_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),

      admin
        .from("products")
        .select("tenant_id")
        .is("deleted_at", null),

      admin
        .from("orders")
        .select("tenant_id, total, payment_status")
        .neq("status", "cancelled"),
    ]);

  const tenants = tenantsResult.data ?? [];
  const metrics = metricsResult.data ?? [];
  const products = productsResult.data ?? [];
  const orders = ordersResult.data ?? [];

  // Build per-tenant summary
  const tenantSummaries: TenantMetricsSummary[] = tenants.map(
    (tenant: {
      id: string;
      name: string;
      slug: string;
      is_active: boolean;
    }) => {
      const tenantMetrics = metrics.filter(
        (m: { tenant_id: string }) => m.tenant_id === tenant.id,
      );

      const todayMetrics = tenantMetrics.filter(
        (m: { date: string }) => m.date === today,
      );
      const weekMetrics = tenantMetrics;

      const sum = (
        rows: { api_requests?: number; orders_placed?: number; revenue_kes?: number }[],
        key: "api_requests" | "orders_placed" | "revenue_kes",
      ) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

      const tenantProducts = products.filter(
        (p: { tenant_id: string }) => p.tenant_id === tenant.id,
      );

      const tenantOrders = orders.filter(
        (o: { tenant_id: string }) => o.tenant_id === tenant.id,
      );

      return {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
        is_active: tenant.is_active,
        today_requests: sum(todayMetrics, "api_requests"),
        today_orders: sum(todayMetrics, "orders_placed"),
        today_revenue: sum(todayMetrics, "revenue_kes"),
        week_requests: sum(weekMetrics, "api_requests"),
        week_orders: sum(weekMetrics, "orders_placed"),
        week_revenue: sum(weekMetrics, "revenue_kes"),
        total_products: tenantProducts.length,
        total_orders: tenantOrders.length,
      };
    },
  );

  const todayAllMetrics = metrics.filter(
    (m: { date: string }) => m.date === today,
  );

  return {
    total_tenants: tenants.length,
    active_tenants: tenants.filter(
      (t: { is_active: boolean }) => t.is_active,
    ).length,
    pending_requests: pendingResult.count ?? 0,
    today_total_orders: todayAllMetrics.reduce(
      (acc: number, m: { orders_placed?: number }) =>
        acc + (Number(m.orders_placed) || 0),
      0,
    ),
    today_total_revenue: todayAllMetrics.reduce(
      (acc: number, m: { revenue_kes?: number }) =>
        acc + (Number(m.revenue_kes) || 0),
      0,
    ),
    week_total_orders: metrics.reduce(
      (acc: number, m: { orders_placed?: number }) =>
        acc + (Number(m.orders_placed) || 0),
      0,
    ),
    week_total_revenue: metrics.reduce(
      (acc: number, m: { revenue_kes?: number }) =>
        acc + (Number(m.revenue_kes) || 0),
      0,
    ),
    tenants: tenantSummaries,
  };
}