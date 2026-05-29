"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartActions, useCartItems } from "@/store/cart";
import type { CartItem } from "@/types/cart";

/**
 * Syncs local cart with server cart on sign-in.
 * On sign-out: clears local cart.
 * On sign-in: merges local items into server cart, then loads server state.
 */
export function useCartSync() {
  const supabase = createClient();
  const actions = useCartActions();
  const localItems = useCartItems();
  const hasSynced = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        actions.clearCart();
        hasSynced.current = false;
        return;
      }

      if (event === "SIGNED_IN" && !hasSynced.current) {
        hasSynced.current = true;
        await syncCartToServer(localItems);
        await loadServerCart();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncCartToServer(items: CartItem[]) {
    if (items.length === 0) return;

    await Promise.allSettled(
      items.map((item) =>
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        }),
      ),
    );
  }

  async function loadServerCart() {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) return;

      const json = await res.json() as {
        data: { items: CartItem[]; total: number; item_count: number } | null;
        error: string | null;
      };

      if (!json.data) return;

      actions.clearCart();
      json.data.items.forEach((item) => actions.addItem(item));
    } catch {
      // Silent fail — local cart remains intact
    }
  }
}