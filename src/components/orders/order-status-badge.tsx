import { clsx } from "clsx";
import type { OrderStatus } from "@/types/order";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  processing: {
    label: "Processing",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  shipped: {
    label: "Shipped",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  refunded: {
    label: "Refunded",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center border px-2.5 py-0.5 text-[10px]",
        "uppercase tracking-widest font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}