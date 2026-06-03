import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { updateOrderStatusSchema, orderIdSchema } from "@/lib/validations/order";
import { fetchAdminOrderById } from "@/lib/orders/fetch-admin-orders";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";
import type { ApiResponse } from "@/types/api";
import type { Order } from "@/types/order";

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

async function getHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), orderIdSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;
  const order = await fetchAdminOrderById(id);

  if (!order) {
    const body: ApiResponse = {
      data: null,
      error: "Order not found.",
      status: 404,
    };
    return Response.json(body, { status: 404 });
  }

  const body: ApiResponse<Order> = { data: order, error: null, status: 200 };
  return Response.json(body, { status: 200 });
}

async function updateHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(getParams(context), orderIdSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;

  const bodyValidation = await validateBody(req, updateOrderStatusSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { status, note } = bodyValidation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  const existing = await fetchAdminOrderById(id);
  if (!existing) {
    const body: ApiResponse = {
      data: null,
      error: "Order not found.",
      status: 404,
    };
    return Response.json(body, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", auth.tenantId) as {
    error: { message: string } | null;
  };

  if (updateError) {
    log.error(
      { requestId, event: "admin.order.update.error", id },
      updateError.message,
    );
    const body: ApiResponse = {
      data: null,
      error: updateError.message.includes("Insufficient stock")
        ? "Cannot confirm — insufficient stock for one or more items."
        : "Failed to update order status.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  if (note) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("order_events")
      .insert({
        order_id: id,
        tenant_id: auth.tenantId,
        status,
        note,
        actor_id: auth.userId,
        actor_type: "admin",
      });
  }

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.update",
    targetType: "order",
    targetId: id,
    metadata: { status, note: note ?? "" },
  });

  sendOrderStatusEmail(id, auth.tenantId, note).catch((err) =>
    log.error(
      { requestId, event: "order.status.email.error" },
      String(err),
    ),
  );

  log.info(
    { requestId, event: "admin.order.update.success", id, status },
    "Order status updated",
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Order updated." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", getHandler);
export const PATCH = withRateLimit("api", updateHandler);