import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Tenant } from "@/types/tenant";

export interface StoreWithProducts {
  tenant: Tenant;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
  }[];
}

export async function fetchStoresDirectory(): Promise<StoreWithProducts[]> {
  const admin = createAdminSupabaseClient();

  // Get all active tenants except the platform itself
  const { data: tenants, error } = await admin
    .from("tenants")
    .select("*")
    .eq("is_active", true)
    .neq("slug", "shoepalace")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  if (error || !tenants || tenants.length === 0) return [];

  // For each tenant fetch up to 6 featured products with primary image
  const stores = await Promise.all(
    tenants.map(async (tenant) => {
      await admin.rpc("set_tenant_context", {
        p_tenant_id: tenant.id,
      });

      const { data: products } = await admin
        .from("products")
        .select(`
          id, name, slug, price,
          product_images ( url, position )
        `)
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      return {
        tenant,
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

  return stores;
}