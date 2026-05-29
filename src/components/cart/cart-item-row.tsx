"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCartActions } from "@/store/cart";
import { formatPrice } from "@/utils/product";
import type { CartItem } from "@/types/cart";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { removeItem, updateQuantity } = useCartActions();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4 py-5 border-b border-neutral-100 last:border-0"
    >
      {/* Image */}
      <div className="relative h-20 w-16 shrink-0 bg-[#F5F0E8]">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">
          {item.product_name}
        </p>
        <p className="text-xs text-neutral-400 uppercase tracking-wider">
          {item.size} / {item.color}
        </p>
        <p className="text-sm font-medium text-neutral-900">
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() =>
              item.quantity > 1
                ? updateQuantity(item.variant_id, item.quantity - 1)
                : removeItem(item.variant_id)
            }
            className="h-6 w-6 flex items-center justify-center border border-neutral-200
              text-neutral-600 hover:border-neutral-900 transition-colors text-sm"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-sm w-4 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
            disabled={item.quantity >= 99}
            className="h-6 w-6 flex items-center justify-center border border-neutral-200
              text-neutral-600 hover:border-neutral-900 transition-colors text-sm
              disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.variant_id)}
        className="self-start text-neutral-300 hover:text-[#E8001D] transition-colors
          text-xs uppercase tracking-widest mt-0.5"
        aria-label="Remove item"
      >
        Remove
      </button>
    </motion.div>
  );
}