import {
  useCartItems,
  useCartTotal,
  useCartItemCount,
  useCartActions,
} from "@/store/cart";
import { formatPrice } from "@/utils/product";
import { useCurrency } from "@/context/currency-context";

export function useCart() {
  const items = useCartItems();
  const subtotal = useCartTotal();
  const item_count = useCartItemCount();
  const actions = useCartActions();
  const currency = useCurrency();

  return {
    items,
    subtotal,
    item_count,
    currency,
    formattedTotal: formatPrice(subtotal, currency),
    isEmpty: items.length === 0,
    ...actions,
  };
}