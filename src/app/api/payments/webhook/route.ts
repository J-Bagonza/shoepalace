import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email/order-emails";
import { validateWebhookPayload } from "@/lib/payments/payhero";
import { createRequestLogger } from "@/lib/logger/request-logger";

// PayHero sends webhooks to:
// /api/payments/webhook?tenant=TENANT_ID

export async function POST(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  // Extract tenant from query param
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenant");

  if (!tenantId || !/^[0-9a-f-]{36}$/.test(tenantId)) {
    log.warn(
      { requestId, event: "webhook.invalid_tenant" },
      "Webhook missing tenant",
    );
    // Return 200 to prevent PayHero retrying
    return Response.json({ received: true }, { status: 200 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ received: true }, { status: 200 });
  }

  if (!validateWebhookPayload(payload)) {
    log.warn(
      { requestId, event: "webhook.invalid_payload" },
      "Invalid webhook payload",
    );
    return Response.json({ received: true }, { status: 200 });
  }

  const { status, external_reference: orderId, amount, reference } = payload;

  log.info(
    {
      requestId,
      event: "webhook.received",
      tenantId,
      orderId,
      status,
      reference,
    },
    "PayHero webhook received",
  );

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  // Fetch the order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, total, status, payment_status, payment_reference, tenant_id",
    )
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .single<{
      id: string;
      total: number;
      status: string;
      payment_status: string;
      payment_reference: string | null;
      tenant_id: string;
    }>();

  if (orderError || !order) {
    log.warn(
      { requestId, event: "webhook.order_not_found", orderId },
      "Order not found for webhook",
    );
    return Response.json({ received: true }, { status: 200 });
  }

  // Idempotency — skip if already processed
  if (
    order.payment_status === "paid" ||
    order.payment_status === "failed"
  ) {
    log.info(
      { requestId, event: "webhook.already_processed", orderId },
      "Webhook skipped — already processed",
    );
    return Response.json({ received: true }, { status: 200 });
  }

  // Verify amount matches order total — prevent underpayment fraud
  const expectedAmount = Math.round(order.total);
  const receivedAmount = Math.round(amount);

  if (status === "SUCCESS" && receivedAmount < expectedAmount) {
    log.warn(
      {
        requestId,
        event: "webhook.amount_mismatch",
        orderId,
        expected: expectedAmount,
        received: receivedAmount,
      },
      "Payment amount mismatch",
    );
    // Mark as failed — underpayment is not accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("order_events").insert({
      order_id: orderId,
      tenant_id: tenantId,
      status: order.status,
      actor_type: "system",
      note: `Payment failed: amount mismatch. Expected KES ${expectedAmount}, received KES ${receivedAmount}.`,
    });

    return Response.json({ received: true }, { status: 200 });
  }

  if (status === "SUCCESS") {
    // Confirm payment and advance order to 'confirmed'
    // The DB trigger handles stock decrement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("orders")
      .update({
        payment_status: "paid",
        payment_reference: reference ?? order.payment_reference,
        status: "confirmed",
      })
      .eq("id", orderId) as { error: { message: string } | null };

    if (updateError) {
      log.error(
        { requestId, event: "webhook.update_error", orderId },
        updateError.message,
      );
      // Return 200 anyway to prevent PayHero retrying
      return Response.json({ received: true }, { status: 200 });
    }

    log.info(
      { requestId, event: "webhook.payment_confirmed", orderId },
      "Order confirmed via webhook",
    );

    // Send confirmation email
    sendOrderConfirmationEmail(orderId, tenantId).catch((err) =>
      log.error(
        { requestId, event: "webhook.email.error", orderId },
        String(err),
      ),
    );
  } else {
    // FAILED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", orderId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("order_events").insert({
      order_id: orderId,
      tenant_id: tenantId,
      status: "pending",
      actor_type: "system",
      note: "M-Pesa payment failed or was cancelled.",
    });

    log.info(
      { requestId, event: "webhook.payment_failed", orderId },
      "Payment failed",
    );
  }

  return Response.json({ received: true }, { status: 200 });
}