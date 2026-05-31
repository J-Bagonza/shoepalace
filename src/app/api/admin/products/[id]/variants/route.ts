import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { productIdParamsSchema } from "@/lib/validations/product";
import { z } from "zod";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

const updateVariantsSchema = z.object({
  variants: z.array(
    z.object({
      id: z.string().uuid(),
      stock: z.number().int().min(0).max(99999),
    }),
  ).min(1).max(100),
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

  const paramValidation = validateParams(
    getParams(context),
    productIdParamsSchema,
  );
  if (!paramValidation.success) return paramValidation.response;

  const { id: productId } = paramValidation.data;

  const bodyValidation = await validateBody(req, updateVariantsSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { variants } = bodyValidation.data;
  const admin = createAdminSupabaseClient();

  // Verify all variants belong to this product — IDOR prevention
  const { data: existing } = await admin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .in("id", variants.map((v) => v.id));

  const validIds = new Set((existing ?? []).map((v: { id: string }) => v.id));
  const allValid = variants.every((v) => validIds.has(v.id));

  if (!allValid) {
    const body: ApiResponse = {
      data: null,
      error: "One or more variants do not belong to this product.",
      status: 403,
    };
    return Response.json(body, { status: 403 });
  }

  // Update each variant stock
  const errors: string[] = [];
  for (const variant of variants) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("product_variants")
      .update({ stock: variant.stock })
      .eq("id", variant.id)
      .eq("product_id", productId);

    if (error) errors.push(variant.id);
  }

  if (errors.length > 0) {
    log.error(
      { requestId, event: "admin.variants.update.error", errors },
      "Some variants failed to update",
    );
    const body: ApiResponse = {
      data: null,
      error: "Some variants failed to update.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  log.info(
    { requestId, event: "admin.variants.update.success", productId },
    "Variants updated",
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Stock updated successfully." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const PATCH = withRateLimit("api", handler);