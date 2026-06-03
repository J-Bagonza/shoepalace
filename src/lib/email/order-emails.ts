import { sendEmail, getTenantEmailContext } from "./send";
import { orderConfirmationTemplate } from "./templates/order-confirmation";
import { orderStatusTemplate } from "./templates/order-status";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Order, OrderItem } from "@/types/order";

export async function sendOrderConfirmationEmail(
  orderId: string,
  tenantId: string,
): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

    // Fetch order with items
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
      console.error(
        "[email] Order confirmation failed:",
        result.error,
        { orderId },
      );
    }
  } catch (err) {
    console.error("[email] sendOrderConfirmationEmail exception:", err);
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

    // Only send emails for meaningful status changes
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
      console.error(
        "[email] Status email failed:",
        result.error,
        { orderId, status: order.status },
      );
    }
  } catch (err) {
    console.error("[email] sendOrderStatusEmail exception:", err);
  }
}