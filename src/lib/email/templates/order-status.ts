import { baseTemplate, formatEmailPrice } from "./base";
import type { Order } from "@/types/order";

interface OrderStatusData {
  order: Order;
  storeName: string;
  logoUrl: string | null;
  appUrl: string;
  note?: string;
}

const STATUS_MESSAGES: Record
  string,
  { heading: string; body: string; badgeClass: string }
> = {
  confirmed: {
    heading: "Order Confirmed",
    body: "Great news — your order has been confirmed and is being prepared.",
    badgeClass: "status-confirmed",
  },
  processing: {
    heading: "Order Being Prepared",
    body: "Your order is now being packed and prepared for dispatch.",
    badgeClass: "status-processing",
  },
  shipped: {
    heading: "Order Shipped",
    body: "Your order is on its way. You will receive it within the estimated delivery window.",
    badgeClass: "status-shipped",
  },
  delivered: {
    heading: "Order Delivered",
    body: "Your order has been delivered. We hope you love your new shoes.",
    badgeClass: "status-delivered",
  },
  cancelled: {
    heading: "Order Cancelled",
    body: "Your order has been cancelled. If you paid online a refund will be processed within 5 business days.",
    badgeClass: "status-cancelled",
  },
  refunded: {
    heading: "Refund Processed",
    body: "Your refund has been processed. Please allow 5 business days for it to reflect.",
    badgeClass: "status-pending",
  },
};

export function orderStatusTemplate(data: OrderStatusData): {
  subject: string;
  html: string;
} {
  const { order, storeName, logoUrl, appUrl, note } = data;
  const orderUrl = `${appUrl}/orders/${order.id}`;
  const shortId = order.id.slice(0, 8).toUpperCase();
  const msg = STATUS_MESSAGES[order.status] ?? {
    heading: `Order ${order.status}`,
    body: `Your order status has been updated to ${order.status}.`,
    badgeClass: "status-pending",
  };

  const content = `
    <h1>${msg.heading}</h1>
    <span class="status-badge ${msg.badgeClass}">${order.status}</span>

    <p style="margin-top:16px;">
      Hi ${order.customer_name}, ${msg.body}
    </p>

    ${note ? `
      <div class="info-block" style="margin-top:0;">
        <div class="label">Note from store</div>
        <p style="margin-bottom:0;margin-top:6px;">${note}</p>
      </div>
    ` : ""}

    <a href="${orderUrl}" class="btn">View Order</a>

    <div class="divider"></div>

    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div class="label">Order</div>
        <div class="value">#${shortId}</div>
      </div>
      <div>
        <div class="label">Total</div>
        <div class="value">${formatEmailPrice(order.total)}</div>
      </div>
      <div>
        <div class="label">Payment</div>
        <div class="value" style="color:${
          order.payment_status === "paid" ? "#16A34A" : "#CA8A04"
        }">
          ${order.payment_status === "paid" ? "Paid" : "Pending"}
        </div>
      </div>
    </div>
  `;

  return {
    subject: `Order #${shortId} — ${msg.heading} | ${storeName}`,
    html: baseTemplate({
      storeName,
      logoUrl,
      content,
      previewText: `${msg.heading} — Order #${shortId} from ${storeName}.`,
    }),
  };
}