import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Cart } from "@/types/cart";

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
  hasItem: (variantId: string) => boolean;
}

interface CartState extends Cart {
  actions: CartActions;
}

const MAX_QUANTITY = 99;
const MAX_CART_ITEMS = 50;

function computeTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function computeItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      item_count: 0,

      actions: {
        addItem: (item: CartItem) => {
          set((state) => {
            const existing = state.items.find(
              (i) => i.variant_id === item.variant_id,
            );

            let updatedItems: CartItem[];

            if (existing) {
              updatedItems = state.items.map((i) =>
                i.variant_id === item.variant_id
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.quantity + item.quantity,
                        MAX_QUANTITY,
                      ),
                    }
                  : i,
              );
            } else {
              if (state.items.length >= MAX_CART_ITEMS) return state;
              updatedItems = [
                ...state.items,
                { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY) },
              ];
            }

            return {
              items: updatedItems,
              total: computeTotal(updatedItems),
              item_count: computeItemCount(updatedItems),
            };
          });
        },

        removeItem: (variantId: string) => {
          set((state) => {
            const updatedItems = state.items.filter(
              (i) => i.variant_id !== variantId,
            );
            return {
              items: updatedItems,
              total: computeTotal(updatedItems),
              item_count: computeItemCount(updatedItems),
            };
          });
        },

        updateQuantity: (variantId: string, quantity: number) => {
          if (quantity < 1 || quantity > MAX_QUANTITY) return;

          set((state) => {
            const updatedItems = state.items.map((i) =>
              i.variant_id === variantId ? { ...i, quantity } : i,
            );
            return {
              items: updatedItems,
              total: computeTotal(updatedItems),
              item_count: computeItemCount(updatedItems),
            };
          });
        },

        clearCart: () => {
          set({ items: [], total: 0, item_count: 0 });
        },

        getItemCount: () => computeItemCount(get().items),

        getTotal: () => computeTotal(get().items),

        hasItem: (variantId: string) =>
          get().items.some((i) => i.variant_id === variantId),
      },
    }),
    {
      name: "shoepalace-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist items — recompute derived state on rehydration
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.total = computeTotal(state.items);
        state.item_count = computeItemCount(state.items);
      },
    },
  ),
);

// Stable selectors — prevents unnecessary re-renders
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartTotal = () => useCartStore((s) => s.total);
export const useCartItemCount = () => useCartStore((s) => s.item_count);
export const useCartActions = () => useCartStore((s) => s.actions);