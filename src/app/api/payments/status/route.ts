import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateQuery } from "@/lib/validations/request";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { getPayHeroCredentials, getPaymentStatus } from "@/lib/payments/payhero";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const statusQuerySchema = z.object({
  order_id: z.string().uuid(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);
  const tenantId = getTenantIdFromHeaders();

  const validation = validateQuery(req, statusQuerySchema);
  if (!validation.success) return validation.response;

  const { order_id } = validation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, payment_status, payment_reference, status, total, tenant_id",
    )
    .eq("id", order_id)
    .eq("tenant_id", tenantId)
    .single<{
      id: string;
      payment_status: string;
      payment_reference: string | null;
      status: string;
      total: number;
      tenant_id: string;
    }>();

  if (error || !order) {
    return Response.json(
      { data: null, error: "Order not found.", status: 404 },
      { status: 404 },
    );
  }

  // Already resolved — return immediately
  if (order.payment_status === "paid" || order.payment_status === "failed") {
    const body: ApiResponse<{ payment_status: string; order_status: string }> =
      {
        data: {
          payment_status: order.payment_status,
          order_status: order.status,
        },
        error: null,
        status: 200,
      };
    return Response.json(body, { status: 200 });
  }

  // No reference yet — still pending
  if (!order.payment_reference) {
    const body: ApiResponse<{ payment_status: string; order_status: string }> =
      {
        data: { payment_status: "pending", order_status: order.status },
        error: null,
        status: 200,
      };
    return Response.json(body, { status: 200 });
  }

  // Poll PayHero for current status
  const credentials = await getPayHeroCredentials(tenantId);
  if (!credentials) {
    const body: ApiResponse<{ payment_status: string; order_status: string }> =
      {
        data: {
          payment_status: order.payment_status,
          order_status: order.status,
        },
        error: null,
        status: 200,
      };
    return Response.json(body, { status: 200 });
  }

  const paymentStatus = await getPaymentStatus(
    credentials,
    order.payment_reference,
  );

  // If status changed — update DB
  if (paymentStatus !== "pending" && paymentStatus !== order.payment_status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("orders")
      .update({
        payment_status: paymentStatus,
        ...(paymentStatus === "paid" ? { status: "confirmed" } : {}),
      })
      .eq("id", order_id);

    log.info(
      {
        requestId,
        event: "payment.status.updated",
        orderId: order_id,
        paymentStatus,
      },
      "Payment status updated via poll",
    );
  }

  const body: ApiResponse<{ payment_status: string; order_status: string }> = {
    data: {
      payment_status: paymentStatus,
      order_status:
        paymentStatus === "paid" ? "confirmed" : order.status,
    },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);