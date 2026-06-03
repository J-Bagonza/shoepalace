import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { User } from "@/types/user";

/**
 * Returns authenticated user with role from DB.
 * SECURITY: Role never read from JWT.
 * SECURITY: Scoped to current tenant.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const tenantId = getTenantIdFromHeaders();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("id, email, role, created_at, updated_at")
    .eq("id", user.id)
    .eq("tenant_id", tenantId)
    .single<User>();

  if (profileError || !profile) return null;
  return profile;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === "admin";
}