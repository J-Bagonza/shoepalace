import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { getCache, setCache } from "@/lib/redis/cache";
import { productCacheKeys } from "./cache-keys";
import { PRODUCT_SELECT } from "./queries";
import type { Product } from "@/types/product";

export async function fetchSingleProduct(
  slug: string,
): Promise<Product | null> {
  const cacheKey = productCacheKeys.single(slug);
  const cached = await getCache<Product>(cacheKey);
  if (cached) return cached;

  const tenantId = getTenantIdFromHeaders();
  const supabase = createAdminSupabaseClient();
  await supabase.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  const product: Product = {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: data.price,
    category: data.category,
    is_featured: data.is_featured,
    model_url: data.model_url ?? null,
    deleted_at: data.deleted_at ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    images: (data.product_images ?? []).map((img: {
      id: string;
      url: string;
      alt: string;
      position: number;
    }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
    })),
    variants: (data.product_variants ?? []).map((v: {
      id: string;
      size: string;
      color: string;
      stock: number;
    }) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
  };

  await setCache(cacheKey, product, 120);
  return product;
}

export async function fetchRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const tenantId = getTenantIdFromHeaders();
  const supabase = createAdminSupabaseClient();
  await supabase.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category", product.category)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .neq("id", product.id)
    .limit(limit);

  if (error || !data) return [];

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: item.price,
    category: item.category,
    is_featured: item.is_featured,
    model_url: item.model_url ?? null,
    deleted_at: item.deleted_at ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
    images: (item.product_images ?? []).map((img: {
      id: string;
      url: string;
      alt: string;
      position: number;
    }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
    })),
    variants: (item.product_variants ?? []).map((v: {
      id: string;
      size: string;
      color: string;
      stock: number;
    }) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
  }));
}