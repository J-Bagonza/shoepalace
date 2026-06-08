import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { SHOEPALACE_SLUG } from "@/types/tenant";
import { PlatformHomePage } from "@/components/platform/platform-home";
import { StoreHomePage } from "@/components/home/store-home";
import { fetchStoresDirectory } from "@/lib/platform/fetch-stores-directory";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import type { Product } from "@/types/product";

export default async function RootPage() {
  const tenant = await getTenantFromHeaders();

  if (!tenant || tenant.slug === SHOEPALACE_SLUG) {
    const stores = await fetchStoresDirectory();
    return <PlatformHomePage stores={stores} />;
  }

  const admin = createAdminSupabaseClient();

  const { data: featuredProducts } = await admin
    .from("products")
    .select(PRODUCT_SELECT)
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
    images: ((p.images as {
      id: string; url: string; alt: string; position: number;
    }[]) ?? []).sort((a, b) => a.position - b.position),
    variants: (p.variants as {
      id: string; size: string; color: string; stock: number;
    }[]) ?? [],
  }));

  return <StoreHomePage featuredProducts={products} tenant={tenant} />;
}