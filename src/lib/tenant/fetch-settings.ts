import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { TenantSettings } from "@/types/tenant";

export async function fetchTenantSettings(
  tenantId: string,
): Promise<TenantSettings | null> {
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .single<TenantSettings>();

  if (error || !data) return null;
  return data;
}