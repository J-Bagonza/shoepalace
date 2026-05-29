import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateParams } from "@/lib/validations/request";
import { productParamsSchema } from "@/lib/validations/product";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { getCache, setCache } from "@/lib/redis/cache";
import { productCacheKeys } from "@/lib/products/cache-keys";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";
import type { Product } from "@/types/product";

async function handler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const params = context?.["params"] as Record<string, string> | undefined;

  const validation = validateParams(params, productParamsSchema);
  if (!validation.success) return validation.response;

  const { slug } = validation.data;
  const cacheKey = productCacheKeys.single(slug);

  const cached = await getCache<Product>(cacheKey);
  if (cached) {
    log.debug({ requestId, event: "product.single.cache_hit", slug }, "Cache hit");
    const cachedBody: ApiResponse<Product> = {
      data: cached,
      error: null,
      status: 200,
    };
    return Response.json(cachedBody, { status: 200 });
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single<Product>();

  if (error || !data) {
    log.warn({ requestId, event: "product.single.not_found", slug }, "Product not found");
    const body: ApiResponse = { data: null, error: "Product not found.", status: 404 };
    return Response.json(body, { status: 404 });
  }

  await setCache(cacheKey, data, 120);

  log.info({ requestId, event: "product.single.success", slug }, "Product fetched");

  const body: ApiResponse<Product> = { data, error: null, status: 200 };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);