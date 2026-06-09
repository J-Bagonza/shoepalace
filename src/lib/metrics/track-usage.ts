import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Fire-and-forget usage tracking.
 * Never throws — always safe to call without awaiting.
 */
export function trackApiRequest(tenantId: string): void {
  if (!tenantId || tenantId === "00000000-0000-0000-0000-000000000010") {
    // Skip tracking for platform itself to keep metrics clean
    return;
  }

  const admin = createAdminSupabaseClient();

  // FIX: Supabase .rpc() returns a PromiseLike (thenable), not a full Promise,
  // so .catch() is not available on it directly. Wrapping in Promise.resolve()
  // promotes it to a real Promise with the full .then()/.catch() API.
  Promise.resolve(
    admin.rpc("increment_tenant_usage", {
      p_tenant_id: tenantId,
      p_api_requests: 1,
    }),
  )
    .then(() => {})
    .catch(() => {}); // Silently ignore errors
}

export function trackPageView(tenantId: string): void {
  if (!tenantId || tenantId === "00000000-0000-0000-0000-000000000010") {
    return;
  }

  const admin = createAdminSupabaseClient();

  Promise.resolve(
    admin.rpc("increment_tenant_usage", {
      p_tenant_id: tenantId,
      p_page_views: 1,
    }),
  )
    .then(() => {})
    .catch(() => {});
}

export function trackOrder(tenantId: string, revenueKes: number): void {
  if (!tenantId) return;

  const admin = createAdminSupabaseClient();

  Promise.resolve(
    admin.rpc("increment_tenant_usage", {
      p_tenant_id: tenantId,
      p_orders_placed: 1,
      p_revenue_kes: revenueKes,
    }),
  )
    .then(() => {})
    .catch(() => {});
}