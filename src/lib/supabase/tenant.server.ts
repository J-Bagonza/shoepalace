import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { Database } from "@/types/database";

/**
 * Tenant-aware server Supabase client.
 * Automatically sets app.tenant_id on the session so
 * all RLS policies enforce tenant isolation.
 * Use this instead of createServerSupabaseClient in all
 * Route Handlers and Server Components.
 */
export function createTenantServerClient() {
  const cookieStore = cookies();
  const tenantId = getTenantIdFromHeaders();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
              });
            });
          } catch {
            // Server Component context
          }
        },
      },
      global: {
        headers: {
          // Pass tenant_id as a custom header
          // Supabase reads this and sets app.tenant_id
          "x-tenant-id": tenantId,
        },
      },
    },
  );

  return client;
}

/**
 * Tenant-aware admin client.
 * Uses service role but scopes all queries to the
 * current request's tenant via set_config.
 */
export async function createTenantAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const tenantId = getTenantIdFromHeaders();

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  // Set tenant context for this client session
  await client.rpc("set_tenant_context", { p_tenant_id: tenantId });

  return client;
}