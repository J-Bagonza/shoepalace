import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { Order, OrderItem, OrderEvent } from "@/types/order";

export interface AdminOrderFilters {
  status?: string;
  page?: number;
  page_size?: number;
}

export async function fetchAdminOrders(
  filters: AdminOrderFilters = {},
): Promise<{ orders: Order[]; total: number }> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const page = filters.page ?? 1;
  const page_size = filters.page_size ?? 30;
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = admin
    .from("orders")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query.returns<Order[]>();

  if (error || !data) return { orders: [], total: 0 };
  return { orders: data, total: count ?? 0 };
}

export async function fetchAdminOrderById(
  orderId: string,
): Promise<Order | null> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .single<Order>();

  if (error || !order) return null;

  const [itemsResult, eventsResult] = await Promise.all([
    admin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .returns<OrderItem[]>(),
    admin
      .from("order_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .returns<OrderEvent[]>(),
  ]);

  return {
    ...order,
    items: itemsResult.data ?? [],
    events: eventsResult.data ?? [],
  };
}

type OrderStatKey =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

const ORDER_STAT_KEYS = new Set<string>([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function getOrderStats(tenantId: string): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}> {
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("orders")
    .select("status, total, payment_status")
    .eq("tenant_id", tenantId);

  if (error || !data) {
    return {
      total: 0, pending: 0, confirmed: 0,
      processing: 0, shipped: 0, delivered: 0,
      cancelled: 0, revenue: 0,
    };
  }

  const stats = {
    total: data.length,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
  };

  for (const order of data) {
    if (ORDER_STAT_KEYS.has(order.status)) {
      stats[order.status as OrderStatKey]++;
    }
    if (order.payment_status === "paid") {
      stats.revenue += Number(order.total);
    }
  }

  return stats;
}