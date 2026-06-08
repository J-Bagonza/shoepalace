import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { getCache, setCache } from "@/lib/redis/cache";
import { productCacheKeys } from "./cache-keys";
import { applySortOrder, PRODUCT_SELECT } from "./queries";
import type { ActiveFilters } from "./filters";
import type { Product } from "@/types/product";
import type { PaginatedResponse } from "@/types/api";

function parsePriceRange(
  range: string | undefined,
): { min: number; max: number | null } | null {
  if (!range) return null;
  if (range === "300+") return { min: 300, max: null };
  const [min, max] = range.split("-").map(Number);
  if (min === undefined || max === undefined || isNaN(min) || isNaN(max)) {
    return null;
  }
  return { min, max };
}

export async function fetchProducts(
  filters: ActiveFilters,
): Promise<PaginatedResponse<Product>> {
  const tenantId = getTenantIdFromHeaders();

  const cacheKey = productCacheKeys.list(
    `${tenantId}:${new URLSearchParams({
      ...(filters.category && { category: filters.category }),
      sort: filters.sort,
      ...(filters.search && { search: filters.search }),
      ...(filters.price && { price: filters.price }),
      page: String(filters.page),
    }).toString()}`,
  );

  const cached = await getCache<PaginatedResponse<Product>>(cacheKey);
  if (cached) return cached;

  const supabase = createAdminSupabaseClient();

  const from = (filters.page - 1) * filters.page_size;
  const to = from + filters.page_size - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .range(from, to);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) {
    const safe = filters.search.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("name", `%${safe}%`);
  }

  const priceRange = parsePriceRange(filters.price);
  if (priceRange) {
    query = query.gte("price", priceRange.min);
    if (priceRange.max !== null) query = query.lte("price", priceRange.max);
  }

  query = applySortOrder(query, filters.sort) as typeof query;

  const { data, error, count } = await query;

  if (error) {
    return {
      data: [],
      total: 0,
      page: filters.page,
      page_size: filters.page_size,
      total_pages: 0,
    };
  }

  const total = count ?? 0;
  const result: PaginatedResponse<Product> = {
    data: (data ?? []).map((p) => ({
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
    })),
    total,
    page: filters.page,
    page_size: filters.page_size,
    total_pages: Math.ceil(total / filters.page_size),
  };

  await setCache(cacheKey, result, 60);
  return result;
}