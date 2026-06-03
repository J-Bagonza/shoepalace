import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import type { Json } from "@/types/database";

const productIdSchema = z.object({ id: z.string().uuid() });

const stockMovementSchema = z.object({
  movements: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        delta: z
          .number()
          .int()
          .min(-99999)
          .max(99999)
          .refine((v) => v !== 0, "Delta cannot be zero"),
        reason: z.enum([
          "restock",
          "manual_increase",
          "manual_decrease",
          "damaged",
          "return",
        ]),
        note: z.string().max(500).trim().optional(),
      }),
    )
    .min(1)
    .max(100),
});

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

async function handler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;

  const bodyValidation = await validateBody(req, stockMovementSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { movements } = bodyValidation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // Verify all variants belong to this product + tenant
  const variantIds = movements.map((m) => m.variant_id);

  const { data: validVariants } = await admin
    .from("product_variants")
    .select("id, stock")
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .in("id", variantIds);

  const validIds = new Set(
    (validVariants ?? []).map((v: { id: string }) => v.id),
  );

  if (movements.some((m) => !validIds.has(m.variant_id))) {
    return Response.json(
      {
        data: null,
        error: "One or more variants do not belong to this product.",
        status: 403,
      },
      { status: 403 },
    );
  }

  // Validate manual decreases won't go below zero
  const currentStockMap = new Map(
    (validVariants ?? []).map(
      (v: { id: string; stock: number }) => [v.id, v.stock],
    ),
  );

  for (const movement of movements) {
    if (movement.delta < 0) {
      const current = currentStockMap.get(movement.variant_id) ?? 0;
      if (current + movement.delta < 0) {
        return Response.json(
          {
            data: null,
            error: `Cannot reduce stock below zero for variant ${movement.variant_id}.`,
            status: 409,
          },
          { status: 409 },
        );
      }
    }
  }

  // Insert movements and update product_variants.stock
  const errors: string[] = [];

  for (const movement of movements) {
    const { error: insertError } = await admin
      .from("stock_movements")
      .insert({
        tenant_id: auth.tenantId,
        variant_id: movement.variant_id,
        delta: movement.delta,
        reason: movement.reason,
        note: movement.note ?? null,
        actor_id: auth.userId,
      });

    if (insertError) {
      errors.push(movement.variant_id);
      continue;
    }

    // Keep product_variants.stock in sync
    await admin
      .from("product_variants")
      .update({
        stock: (currentStockMap.get(movement.variant_id) ?? 0) +
          movement.delta,
      })
      .eq("id", movement.variant_id)
      .eq("tenant_id", auth.tenantId);
  }

  if (errors.length > 0) {
    log.error(
      { requestId, event: "admin.stock.movement.error", errors },
      "Some movements failed",
    );
    return Response.json(
      { data: null, error: "Some movements failed.", status: 500 },
      { status: 500 },
    );
  }

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.update",
    targetType: "product",
    targetId: productId,
    metadata: { movements: movements, type: "stock_movement" },
  });

  log.info(
    {
      requestId,
      event: "admin.stock.movement.success",
      productId,
      count: movements.length,
    },
    "Stock movements recorded",
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Stock updated." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

// GET — returns movement history for a product's variants
async function getHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), productIdSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // Get variant ids for this product
  const { data: variants } = await admin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId);

  if (!variants || variants.length === 0) {
    return Response.json(
      { data: [], error: null, status: 200 },
      { status: 200 },
    );
  }

  const variantIds = variants.map((v: { id: string }) => v.id);

  const { data: movements, error } = await admin
    .from("stock_movements")
    .select("*")
    .in("variant_id", variantIds)
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return Response.json(
      { data: null, error: "Failed to fetch movements.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: movements ?? [], error: null, status: 200 },
    { status: 200 },
  );
}

export const POST = withRateLimit("api", handler);
export const GET = withRateLimit("api", getHandler);