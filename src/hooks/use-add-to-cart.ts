"use client";

import { useState } from "react";
import { useCartActions, useCartStore } from "@/store/cart";
import { useCartControls } from "@/store/ui";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types/cart";

interface AddToCartOptions {
  item: CartItem;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useAddToCart() {
  const [loading, setLoading] = useState(false);
  const { addItem } = useCartActions();
  const { openCart } = useCartControls();
  const supabase = createClient();

  async function addToCart({ item, onSuccess, onError }: AddToCartOptions) {
    setLoading(true);

    // Optimistic update — add locally immediately
    addItem(item);
    openCart();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Guest user — local cart only
      if (!user) {
        onSuccess?.();
        return;
      }

      // Authenticated — persist to server
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_id: item.variant_id,
          quantity: item.quantity,
        }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        // Rollback optimistic update on server failure
        useCartStore.getState().actions.removeItem(item.variant_id);
        onError?.(json.error ?? "Failed to add item.");
        return;
      }

      onSuccess?.();
    } catch {
      onError?.("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { addToCart, loading };
}