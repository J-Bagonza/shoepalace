import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/user";

/**
 * Verifies session and optionally enforces role.
 * SECURITY: Role always read from DB — never trusted from JWT.
 * SECURITY: Role lookup is tenant-scoped.
 */
export async function requireAuth(
  req: Request,
  requiredRole?: UserRole,
): Promise<{ userId: string; role: UserRole; tenantId: string } | Response> {
  const supabase = createServerSupabaseClient();
  const tenantId = getTenantIdFromHeaders();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return unauthorizedResponse();
  }

  const admin = createAdminSupabaseClient();

  // Set tenant context before role lookup
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .eq("tenant_id", tenantId)
    .single<{ role: UserRole }>();

  if (profileError || !profile) {
    return unauthorizedResponse();
  }

  const role = profile.role;

  if (requiredRole && role !== requiredRole) {
    return forbiddenResponse();
  }

  return { userId: user.id, role, tenantId };
}

function unauthorizedResponse(): Response {
  const body: ApiResponse = {
    data: null,
    error: "Authentication required.",
    status: 401,
  };
  return Response.json(body, { status: 401 });
}

function forbiddenResponse(): Response {
  const body: ApiResponse = {
    data: null,
    error: "Insufficient permissions.",
    status: 403,
  };
  return Response.json(body, { status: 403 });
}