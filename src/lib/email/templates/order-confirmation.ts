import { baseTemplate, formatEmailPrice } from "./base";
import type { Order, OrderItem } from "@/types/order";

interface OrderConfirmationData {
  order: Order & { items: OrderItem[] };
  storeName: string;
  logoUrl: string | null;
  appUrl: string;
}

function renderItems(items: OrderItem[]): string {
  return items.map((item) => `
    <div class="item-row">
      <div>
        <div class="item-name">${item.product_name}</div>
        <div class="item-meta">${item.variant_size} / ${item.variant_color} &times; ${item.quantity}</div>
      </div>
      <div class="item-price">${formatEmailPrice(item.subtotal)}</div>
    </div>
  `).join("");
}

export function orderConfirmationTemplate(data: OrderConfirmationData): {
  subject: string;
  html: string;
} {
  const { order, storeName, logoUrl, appUrl } = data;
  const orderUrl = `${appUrl}/orders/${order.id}`;
  const shortId = order.id.slice(0, 8).toUpperCase();

  const content = `
    <h1>Order Received</h1>
    <p>
      Hi ${order.customer_name}, thank you for your order.
      We have received it and will get back to you shortly.
    </p>

    <a href="${orderUrl}" class="btn">Track Your Order</a>

    <h2>Order Summary</h2>
    <div class="label">Order #${shortId}</div>

    ${renderItems(order.items)}

    <div style="margin-top: 16px;">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatEmailPrice(order.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>Shipping</span>
        <span>${formatEmailPrice(order.shipping_fee)}</span>
      </div>
      <div class="total-row final">
        <span>Total</span>
        <span>${formatEmailPrice(order.total)}</span>
      </div>
    </div>

    <div class="divider"></div>

    <h2>Delivery Details</h2>
    <div class="info-block">
      <div class="label">Name</div>
      <div class="value" style="margin-bottom:8px;">${order.customer_name}</div>
      ${order.shipping_address ? `
        <div class="label">Address</div>
        <div class="value" style="margin-bottom:8px;">${order.shipping_address}</div>
      ` : ""}
      <div class="label">Payment</div>
      <div class="value">${
        order.payment_method === "mpesa"
          ? "M-Pesa"
          : "Cash on Delivery"
      }</div>
    </div>

    ${order.payment_method === "mpesa" && order.payment_status !== "paid" ? `
      <div class="info-block" style="border-color:#FEF9C3;background:#FEFCE8;">
        <div style="font-size:13px;color:#854D0E;font-weight:500;">
          Payment Pending
        </div>
        <p style="margin-top:6px;margin-bottom:0;font-size:12px;color:#92400E;">
          Complete your M-Pesa payment to confirm your order.
          <a href="${orderUrl}" style="color:#92400E;">Click here to pay.</a>
        </p>
      </div>
    ` : ""}
  `;

  return {
    subject: `Order #${shortId} received — ${storeName}`,
    html: baseTemplate({
      storeName,
      logoUrl,
      content,
      previewText: `Your order #${shortId} has been received. Total: ${formatEmailPrice(order.total)}.`,
    }),
  };
}