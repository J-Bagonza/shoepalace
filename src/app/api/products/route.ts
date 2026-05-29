import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateQuery } from "@/lib/validations/request";
import { productListQuerySchema } from "@/lib/validations/product";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { getCache, setCache } from "@/lib/redis/cache";
import { productCacheKeys } from "@/lib/products/cache-keys";
import { applySortOrder, PRODUCT_SELECT } from "@/lib/products/queries";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Product } from "@/types/product";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const validation = validateQuery(req, productListQuerySchema);
  if (!validation.success) return validation.response;

  const { page, page_size, category, sort, search, featured } = validation.data;

  // Build deterministic cache key from query params
  const url = new URL(req.url);
  const cacheKey = productCacheKeys.list(url.searchParams.toString());

  const cached = await getCache<PaginatedResponse<Product>>(cacheKey);
  if (cached) {
    log.debug({ requestId, event: "products.list.cache_hit" }, "Cache hit");
   const cachedBody: ApiResponse<PaginatedResponse<Product>> = {
      data: cached,
      error: null,
      status: 200,
    };
    return Response.json(cachedBody, { status: 200 });
  }

  const supabase = createServerSupabaseClient();
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .is("deleted_at", null)
    .range(from, to);

  if (category) {
    query = query.eq("category", category);
  }

  if (featured !== undefined) {
    query = query.eq("is_featured", featured);
  }

  if (search) {
    // SECURITY: parameterized ilike — no raw SQL interpolation
    query = query.ilike("name", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
  }

  query = applySortOrder(query, sort) as typeof query;

  const { data, error, count } = await query;

  if (error) {
    log.error({ requestId, event: "products.list.db_error" }, error.message);
    const body: ApiResponse = { data: null, error: "Failed to fetch products.", status: 500 };
    return Response.json(body, { status: 500 });
  }

  const total = count ?? 0;
  const total_pages = Math.ceil(total / page_size);

  const result: PaginatedResponse<Product> = {
    data: (data ?? []) as unknown as Product[],
    total,
    page,
    page_size,
    total_pages,
  };

  await setCache(cacheKey, result, 60);

  log.info({ requestId, event: "products.list.success", total }, "Products fetched");

  const body: ApiResponse<PaginatedResponse<Product>> = {
    data: result,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);