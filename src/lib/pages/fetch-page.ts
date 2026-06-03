import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import type { CmsPage } from "@/types/page";

export async function fetchPage(slug: string): Promise<CmsPage | null> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();

  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("pages")
    .select("id, tenant_id, slug, title, content, created_at, updated_at")
    .eq("slug", slug)
    .eq("tenant_id", tenantId)
    .single<CmsPage>();

  if (error || !data) return null;
  return data;
}

export async function fetchAllPages(tenantId: string): Promise<CmsPage[]> {
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("pages")
    .select("id, tenant_id, slug, title, content, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("slug");

  if (error || !data) return [];
  return data as unknown as CmsPage[];
}