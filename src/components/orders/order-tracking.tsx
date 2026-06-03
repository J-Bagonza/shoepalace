"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { OrderStatusBadge } from "./order-status-badge";
import { formatPrice } from "@/utils/product";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProgressTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs text-red-600 uppercase tracking-widest">
          Order {status}
        </span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done ? "#0A0A0A" : "#E5E5E5",
                  scale: active ? 1.15 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="h-3 w-3 rounded-full"
              />
              <span className={`text-[9px] uppercase tracking-widest
                whitespace-nowrap hidden sm:block ${
                  done ? "text-neutral-900" : "text-neutral-300"
                }`}>
                {step}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-5">
                <motion.div
                  initial={false}
                  animate={{
                    width: i < currentIndex ? "100%" : "0%",
                    backgroundColor: "#0A0A0A",
                  }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="h-full"
                  style={{ backgroundColor: "#E5E5E5" }}
                >
                  <motion.div
                    animate={{ width: i < currentIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-neutral-900"
                  />
                </motion.div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface OrderTrackingProps {
  order: Order;
}

export function OrderTracking({ order }: OrderTrackingProps) {
  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Order Tracking
            </h1>
            <p className="text-xs text-neutral-400 font-mono">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap gap-6 text-xs text-neutral-500">
          <span>Placed {formatDate(order.created_at)}</span>
          <span className="uppercase tracking-widest">
            {order.payment_method === "mpesa" ? "M-Pesa" : "Cash on Delivery"}
          </span>
          <span className={
            order.payment_status === "paid"
              ? "text-green-600"
              : order.payment_status === "failed"
                ? "text-red-500"
                : "text-yellow-600"
          }>
            Payment: {order.payment_status}
          </span>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="border border-neutral-100 p-6">
        <ProgressTracker status={order.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Order items */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400">
            Items Ordered
          </h2>
          <div className="flex flex-col gap-4">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-14 shrink-0 bg-[#F5F0E8]
                  overflow-hidden">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.product_name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <Link
                    href={`/products/${item.product_slug}`}
                    className="text-sm font-medium text-neutral-900 truncate
                      hover:text-[#E8001D] transition-colors"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-neutral-400 uppercase
                    tracking-wider">
                    {item.variant_size} / {item.variant_color}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Qty: {item.quantity} ×{" "}
                    {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="text-sm text-neutral-900 shrink-0">
                  {formatPrice(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-neutral-100 pt-4 flex flex-col
            gap-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium
              text-neutral-900 pt-2 border-t border-neutral-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery + timeline */}
        <div className="flex flex-col gap-8">
          {/* Delivery details */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-widest text-neutral-400">
              Delivery Details
            </h2>
            <div className="flex flex-col gap-1.5 text-sm">
              <p className="text-neutral-900 font-medium">
                {order.customer_name}
              </p>
              <p className="text-neutral-500">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-neutral-500">{order.customer_phone}</p>
              )}
              {order.shipping_address && (
                <p className="text-neutral-500 mt-1">
                  {order.shipping_address}
                </p>
              )}
            </div>
          </div>

          {/* Event timeline */}
          {(order.events ?? []).length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-xs uppercase tracking-widest text-neutral-400">
                Order Timeline
              </h2>
              <div className="flex flex-col gap-0">
                {[...(order.events ?? [])]
                  .reverse()
                  .map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0
                          ${i === 0
                            ? "bg-neutral-900"
                            : "bg-neutral-200"
                          }`}
                        />
                        {i < (order.events ?? []).length - 1 && (
                          <div className="w-px flex-1 bg-neutral-100 my-1" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 pb-4">
                        <p className="text-xs font-medium text-neutral-900
                          uppercase tracking-widest">
                          {event.status}
                        </p>
                        {event.note && (
                          <p className="text-xs text-neutral-400">
                            {event.note}
                          </p>
                        )}
                        <p className="text-[10px] text-neutral-300">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-neutral-100">
        <Link
          href="/products"
          className="text-xs uppercase tracking-widest text-neutral-400
            hover:text-neutral-900 transition-colors underline
            underline-offset-4"
        >
          Continue Shopping
        </Link>
        <Link
          href="/orders"
          className="text-xs uppercase tracking-widest text-neutral-400
            hover:text-neutral-900 transition-colors underline
            underline-offset-4"
        >
          All Orders
        </Link>
      </div>
    </div>
  );
}