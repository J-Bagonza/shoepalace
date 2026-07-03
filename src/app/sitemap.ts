import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { SHOEPALACE_TENANT_ID } from "@/types/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

  const admin = createAdminSupabaseClient();

  // Detect whether we're on the root domain or a tenant subdomain
  // by checking if the resolved tenant is ShoePalace itself
  let tenantId: string;
  try {
    tenantId = getTenantIdFromHeaders();
  } catch {
    tenantId = SHOEPALACE_TENANT_ID;
  }

  const isRootDomain = tenantId === SHOEPALACE_TENANT_ID;

  // ── ROOT DOMAIN: shoepalace.store/sitemap.xml ─────────────────
  if (isRootDomain) {
    const baseUrl = `https://${rootDomain}`;

    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/register-store`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ];

    const { data: tenants } = await admin
      .from("tenants")
      .select("slug, updated_at")
      .eq("is_active", true)
      .neq("slug", "shoepalace");

    const tenantRoutes: MetadataRoute.Sitemap = (tenants ?? []).map(
      (t: { slug: string; updated_at: string }) => ({
        url: `https://${t.slug}.${rootDomain}`,
        lastModified: new Date(t.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }),
    );

    return [...staticRoutes, ...tenantRoutes];
  }

  // ── TENANT SUBDOMAIN: helenas.shoepalace.store/sitemap.xml ────
  const { data: tenant } = await admin
    .from("tenants")
    .select("slug, updated_at")
    .eq("id", tenantId)
    .single<{ slug: string; updated_at: string }>();

  if (!tenant) return [];

  const baseUrl = `https://${tenant.slug}.${rootDomain}`;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(tenant.updated_at),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(tenant.updated_at),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(tenant.updated_at),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: new Date(tenant.updated_at),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // All active products for this tenant
  const { data: products } = await admin
    .from("products")
    .select("slug, updated_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map(
    (p: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  return [...staticPages, ...productRoutes];
}