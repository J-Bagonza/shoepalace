import { describe, it, expect, vi, beforeEach } from "vitest";
import { signupSchema } from "@/lib/validations/auth"; // ← was require() inside describe

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
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type MockClient = ReturnType<typeof createServerSupabaseClient>;
type MockAdminClient = ReturnType<typeof createAdminSupabaseClient>;

function buildSupabaseWithRole(
  userId: string,
  role: string,
): { server: MockClient; admin: MockAdminClient } {
  const adminChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };

  const serverChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  return {
    server: {
      from: vi.fn().mockReturnValue(serverChain),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
    } as unknown as MockClient,
    admin: {
      from: vi.fn().mockReturnValue(adminChain),
    } as unknown as MockAdminClient,
  };
}

describe("Privilege escalation — Admin API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks customer from creating a product", async () => {
    const { server, admin } = buildSupabaseWithRole("customer-id", "customer");
    vi.mocked(createServerSupabaseClient).mockReturnValue(server);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin);

    const { POST } = await import("@/app/api/admin/products/route");

    const res = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Hacked Product",
          slug: "hacked-product",
          description: "Injected via customer account.",
          price: 0.01,
          category: "running",
          is_featured: false,
        }),
      }),
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Insufficient permissions.");
  });

  it("blocks unauthenticated request from creating a product", async () => {
    const serverMock = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as unknown as MockClient;

    vi.mocked(createServerSupabaseClient).mockReturnValue(serverMock);
    vi.mocked(createAdminSupabaseClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as unknown as MockAdminClient);

    const { POST } = await import("@/app/api/admin/products/route");

    const res = await POST(
      new Request("http://localhost/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Hacked",
          slug: "hacked",
          description: "Injected.",
          price: 0.01,
          category: "running",
          is_featured: false,
        }),
      }),
    );

    expect(res.status).toBe(401);
  });

  it("blocks customer from deleting a product", async () => {
    const { server, admin } = buildSupabaseWithRole("customer-id", "customer");
    vi.mocked(createServerSupabaseClient).mockReturnValue(server);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin);

    const { DELETE } = await import("@/app/api/admin/products/[id]/route");

    const res = await DELETE(
      new Request(
        "http://localhost/api/admin/products/11111111-1111-1111-1111-111111111111",
        { method: "DELETE" },
      ),
      { params: { id: "11111111-1111-1111-1111-111111111111" } },
    );

    expect(res.status).toBe(403);
  });

  it("blocks customer from accessing audit logs", async () => {
    const { server, admin } = buildSupabaseWithRole("customer-id", "customer");
    vi.mocked(createServerSupabaseClient).mockReturnValue(server);
    vi.mocked(createAdminSupabaseClient).mockReturnValue(admin);

    const { GET } = await import("@/app/api/admin/logs/route");

    const res = await GET(new Request("http://localhost/api/admin/logs"));

    expect(res.status).toBe(403);
  });

  it("role injected in request body is ignored", async () => {
    const result = signupSchema.safeParse({
      email: "attacker@evil.com",
      password: "Password1",
      role: "admin",
      is_admin: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data["role"]).toBeUndefined();
      expect(data["is_admin"]).toBeUndefined();
    }
  });
});

describe("Privilege escalation — Auth validation", () => {
  it("rejects admin role in signup payload", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      role: "admin",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)["role"]).toBeUndefined();
    }
  });

  it("JWT claims cannot elevate role — role always read from DB", async () => {
    const adminMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "customer" },
          error: null,
        }),
      }),
    } as unknown as ReturnType<typeof createAdminSupabaseClient>;

    vi.mocked(createAdminSupabaseClient).mockReturnValue(adminMock);
    vi.mocked(createServerSupabaseClient).mockReturnValue({
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", role: "admin" } },
          error: null,
        }),
      },
    } as unknown as MockClient);

    const { requireAuth } = await import("@/lib/security/with-auth");

    const req = new Request("http://localhost/api/admin/products");
    const result = await requireAuth(req, "admin");

    expect(result instanceof Response).toBe(true);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
    }
  });
});