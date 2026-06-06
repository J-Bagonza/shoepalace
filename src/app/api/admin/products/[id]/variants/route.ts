import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { productIdParamsSchema } from "@/lib/validations/product";
import { z } from "zod";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

const variantSchema = z.object({
  size: z.string().min(1).max(20),
  color: z.string().min(1).max(50),
  stock: z.number().int().min(0).max(99999),
});

const createVariantsSchema = z.object({
  variants: z.array(variantSchema).min(1).max(50),
});

const updateVariantSchema = z.object({
  variantId: z.string().uuid(),
  size: z.string().min(1).max(20).optional(),
  color: z.string().min(1).max(50).optional(),
  stock: z.number().int().min(0).max(99999).optional(),
});

const deleteVariantSchema = z.object({
  variantId: z.string().uuid(),
});

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

// GET — list variants for a product
async function getHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;
  const admin = createAdminSupabaseClient();

  // Verify product belongs to tenant
  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (!product) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  const { data, error } = await admin
    .from("product_variants")
    .select("id, size, color, stock, created_at")
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .order("size")
    .order("color");

  if (error) {
    return Response.json(
      { data: null, error: "Failed to fetch variants.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json({ data, error: null, status: 200 }, { status: 200 });
}

// POST — create new variants
async function postHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;

  const bodyValidation = await validateBody(req, createVariantsSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const admin = createAdminSupabaseClient();

  // Verify product belongs to tenant
  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (!product) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  const rows = bodyValidation.data.variants.map((v) => ({
    product_id: productId,
    tenant_id: auth.tenantId,
    size: v.size,
    color: v.color,
    stock: v.stock,
  }));

  const { data, error } = await admin
    .from("product_variants")
    .insert(rows)
    .select("id, size, color, stock");

  if (error) {
    log.error({ requestId }, error.message);
    return Response.json(
      { data: null, error: "Failed to create variants.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json({ data, error: null, status: 201 }, { status: 201 });
}

// PATCH — update a single variant
async function patchHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;

  const bodyValidation = await validateBody(req, updateVariantSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { variantId, ...updates } = bodyValidation.data;

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { data: null, error: "No fields to update.", status: 400 },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  // Verify variant belongs to this product and tenant — IDOR prevention
  const { data: existing } = await admin
    .from("product_variants")
    .select("id")
    .eq("id", variantId)
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Variant not found.", status: 404 },
      { status: 404 },
    );
  }

  const { data, error } = await admin
    .from("product_variants")
    .update(updates)
    .eq("id", variantId)
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .select("id, size, color, stock")
    .single();

  if (error) {
    log.error({ requestId }, error.message);
    return Response.json(
      { data: null, error: "Failed to update variant.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json({ data, error: null, status: 200 }, { status: 200 });
}

// DELETE — remove a variant
async function deleteHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;

  const bodyValidation = await validateBody(req, deleteVariantSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { variantId } = bodyValidation.data;
  const admin = createAdminSupabaseClient();

  // Verify ownership — IDOR prevention
  const { data: existing } = await admin
    .from("product_variants")
    .select("id, stock")
    .eq("id", variantId)
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string; stock: number }>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Variant not found.", status: 404 },
      { status: 404 },
    );
  }

  const { error } = await admin
    .from("product_variants")
    .delete()
    .eq("id", variantId)
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId);

  if (error) {
    log.error({ requestId }, error.message);
    return Response.json(
      { data: null, error: "Failed to delete variant.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: { message: "Variant deleted." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const GET = withRateLimit("api", getHandler);
export const POST = withRateLimit("api", postHandler);
export const PATCH = withRateLimit("api", patchHandler);
export const DELETE = withRateLimit("api", deleteHandler);