import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/security/with-rate-limit", () => ({
  withRateLimit: (
    _key: string,
    handler: (req: Request) => Promise<Response>,
  ) => (req: Request) => handler(req),
}));

vi.mock("@/lib/redis/cache", () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(undefined),
  deleteCache: vi.fn().mockResolvedValue(undefined),
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

vi.mock("@/lib/security/with-auth", () => ({
  requireAuth: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GET as getProducts } from "@/app/api/products/route";

type MockClient = ReturnType<typeof createServerSupabaseClient>;

const MOCK_PRODUCT = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Apex Runner",
  slug: "apex-runner",
  description: "Great shoe.",
  price: 199.99,
  category: "running",
  is_featured: true,
  model_url: null,
  deleted_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  product_images: [],
  product_variants: [],
};

/**
 * The route builds its query in this order:
 *   supabase.from().select().is().range()   <- filters
 *   applySortOrder(query, sort)             <- adds .order()
 *   await query                             <- terminal await
 *
 * So .order() is the LAST method called before the query is awaited.
 * Every chainable method must return the chain; .order() must resolve
 * with the final DB result so the destructured { data, error, count }
 * come back correctly.
 */
function buildChain(resolved: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainMethods = [
    "select", "eq", "is", "ilike", "range",
    "single", "insert", "update", "delete", "returns",
  ];

  chainMethods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain);
  });

  // order() is the terminal call — must resolve with the DB result
  chain["order"] = vi.fn().mockResolvedValue(resolved);

  return chain;
}

function buildSupabaseMock(resolved: unknown): MockClient {
  return {
    from: vi.fn().mockReturnValue(buildChain(resolved)),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  } as unknown as MockClient;
}

describe("GET /api/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with product list", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(
      buildSupabaseMock({ data: [MOCK_PRODUCT], error: null, count: 1 }),
    );

    const res = await getProducts(
      new Request("http://localhost/api/products"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.total).toBe(1);
  });

  it("returns 200 with empty list", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(
      buildSupabaseMock({ data: [], error: null, count: 0 }),
    );

    const res = await getProducts(
      new Request("http://localhost/api/products"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.data).toHaveLength(0);
  });

  it("returns 422 on invalid query params", async () => {
    const res = await getProducts(
      new Request("http://localhost/api/products?page=-1"),
    );
    expect(res.status).toBe(422);
  });

  it("returns 500 on DB error", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(
      buildSupabaseMock({
        data: null,
        error: { message: "connection refused" },
        count: null,
      }),
    );

    const res = await getProducts(
      new Request("http://localhost/api/products"),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).not.toContain("connection refused");
  });

  it("returns cache hit without calling DB", async () => {
    const { getCache } = await import("@/lib/redis/cache");
    vi.mocked(getCache).mockResolvedValueOnce({
      data: [MOCK_PRODUCT],
      total: 1,
      page: 1,
      page_size: 24,
      total_pages: 1,
    });

    const dbSpy = vi.mocked(createServerSupabaseClient);

    const res = await getProducts(
      new Request("http://localhost/api/products"),
    );
    expect(res.status).toBe(200);
    expect(dbSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/products — query validation", () => {
  it("rejects SQL injection in category", async () => {
    const res = await getProducts(
      new Request(
        "http://localhost/api/products?category=running%27%3B+DROP+TABLE+products%3B--",
      ),
    );
    expect(res.status).toBe(422);
  });

  it("rejects oversized page_size", async () => {
    const res = await getProducts(
      new Request("http://localhost/api/products?page_size=9999"),
    );
    expect(res.status).toBe(422);
  });

  it("rejects invalid sort value", async () => {
    const res = await getProducts(
      new Request("http://localhost/api/products?sort=malicious"),
    );
    expect(res.status).toBe(422);
  });
});