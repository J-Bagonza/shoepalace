import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single<Product>();

  if (error || !data) return null;

  await setCache(cacheKey, data, 120);
  return data;
}

export async function fetchRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("category", product.category)
    .is("deleted_at", null)
    .neq("id", product.id)
    .limit(limit)
    .returns<Product[]>();

  if (error || !data) return [];
  return data;
}