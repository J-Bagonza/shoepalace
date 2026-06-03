import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { ApiResponse } from "@/types/api";

export async function GET(): Promise<Response> {
  const supabase = createServerSupabaseClient();
  const tenantId = getTenantIdFromHeaders();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { data: null, error: "Unauthenticated.", status: 401 },
      { status: 401 },
    );
  }

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .eq("tenant_id", tenantId)
    .single<{ role: string }>();

  const body: ApiResponse<{ role: string; tenantId: string }> = {
    data: {
      role: profile?.role ?? "customer",
      tenantId,
    },
    error: null,
    status: 200,
  };

  return Response.json(body, { status: 200 });
}