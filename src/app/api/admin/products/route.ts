import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateBody, validateQuery } from "@/lib/validations/request";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/lib/validations/product";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { deleteCache } from "@/lib/redis/cache";
import { productCacheKeys } from "@/lib/products/cache-keys";
import { applySortOrder, PRODUCT_SELECT } from "@/lib/products/queries";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Product } from "@/types/product";

async function listHandler(req: Request) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateQuery(req, productListQuerySchema);
  if (!validation.success) return validation.response;

  const { page, page_size, category, sort, search } = validation.data;

  const supabase = createServerSupabaseClient();

  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .range(from, to);

  if (category) query = query.eq("category", category);

  if (search) {
    query = query.ilike("name", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
  }

  query = applySortOrder(query, sort) as typeof query;

  const { data, error, count } = await query;

  if (error) {
    log.error({ requestId }, error.message);

    return Response.json(
      { data: null, error: "Failed to fetch products.", status: 500 },
      { status: 500 },
    );
  }

  const total = count ?? 0;

  const result: PaginatedResponse<Product> = {
  data: (data ?? []) as unknown as Product[],
  total,
  page,
  page_size,
  total_pages: Math.ceil(total / page_size),
};

  return Response.json(
    { data: result, error: null, status: 200 },
    { status: 200 },
  );
}

async function createHandler(req: Request) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, createProductSchema);
  if (!validation.success) return validation.response;

  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", validation.data.slug)
    .single<{ id: string }>();

  if (existing) {
    return Response.json(
      { data: null, error: "Slug already in use.", status: 409 },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("products")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      name: validation.data.name,
      slug: validation.data.slug,
      description: validation.data.description,
      price: validation.data.price,
      category: validation.data.category,
      is_featured: validation.data.is_featured ?? false,
      model_url: validation.data.model_url ?? null,
    } as any)
    .select(PRODUCT_SELECT)
    .single<Product>();

  if (error || !data) {
    log.error({ requestId }, error?.message ?? "unknown");

    return Response.json(
      { data: null, error: "Failed to create product.", status: 500 },
      { status: 500 },
    );
  }

  await deleteCache(productCacheKeys.allListPattern());

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.create",
    targetType: "product",
    targetId: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return Response.json(
    { data, error: null, status: 201 },
    { status: 201 },
  );
}

export const GET = withRateLimit("api", listHandler);
export const POST = withRateLimit("api", createHandler);