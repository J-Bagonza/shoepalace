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
export const useCartControls = () =>
  useUIStore((s) => ({
    openCart: s.openCart,
    closeCart: s.closeCart,
    toggleCart: s.toggleCart,
  }));