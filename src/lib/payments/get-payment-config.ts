import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";

export interface TenantPaymentConfig {
  mpesa_enabled: boolean;
}

export async function getTenantPaymentConfig(): Promise<TenantPaymentConfig> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("tenant_payment_settings")
    .select("is_active, payhero_api_key_encrypted, payhero_channel_id")
    .eq("tenant_id", tenantId)
    .single<{
      is_active: boolean;
      payhero_api_key_encrypted: string | null;
      payhero_channel_id: string | null;
    }>();

  const mpesa_enabled =
    !!data?.is_active &&
    !!data?.payhero_api_key_encrypted &&
    !!data?.payhero_channel_id;

  return { mpesa_enabled };
}