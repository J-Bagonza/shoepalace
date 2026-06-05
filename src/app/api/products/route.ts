import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
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

  const tenantId = getTenantIdFromHeaders();

  // Build tenant-scoped cache key
  const url = new URL(req.url);
  const cacheKey = productCacheKeys.list(
    `${tenantId}:${url.searchParams.toString()}`,
  );

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

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = admin
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .range(from, to);

  if (category) query = query.eq("category", category);
  if (featured !== undefined) query = query.eq("is_featured", featured);
  if (search) {
    query = query.ilike("name", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
  }

  query = applySortOrder(query, sort) as typeof query;

  const { data, error, count } = await query;

  if (error) {
    log.error({ requestId, event: "products.list.db_error" }, error.message);
    const body: ApiResponse = {
      data: null,
      error: "Failed to fetch products.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  const total = count ?? 0;

  const result: PaginatedResponse<Product> = {
    data: (data ?? []).map((item) => ({
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
      images: ((item.product_images as {
        id: string; url: string; alt: string; position: number;
      }[]) ?? []).sort((a, b) => a.position - b.position),
      variants: (item.product_variants as {
        id: string; size: string; color: string; stock: number;
      }[]) ?? [],
    })),
    total,
    page,
    page_size,
    total_pages: Math.ceil(total / page_size),
  };

  await setCache(cacheKey, result, 60);

  log.info(
    { requestId, event: "products.list.success", total, tenantId },
    "Products fetched",
  );

  const body: ApiResponse<PaginatedResponse<Product>> = {
    data: result,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);