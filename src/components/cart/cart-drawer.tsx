"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { CartItemRow } from "./cart-item-row";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, formattedTotal, isEmpty, item_count } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md
              flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5
              border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium uppercase tracking-widest
                  text-neutral-900">
                  Cart
                </h2>
                {item_count > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center
                    bg-neutral-900 text-white text-xs">
                    {item_count}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-900 transition-colors
                  text-xs uppercase tracking-widest"
                aria-label="Close cart"
              >
                Close
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6">
              {isEmpty ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-4 py-16"
                >
                  <p className="text-sm text-neutral-400 uppercase tracking-widest">
                    Your cart is empty
                  </p>
                  <button
                    onClick={onClose}
                    className="text-xs text-neutral-900 underline underline-offset-4
                      hover:text-[#E8001D] transition-colors uppercase tracking-widest"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow key={item.variant_id} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-neutral-100 px-6 py-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-neutral-500">
                    Subtotal
                  </span>
                  <span className="text-sm font-medium text-neutral-900">
                    {formattedTotal}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link href="/checkout" onClick={onClose}>
                  <Button variant="primary" className="w-full">
                    Checkout
                  </Button>
                </Link>
                <Button variant="ghost" onClick={onClose}>
                  Continue Shopping
                </Button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}