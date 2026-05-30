import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/api";

export async function GET(): Promise<Response> {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { data: null, error: "Unauthenticated.", status: 401 },
      { status: 401 },
    );
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  const body: ApiResponse<{ role: string }> = {
    data: { role: profile?.role ?? "customer" },
    error: null,
    status: 200,
  };

  return Response.json(body, { status: 200 });
}