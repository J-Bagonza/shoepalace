import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { User } from "@/types/user";

/**
 * Returns the authenticated user with role from DB.
 * SECURITY: Role is never read from JWT — always fetched from DB.
 * Returns null if unauthenticated or profile missing.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("id, email, role, created_at, updated_at")
    .eq("id", user.id)
    .single<User>();

  if (profileError || !profile) return null;

  return profile;
}

/**
 * Returns true only if authenticated user has admin role.
 * Always reads from DB — never trusts JWT claims.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === "admin";
}