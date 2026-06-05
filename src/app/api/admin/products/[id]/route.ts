import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateBody, validateParams } from "@/lib/validations/request";
import {
  updateProductSchema,
  productIdParamsSchema,
} from "@/lib/validations/product";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { deleteCache } from "@/lib/redis/cache";
import { productCacheKeys } from "@/lib/products/cache-keys";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import type { ApiResponse } from "@/types/api";
import type { Product } from "@/types/product";

type ProductKey = {
  id: string;
  slug: string;
  deleted_at: string | null;
};

type ProductUpdatePayload = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  category?: string;
  is_featured?: boolean;
  model_url?: string | null;
};

function getParams(context?: Record<string, unknown>) {
  return context?.params as Record<string, string> | undefined;
}

async function getHandler(req: Request, context?: Record<string, unknown>) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateParams(getParams(context), productIdParamsSchema);
  if (!validation.success) return validation.response;

  const { id } = validation.data;
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .eq("tenant_id", auth.tenantId)
    .single<Product>();

  if (error || !data) {
    log.warn({ requestId, event: "admin.product.get.not_found", id }, "Not found");
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  return Response.json(
    { data, error: null, status: 200 } satisfies ApiResponse<Product>,
    { status: 200 },
  );
}

async function updateHandler(req: Request, context?: Record<string, unknown>) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateParams(getParams(context), productIdParamsSchema);
  if (!validation.success) return validation.response;

  const { id } = validation.data;
  const bodyValidation = await validateBody(req, updateProductSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const updateData = bodyValidation.data;

  if (Object.keys(updateData).length === 0) {
    return Response.json(
      { data: null, error: "No fields provided for update.", status: 400 },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("products")
    .select("id, slug")
    .eq("id", id)
    .eq("tenant_id", auth.tenantId)
    .single<Pick<Product, "id" | "slug">>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  if (updateData.slug && updateData.slug !== existing.slug) {
    const { data: slugConflict } = await admin
      .from("products")
      .select("id")
      .eq("slug", updateData.slug)
      .eq("tenant_id", auth.tenantId)
      .maybeSingle<{ id: string }>();

    if (slugConflict) {
      return Response.json(
        { data: null, error: "Slug already in use.", status: 409 },
        { status: 409 },
      );
    }
  }

  const updatePayload: ProductUpdatePayload = {};
  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.slug !== undefined) updatePayload.slug = updateData.slug;
  if (updateData.description !== undefined) updatePayload.description = updateData.description;
  if (updateData.price !== undefined) updatePayload.price = updateData.price;
  if (updateData.category !== undefined) updatePayload.category = updateData.category;
  if (updateData.is_featured !== undefined) updatePayload.is_featured = updateData.is_featured;
  if (updateData.model_url !== undefined) updatePayload.model_url = updateData.model_url ?? null;

  const { data, error } = await admin
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .eq("tenant_id", auth.tenantId)
    .select(PRODUCT_SELECT)
    .single() as { data: Product | null; error: { message: string } | null };

  if (error || !data) {
    log.error(
      { requestId, event: "admin.product.update.error", id },
      error?.message ?? "unknown",
    );
    return Response.json(
      { data: null, error: "Failed to update product.", status: 500 },
      { status: 500 },
    );
  }

  await deleteCache(productCacheKeys.single(data.slug));
  await deleteCache(productCacheKeys.allListPattern());

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.update",
    targetType: "product",
    targetId: id,
    metadata: { slug: data.slug },
  });

  log.info({ requestId, event: "admin.product.update.success", id }, "Updated");

  return Response.json(
    { data, error: null, status: 200 } satisfies ApiResponse<Product>,
    { status: 200 },
  );
}

async function deleteHandler(req: Request, context?: Record<string, unknown>) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateParams(getParams(context), productIdParamsSchema);
  if (!validation.success) return validation.response;

  const { id } = validation.data;
  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("products")
    .select("id, slug, deleted_at")
    .eq("id", id)
    .eq("tenant_id", auth.tenantId)
    .single<ProductKey>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  if (existing.deleted_at) {
    return Response.json(
      { data: null, error: "Product already deleted.", status: 409 },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", auth.tenantId) as { error: { message: string } | null };

  if (error) {
    log.error({ requestId, event: "admin.product.delete.error" }, error.message);
    return Response.json(
      { data: null, error: "Failed to delete product.", status: 500 },
      { status: 500 },
    );
  }

  await deleteCache(productCacheKeys.single(existing.slug));
  await deleteCache(productCacheKeys.allListPattern());

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.delete",
    targetType: "product",
    targetId: id,
    metadata: { slug: existing.slug },
  });

  return Response.json(
    { data: { message: "Product deleted successfully." }, error: null, status: 200 },
    { status: 200 },
  );
}

async function restoreHandler(req: Request, context?: Record<string, unknown>) {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateParams(getParams(context), productIdParamsSchema);
  if (!validation.success) return validation.response;

  const { id } = validation.data;
  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("products")
    .select("id, slug, deleted_at")
    .eq("id", id)
    .eq("tenant_id", auth.tenantId)
    .single<ProductKey>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  if (!existing.deleted_at) {
    return Response.json(
      { data: null, error: "Product is not deleted.", status: 409 },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("products")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("tenant_id", auth.tenantId) as { error: { message: string } | null };

  if (error) {
    log.error({ requestId, event: "admin.product.restore.error" }, error.message);
    return Response.json(
      { data: null, error: "Failed to restore product.", status: 500 },
      { status: 500 },
    );
  }

  await deleteCache(productCacheKeys.allListPattern());

  return Response.json(
    { data: { message: "Product restored successfully." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const GET = withRateLimit("api", getHandler);
export const PATCH = withRateLimit("api", updateHandler);
export const DELETE = withRateLimit("api", deleteHandler);
export { restoreHandler };