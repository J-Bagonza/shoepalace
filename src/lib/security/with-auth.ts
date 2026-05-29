import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/api";
import type { UserRole } from "@/types/user";

/**
 * Verifies session and optionally enforces role.
 * SECURITY: Role is always read from the database — never trusted from JWT.
 */
export async function requireAuth(
  req: Request,
  requiredRole?: UserRole,
): Promise<{ userId: string; role: UserRole } | Response> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return unauthorizedResponse();
  }

  const admin = createAdminSupabaseClient();
const { data: profile, error: profileError } = await admin
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single<{ role: UserRole }>();

  if (profileError || !profile) {
    return unauthorizedResponse();
  }

  const role = profile.role as UserRole;

  if (requiredRole && role !== requiredRole) {
    return forbiddenResponse();
  }

  return { userId: user.id, role };
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