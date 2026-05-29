import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/security/with-rate-limit", () => ({
  withRateLimit: (
    _key: string,
    handler: (req: Request) => Promise<Response>,
  ) => (req: Request) => handler(req),
}));

vi.mock("@/lib/logger/request-logger", () => ({
  createRequestLogger: () => ({
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    requestId: "test-request-id",
  }),
}));

vi.mock("@/lib/logger/audit-logger", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue(null),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { POST as signupHandler } from "@/app/api/auth/signup/route";
import { POST as signinHandler } from "@/app/api/auth/signin/route";
import { POST as signoutHandler } from "@/app/api/auth/signout/route";

type MockSupabase = ReturnType<typeof createServerSupabaseClient>;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeMockSupabase(overrides: Record<string, unknown> = {}): MockSupabase {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      ...overrides,
    },
  } as unknown as MockSupabase;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 on valid signup", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(makeMockSupabase());

    const res = await signupHandler(makeRequest({
      email: "user@example.com",
      password: "Password1",
    }));

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.error).toBeNull();
  });

  it("returns 422 on invalid body", async () => {
    const res = await signupHandler(
      makeRequest({ email: "bad-email", password: "weak" }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 400 on Supabase error", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(
      makeMockSupabase({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Email already registered" },
        }),
      }),
    );

    const res = await signupHandler(
      makeRequest({ email: "user@example.com", password: "Password1" }),
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).not.toMatch(/email/i);
    expect(json.error).not.toMatch(/already/i);
  });

  it("returns 400 on malformed JSON", async () => {
    const req = new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await signupHandler(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/signin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 on valid credentials", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(makeMockSupabase());

    const res = await signinHandler(
      makeRequest({ email: "user@example.com", password: "Password1" }),
    );

    expect(res.status).toBe(200);
  });

  it("returns 401 on invalid credentials", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(
      makeMockSupabase({
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid login credentials" },
        }),
      }),
    );

    const res = await signinHandler(
      makeRequest({ email: "user@example.com", password: "WrongPass1" }),
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid credentials.");
  });

  it("returns 422 on missing password", async () => {
    const res = await signinHandler(
      makeRequest({ email: "user@example.com" }),
    );
    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/signout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 and signs out", async () => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(makeMockSupabase());

    const res = await signoutHandler(makeRequest({}));

    expect(res.status).toBe(200);
  });
});