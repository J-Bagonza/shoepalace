"use client";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCartOpen, useCartControls } from "@/store/ui";
import { useCartSync } from "@/hooks/use-cart-sync";

export function CartDrawerController() {
  const cartOpen = useCartOpen();
  const { closeCart } = useCartControls();

  // Sync cart with server on auth state change
  useCartSync();

  return <CartDrawer open={cartOpen} onClose={closeCart} />;
}