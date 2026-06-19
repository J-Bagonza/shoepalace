import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/types/tenant";
import { SHOEPALACE_TENANT_ID } from "@/types/tenant";

/**
 * Reads tenant_id injected by middleware into request headers.
 * Use in Server Components and Route Handlers.
 * Falls back to ShoePalace tenant if header missing.
 */
export function getTenantIdFromHeaders(): string {
  const headerStore = headers();
  return headerStore.get("x-tenant-id") ?? SHOEPALACE_TENANT_ID;
}

export function getTenantSlugFromHeaders(): string {
  const headerStore = headers();
  return headerStore.get("x-tenant-slug") ?? "shoepalace";
}

/**
 * Returns full tenant object from headers.
 * Fetches from DB using the tenant_id header.
 */
export async function getTenantFromHeaders(): Promise<Tenant | null> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, is_active, created_at, updated_at")
    .eq("id", tenantId)
    .single<Tenant>();

  if (error || !data) return null;
  return data;
}