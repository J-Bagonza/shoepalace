import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateBody, validateParams } from "@/lib/validations/request";
import { updateCartItemSchema, cartItemParamsSchema } from "@/lib/validations/cart";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

async function updateHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), cartItemParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;

  const bodyValidation = await validateBody(req, updateCartItemSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { quantity } = bodyValidation.data;
  const supabase = createServerSupabaseClient();

  // SECURITY: bind both id AND user_id — prevents IDOR
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single<{ id: string }>();

  if (!existing) {
    const body: ApiResponse = { data: null, error: "Cart item not found.", status: 404 };
    return Response.json(body, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .eq("user_id", auth.userId) as { error: { message: string } | null };

  if (error) {
    log.error({ requestId, event: "cart.update.error" }, error.message);
    const body: ApiResponse = { data: null, error: "Failed to update cart.", status: 500 };
    return Response.json(body, { status: 500 });
  }

  log.info({ requestId, event: "cart.update.success", id }, "Cart item updated");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Cart updated." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

async function deleteHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), cartItemParamsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;
  const supabase = createServerSupabaseClient();

  // SECURITY: user_id bind prevents IDOR deletion
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single<{ id: string }>();

  if (!existing) {
    const body: ApiResponse = { data: null, error: "Cart item not found.", status: 404 };
    return Response.json(body, { status: 404 });
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) {
    log.error({ requestId, event: "cart.delete.error" }, error.message);
    const body: ApiResponse = { data: null, error: "Failed to remove item.", status: 500 };
    return Response.json(body, { status: 500 });
  }

  log.info({ requestId, event: "cart.delete.success", id }, "Cart item removed");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Item removed from cart." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const PATCH = withRateLimit("api", updateHandler);
export const DELETE = withRateLimit("api", deleteHandler);