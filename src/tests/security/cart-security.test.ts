import { describe, it, expect } from "vitest";
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from "@/lib/validations/cart";

// RFC 4122 compliant UUID (v4, variant 1)
const VALID_UUID = "11111111-1111-4111-a111-111111111111";

describe("Cart security — input validation", () => {
  it("rejects non-UUID variant_id", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: "not-a-uuid",
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects SQL injection in variant_id", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: "' OR 1=1 --",
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity of 0", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity above 99", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects float quantity", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("strips unknown fields from add payload", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: 1,
      user_id: "attacker-injected-id",
      price: 0.01,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data["user_id"]).toBeUndefined();
      expect(data["price"]).toBeUndefined();
    }
  });

  it("rejects non-UUID cart item id param", () => {
    const result = cartItemParamsSchema.safeParse({ id: "../../etc/passwd" });
    expect(result.success).toBe(false);
  });

  it("rejects update quantity of 0", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects update quantity above 99", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 100 });
    expect(result.success).toBe(false);
  });
});

describe("Cart security — IDOR prevention logic", () => {
  it("user_id is never accepted from client payload", () => {
    const result = addCartItemSchema.safeParse({
      variant_id: VALID_UUID,
      quantity: 1,
      user_id: "00000000-0000-4000-a000-000000000099",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>)["user_id"],
      ).toBeUndefined();
    }
  });

  it("cart item id accepts only valid UUID format", () => {
    const validResult = cartItemParamsSchema.safeParse({
      id: VALID_UUID,
    });
    expect(validResult.success).toBe(true);

    const invalidResult = cartItemParamsSchema.safeParse({
      id: "1 UNION SELECT * FROM cart_items",
    });
    expect(invalidResult.success).toBe(false);
  });
});