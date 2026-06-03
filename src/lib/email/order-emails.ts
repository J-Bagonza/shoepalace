import { sendEmail, getTenantEmailContext } from "./send";
import { orderConfirmationTemplate } from "./templates/order-confirmation";
import { orderStatusTemplate } from "./templates/order-status";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Order, OrderItem } from "@/types/order";

function logError(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }
}

export async function sendOrderConfirmationEmail(
  orderId: string,
  tenantId: string,
): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("tenant_id", tenantId)
      .single<Order>();

    if (!order) return;

    const { data: items } = await admin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .returns<OrderItem[]>();

    const { tenant, appUrl } = await getTenantEmailContext(tenantId);

    const { subject, html } = orderConfirmationTemplate({
      order: { ...order, items: items ?? [] },
      storeName: tenant.name,
      logoUrl: tenant.logo_url,
      appUrl,
    });

    const result = await sendEmail({
      to: order.customer_email,
      subject,
      html,
    });

    if (!result.success) {
      logError("[email] Order confirmation failed:", result.error, { orderId });
    }
  } catch (err) {
    logError("[email] sendOrderConfirmationEmail exception:", err);
  }
}

export async function sendOrderStatusEmail(
  orderId: string,
  tenantId: string,
  note?: string,
): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

    const { data: order } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("tenant_id", tenantId)
      .single<Order>();

    if (!order) return;

    const EMAIL_STATUSES = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    if (!EMAIL_STATUSES.includes(order.status)) return;

    const { tenant, appUrl } = await getTenantEmailContext(tenantId);

    const { subject, html } = orderStatusTemplate({
      order,
      storeName: tenant.name,
      logoUrl: tenant.logo_url,
      appUrl,
      note,
    });

    const result = await sendEmail({
      to: order.customer_email,
      subject,
      html,
    });

    if (!result.success) {
      logError("[email] Status email failed:", result.error, { orderId, status: order.status });
    }
  } catch (err) {
    logError("[email] sendOrderStatusEmail exception:", err);
  }
}