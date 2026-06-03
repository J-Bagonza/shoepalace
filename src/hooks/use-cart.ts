import {
  useCartItems,
  useCartTotal,
  useCartItemCount,
  useCartActions,
} from "@/store/cart";
import { formatPrice } from "@/utils/product";

export function useCart() {
  const items = useCartItems();
  const subtotal = useCartTotal();
  const item_count = useCartItemCount();
  const actions = useCartActions();

  return {
    items,
    subtotal,
    item_count,
    formattedTotal: formatPrice(subtotal),
    isEmpty: items.length === 0,
    ...actions,
  };
}