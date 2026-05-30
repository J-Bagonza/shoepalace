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

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  is_featured: boolean;
  model_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  product_images: {
    id: string;
    url: string;
    alt: string;
    position: number;
  }[];
  product_variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
  }[];
}

function mapProduct(data: RawProduct): Product {
  return {
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
    images: (data.product_images ?? []).sort(
      (a, b) => a.position - b.position,
    ),
    variants: data.product_variants ?? [],
  };
}

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
    const body: ApiResponse<Product> = { data: cached, error: null, status: 200 };
    return Response.json(body, { status: 200 });
  }

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single<RawProduct>();

  if (error || !data) {
    log.warn({ requestId, event: "product.single.not_found", slug }, "Not found");
    const body: ApiResponse = { data: null, error: "Product not found.", status: 404 };
    return Response.json(body, { status: 404 });
  }

  const product = mapProduct(data);
  await setCache(cacheKey, product, 120);

  log.info({ requestId, event: "product.single.success", slug }, "Product fetched");

  const body: ApiResponse<Product> = { data: product, error: null, status: 200 };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);