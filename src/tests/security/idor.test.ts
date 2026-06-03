import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/lib/security/with-auth";

vi.mock("@/lib/security/with-auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/security/with-rate-limit", () => ({
  withRateLimit: (
    _key: string,
    handler: (req: Request, context?: Record<string, unknown>) => Promise<Response>,
  ) => (req: Request, context?: Record<string, unknown>) => handler(req, context),
}));

vi.mock("@/lib/logger/request-logger", () => ({
  createRequestLogger: () => ({
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    requestId: "test-id",
  }),
}));

vi.mock("@/lib/logger/audit-logger", () => ({
  logAuditEvent: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";


const VICTIM_USER_ID  = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const ATTACKER_USER_ID = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
// RFC 4122 compliant: version nibble = 4, variant bits = a (10xx)
const CART_ITEM_ID = "11111111-1111-4111-a111-111111111111";

describe("IDOR — Cart API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
  userId: ATTACKER_USER_ID,
  role: "customer",
  tenantId: "test-tenant-id",
});
  });

  it("returns 404 when attacker tries to update victim cart item", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    };
    vi.mocked(createServerSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as unknown as ReturnType<typeof createServerSupabaseClient>);

    const { PATCH } = await import("@/app/api/cart/[id]/route");

    const res = await PATCH(
      new Request(`http://localhost/api/cart/${CART_ITEM_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 5 }),
      }),
      { params: { id: CART_ITEM_ID } },
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Cart item not found.");
  });

  it("returns 404 when attacker tries to delete victim cart item", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnThis(),
    };
    vi.mocked(createServerSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as unknown as ReturnType<typeof createServerSupabaseClient>);

    const { DELETE } = await import("@/app/api/cart/[id]/route");

    const res = await DELETE(
      new Request(`http://localhost/api/cart/${CART_ITEM_ID}`, {
        method: "DELETE",
      }),
      { params: { id: CART_ITEM_ID } },
    );

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Cart item not found.");
  });

  it("user_id is never accepted from request body", async () => {
    const { addCartItemSchema } = await import("@/lib/validations/cart");

    const result = addCartItemSchema.safeParse({
      variant_id: CART_ITEM_ID,
      quantity: 1,
      user_id: VICTIM_USER_ID,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>)["user_id"],
      ).toBeUndefined();
    }
  });

  it("rejects non-UUID product id param", async () => {
    const { productIdParamsSchema } = await import("@/lib/validations/product");
    expect(
      productIdParamsSchema.safeParse({ id: "../../etc/passwd" }).success,
    ).toBe(false);
  });

  it("rejects traversal attempt in slug", async () => {
    const { productParamsSchema } = await import("@/lib/validations/product");
    expect(
      productParamsSchema.safeParse({ slug: "../admin/products" }).success,
    ).toBe(false);
  });
});