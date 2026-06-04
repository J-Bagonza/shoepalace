import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/types/tenant";
import { SHOEPALACE_SLUG } from "@/types/tenant";

// Cache tenant lookups in memory for the lifetime of the serverless instance
// Prevents a DB query on every single request
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
const tenantCache = new Map<string, Tenant | null>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export function extractSubdomain(hostname: string): string {
  // Remove port if present
  const host = hostname.split(":")[0] ?? hostname;

  // Production: storename.shoepalace.com → storename
  // Staging:    storename.shoepalace.vercel.app → storename
  // Local:      storename.localhost → storename
  // Root:       shoepalace.com → shoepalace (default tenant)

  const parts = host.split(".");

  // localhost with no subdomain
  if (host === "localhost" || host === "127.0.0.1") {
    return SHOEPALACE_SLUG;
  }

  // Single part — bare domain
  if (parts.length === 1) return SHOEPALACE_SLUG;

  // vercel.app preview URLs — no subdomain routing
  if (host.endsWith(".vercel.app") && parts.length === 3) {
    return SHOEPALACE_SLUG;
  }

  // shoepalace.com (root domain — default tenant)
  if (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}`
  ) {
    return SHOEPALACE_SLUG;
  }

  // storename.shoepalace.com → storename
  if (parts.length >= 3) {
    return parts[0] ?? SHOEPALACE_SLUG;
  }

  return SHOEPALACE_SLUG;
}

export async function resolveTenantBySlug(
  slug: string,
): Promise<Tenant | null> {
  const now = Date.now();
  const cached = tenantCache.get(slug);
  const cachedAt = cacheTimestamps.get(slug) ?? 0;

  if (cached !== undefined && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, is_active, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .single<Tenant>();

  if (error || !data) {
    tenantCache.set(slug, null);
    cacheTimestamps.set(slug, now);
    return null;
  }

  tenantCache.set(slug, data);
  cacheTimestamps.set(slug, now);
  return data;
}

export function clearTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug);
    cacheTimestamps.delete(slug);
  } else {
    tenantCache.clear();
    cacheTimestamps.clear();
  }
}