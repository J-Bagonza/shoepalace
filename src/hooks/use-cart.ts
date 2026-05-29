import {
  useCartItems,
  useCartTotal,
  useCartItemCount,
  useCartActions,
} from "@/store/cart";
import { formatPrice } from "@/utils/product";

export function useCart() {
  const items = useCartItems();
  const total = useCartTotal();
  const item_count = useCartItemCount();
  const actions = useCartActions();

  return {
    items,
    total,
    item_count,
    formattedTotal: formatPrice(total),
    isEmpty: items.length === 0,
    ...actions,
  };
}