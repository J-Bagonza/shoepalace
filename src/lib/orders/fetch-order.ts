import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { Order, OrderItem, OrderEvent } from "@/types/order";

export async function fetchOrderById(
  orderId: string,
): Promise<Order | null> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  // Verify ownership — customer must own the order OR be admin
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .single<Order>();

  if (error || !order) return null;

  // SECURITY: non-admins can only see their own orders
  if (order.customer_id && user?.id !== order.customer_id) {
    // Check if user is admin
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user?.id ?? "")
      .eq("tenant_id", tenantId)
      .single<{ role: string }>();

    if (profile?.role !== "admin") return null;
  }

  // Fetch items and events
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

export async function fetchCustomerOrders(): Promise<Order[]> {
  const tenantId = getTenantIdFromHeaders();
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  if (error || !data) return [];
  return data;
}