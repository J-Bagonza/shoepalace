import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/user";

export async function requireAuth(
  req: Request,
  requiredRole?: UserRole,
): Promise<{ userId: string; role: UserRole; tenantId: string } | Response> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return unauthorizedResponse();
  }

  const admin = createAdminSupabaseClient();

  // SECURITY: fetch role AND tenant_id from DB — never trust headers or JWT
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single<{ role: UserRole; tenant_id: string }>();

  if (profileError || !profile) {
    return unauthorizedResponse();
  }

  const role = profile.role;
  const tenantId = profile.tenant_id;

  if (requiredRole) {
    const allowed =
      role === requiredRole ||
      (requiredRole === "admin" && role === "platform_admin");

    if (!allowed) {
      return forbiddenResponse();
    }
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