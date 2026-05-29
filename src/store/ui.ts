import { create } from "zustand";

interface UIState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
}));

export const useCartOpen = () => useUIStore((s) => s.cartOpen);

// Actions read imperatively — no subscription, no re-render cycle
export const useCartControls = () => ({
  openCart: useUIStore.getState().openCart,
  closeCart: useUIStore.getState().closeCart,
  toggleCart: useUIStore.getState().toggleCart,
});