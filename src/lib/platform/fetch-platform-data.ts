import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Tenant, TenantRequest } from "@/types/tenant";

export async function fetchAllTenants(): Promise<Tenant[]> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  if (error || !data) return [];
  return data;
}

export async function fetchTenantRequests(
  status?: "pending" | "approved" | "rejected",
): Promise<TenantRequest[]> {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("tenant_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<TenantRequest[]>();

  if (error || !data) return [];
  return data;
}

export async function fetchPlatformStats(): Promise<{
  total_tenants: number;
  active_tenants: number;
  pending_requests: number;
  total_orders: number;
}> {
  const admin = createAdminSupabaseClient();

  const [tenants, pendingRequests, orders] = await Promise.all([
    admin.from("tenants").select("id, is_active"),
    admin
      .from("tenant_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true }),
  ]);

  const tenantData = tenants.data ?? [];

  return {
    total_tenants: tenantData.length,
    active_tenants: tenantData.filter(
      (t: { is_active: boolean }) => t.is_active,
    ).length,
    pending_requests: pendingRequests.count ?? 0,
    total_orders: orders.count ?? 0,
  };
}