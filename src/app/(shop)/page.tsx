import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { SHOEPALACE_SLUG } from "@/types/tenant";
import { PlatformHomePage } from "@/components/platform/platform-home";
import { StoreHomePage } from "@/components/home/store-home";
import { fetchStoresDirectory } from "@/lib/platform/fetch-stores-directory";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Product } from "@/types/product";

export default async function RootPage() {
  const tenant = await getTenantFromHeaders();

  // If this is the platform root domain — show directory
  if (!tenant || tenant.slug === SHOEPALACE_SLUG) {
    const stores = await fetchStoresDirectory();
    return <PlatformHomePage stores={stores} />;
  }

  // Otherwise show the tenant store homepage
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenant.id });

  const { data: featuredProducts } = await admin
    .from("products")
    .select(`
      id, name, slug, description, price, category,
      is_featured, model_url, deleted_at, created_at, updated_at,
      product_images ( id, url, alt, position ),
      product_variants ( id, size, color, stock )
    `)
    .eq("tenant_id", tenant.id)
    .eq("is_featured", true)
    .is("deleted_at", null)
    .limit(4);

  const products: Product[] = (featuredProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    category: p.category,
    is_featured: p.is_featured,
    model_url: p.model_url ?? null,
    deleted_at: p.deleted_at ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
    images: ((p.product_images ?? []) as {
      id: string; url: string; alt: string; position: number;
    }[]).sort((a, b) => a.position - b.position),
    variants: (p.product_variants ?? []) as {
      id: string; size: string; color: string; stock: number;
    }[],
  }));

  return <StoreHomePage featuredProducts={products} tenant={tenant} />;
}