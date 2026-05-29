import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/cart";
import type { CartItem } from "@/types/cart";

const MOCK_ITEM: CartItem = {
  id: "cart-item-1",
  variant_id: "variant-1",
  product_id: "product-1",
  product_name: "Apex Runner",
  product_slug: "apex-runner",
  image_url: "/images/apex.jpg",
  size: "UK 9",
  color: "Black",
  price: 199.99,
  quantity: 1,
};

function getActions() {
  return useCartStore.getState().actions;
}

function getState() {
  return useCartStore.getState();
}

describe("cart store — addItem", () => {
  beforeEach(() => getActions().clearCart());

  it("adds a new item to cart", () => {
    getActions().addItem(MOCK_ITEM);
    expect(getState().items).toHaveLength(1);
    expect(getState().items[0]?.variant_id).toBe("variant-1");
  });

  it("increments quantity for existing item", () => {
    getActions().addItem(MOCK_ITEM);
    getActions().addItem({ ...MOCK_ITEM, quantity: 2 });
    expect(getState().items).toHaveLength(1);
    expect(getState().items[0]?.quantity).toBe(3);
  });

  it("caps quantity at 99", () => {
    getActions().addItem({ ...MOCK_ITEM, quantity: 98 });
    getActions().addItem({ ...MOCK_ITEM, quantity: 5 });
    expect(getState().items[0]?.quantity).toBe(99);
  });

  it("does not exceed MAX_CART_ITEMS (50)", () => {
    for (let i = 0; i < 55; i++) {
      getActions().addItem({ ...MOCK_ITEM, variant_id: `variant-${i}` });
    }
    expect(getState().items.length).toBeLessThanOrEqual(50);
  });

  it("updates total correctly after add", () => {
    getActions().addItem({ ...MOCK_ITEM, quantity: 2 });
    expect(getState().total).toBeCloseTo(399.98);
  });

  it("updates item_count correctly after add", () => {
    getActions().addItem({ ...MOCK_ITEM, quantity: 3 });
    expect(getState().item_count).toBe(3);
  });
});

describe("cart store — removeItem", () => {
  beforeEach(() => {
    getActions().clearCart();
    getActions().addItem(MOCK_ITEM);
  });

  it("removes item by variant_id", () => {
    getActions().removeItem("variant-1");
    expect(getState().items).toHaveLength(0);
  });

  it("recalculates total after removal", () => {
    getActions().removeItem("variant-1");
    expect(getState().total).toBe(0);
  });

  it("does nothing for unknown variant_id", () => {
    getActions().removeItem("non-existent");
    expect(getState().items).toHaveLength(1);
  });
});

describe("cart store — updateQuantity", () => {
  beforeEach(() => {
    getActions().clearCart();
    getActions().addItem(MOCK_ITEM);
  });

  it("updates quantity for existing item", () => {
    getActions().updateQuantity("variant-1", 5);
    expect(getState().items[0]?.quantity).toBe(5);
  });

  it("rejects quantity of 0", () => {
    getActions().updateQuantity("variant-1", 0);
    expect(getState().items[0]?.quantity).toBe(1);
  });

  it("rejects quantity above 99", () => {
    getActions().updateQuantity("variant-1", 100);
    expect(getState().items[0]?.quantity).toBe(1);
  });

  it("recalculates total after update", () => {
    getActions().updateQuantity("variant-1", 3);
    expect(getState().total).toBeCloseTo(599.97);
  });
});

describe("cart store — clearCart", () => {
  beforeEach(() => {
    getActions().clearCart();
    getActions().addItem(MOCK_ITEM);
    getActions().addItem({ ...MOCK_ITEM, variant_id: "variant-2" });
  });

  it("removes all items", () => {
    getActions().clearCart();
    expect(getState().items).toHaveLength(0);
  });

  it("resets total to 0", () => {
    getActions().clearCart();
    expect(getState().total).toBe(0);
  });

  it("resets item_count to 0", () => {
    getActions().clearCart();
    expect(getState().item_count).toBe(0);
  });
});

describe("cart store — selectors", () => {
  beforeEach(() => {
    getActions().clearCart();
    getActions().addItem(MOCK_ITEM);
  });

  it("hasItem returns true for existing variant", () => {
    expect(getActions().hasItem("variant-1")).toBe(true);
  });

  it("hasItem returns false for missing variant", () => {
    expect(getActions().hasItem("variant-99")).toBe(false);
  });

  it("getItemCount returns total quantity", () => {
    getActions().addItem({ ...MOCK_ITEM, variant_id: "variant-2", quantity: 2 });
    expect(getActions().getItemCount()).toBe(3);
  });

  it("getTotal returns sum of price x quantity", () => {
    getActions().addItem({ ...MOCK_ITEM, variant_id: "variant-2", quantity: 1 });
    expect(getActions().getTotal()).toBeCloseTo(399.98);
  });
});