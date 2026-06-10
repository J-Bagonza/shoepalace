import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/types/tenant";
import type { ActiveAd } from "@/types/ads";

export interface StoreWithProducts {
  tenant: Tenant;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  }[];
  is_featured: boolean; // has active directory_top ad
}

export async function fetchStoresDirectory(): Promise<StoreWithProducts[]> {
  const admin = createAdminSupabaseClient();

  // Get active directory_top ads
  const { data: activeAds } = await admin.rpc("get_active_ads", {
    p_placement: "directory_top",
  }).returns<ActiveAd[]>();

  const featuredTenantIds = new Set(
    (activeAds ?? []).map((a) => a.tenant_id),
  );

  const { data: tenants, error } = await admin
    .from("tenants")
    .select("*")
    .eq("is_active", true)
    .neq("slug", "shoepalace")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  if (error || !tenants || tenants.length === 0) return [];

  const stores = await Promise.all(
    tenants.map(async (tenant) => {
      const { data: products } = await admin
        .from("products")
        .select(`
          id, name, slug, price,
          product_images ( url, position )
        `)
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .limit(6);

      return {
        tenant,
        is_featured: featuredTenantIds.has(tenant.id),
        products: (products ?? []).map(
          (p: {
            id: string;
            name: string;
            slug: string;
            price: number;
            product_images: { url: string; position: number }[];
          }) => {
            const imgs = [...(p.product_images ?? [])].sort(
              (a, b) => a.position - b.position,
            );
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              image_url: imgs[0]?.url ?? null,
            };
          },
        ),
      };
    }),
  );

  // Featured stores (directory_top ad) appear first
  return stores.sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });
}