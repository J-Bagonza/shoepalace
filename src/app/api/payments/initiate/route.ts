import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { getPayHeroCredentials, initiateSTKPush } from "@/lib/payments/payhero";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const initiatePaymentSchema = z.object({
  order_id: z.string().uuid(),
  phone: z
    .string()
    .min(9, "Invalid phone number")
    .max(15)
    .trim(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);
  const tenantId = getTenantIdFromHeaders();

  const validation = await validateBody(req, initiatePaymentSchema);
  if (!validation.success) return validation.response;

  const { order_id, phone } = validation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  // Verify order exists, belongs to tenant, and is unpaid
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, total, status, payment_status, customer_phone, tenant_id")
    .eq("id", order_id)
    .eq("tenant_id", tenantId)
    .single<{
      id: string;
      total: number;
      status: string;
      payment_status: string;
      customer_phone: string | null;
      tenant_id: string;
    }>();

  if (orderError || !order) {
    return Response.json(
      { data: null, error: "Order not found.", status: 404 },
      { status: 404 },
    );
  }

  if (order.payment_status === "paid") {
    return Response.json(
      { data: null, error: "Order is already paid.", status: 409 },
      { status: 409 },
    );
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    return Response.json(
      { data: null, error: "Order cannot be paid.", status: 409 },
      { status: 409 },
    );
  }

  // Get tenant PayHero credentials
  const credentials = await getPayHeroCredentials(tenantId);
  if (!credentials) {
    return Response.json(
      {
        data: null,
        error: "Payment not available. Contact the store.",
        status: 503,
      },
      { status: 503 },
    );
  }

  // Initiate STK push
  const result = await initiateSTKPush({
    credentials,
    amount: order.total,
    phone,
    orderId: order_id,
    tenantId,
  });

  if (!result.success) {
    log.error(
      { requestId, event: "payment.stk.error", orderId: order_id },
      result.error ?? "STK push failed",
    );
    return Response.json(
      {
        data: null,
        error: "Failed to initiate payment. Check your phone number.",
        status: 502,
      },
      { status: 502 },
    );
  }

  // Update order with payment reference + set payment_status to 'pending'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("orders")
    .update({
      payment_reference: result.reference,
      payment_status: "pending",
    })
    .eq("id", order_id);

  log.info(
    {
      requestId,
      event: "payment.stk.initiated",
      orderId: order_id,
      reference: result.reference,
    },
    "STK push initiated",
  );

  const body: ApiResponse<{ reference: string | undefined; message: string }> =
    {
      data: {
        reference: result.reference,
        message:
          "Check your phone and enter your M-Pesa PIN to complete payment.",
      },
      error: null,
      status: 200,
    };

  return Response.json(body, { status: 200 });
}

export const POST = withRateLimit("api", handler);