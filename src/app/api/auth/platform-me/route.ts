import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/api";

/**
 * Platform-specific auth check.
 * Unlike /api/auth/me, this does NOT filter by tenant_id.
 * platform_admin users exist outside any tenant scope, so
 * the standard tenant-scoped lookup always returns null for them
 * on the root domain where no x-tenant-id header is present.
 */
export async function GET(): Promise<Response> {
  const supabase = createServerSupabaseClient();

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

  // No tenant_id filter — platform_admin has no tenant row
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (!profile) {
    return Response.json(
      { data: null, error: "User not found.", status: 404 },
      { status: 404 },
    );
  }

  const body: ApiResponse<{ role: string; email: string }> = {
    data: { role: profile.role, email: user.email ?? "" },
    error: null,
    status: 200,
  };

  return Response.json(body, { status: 200 });
}