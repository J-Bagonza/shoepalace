import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@supabase/ssr";

function buildMockSupabase(user: unknown = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      setAll: vi.fn(),
    },
  };
}

describe("Middleware — route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("redirects unauthenticated user from /admin to /login", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase(null) as unknown as ReturnType<typeof createServerClient>,
    );

    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest("http://localhost/admin/products");

    const res = await middleware(nextReq);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects authenticated user from /login to /", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({
        id: "user-1",
        email: "user@test.com",
      }) as unknown as ReturnType<typeof createServerClient>,
    );

    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest("http://localhost/login");

    const res = await middleware(nextReq);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
  });

  it("allows authenticated user to access /admin", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase({
        id: "user-1",
        email: "admin@test.com",
      }) as unknown as ReturnType<typeof createServerClient>,
    );

    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest("http://localhost/admin");

    const res = await middleware(nextReq);
    expect(res.status).toBe(200);
  });

  it("attaches x-request-id header to every response", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase(null) as unknown as ReturnType<typeof createServerClient>,
    );

    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest("http://localhost/products");

    const res = await middleware(nextReq);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("allows public routes without auth", async () => {
    vi.mocked(createServerClient).mockReturnValue(
      buildMockSupabase(null) as unknown as ReturnType<typeof createServerClient>,
    );

    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");
    const nextReq = new NextRequest("http://localhost/products");

    const res = await middleware(nextReq);
    expect(res.status).toBe(200);
  });
});