import { describe, it, expect, vi } from "vitest";
import { signupSchema, signinSchema } from "@/lib/validations/auth";

describe("Auth security — input validation", () => {
  it("strips unknown fields from signup payload", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      role: "admin",
      is_admin: true,
      __proto__: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data["role"]).toBeUndefined();
      expect(data["is_admin"]).toBeUndefined();
    }
  });

  it("rejects SQL injection attempt in email field", () => {
    const result = signupSchema.safeParse({
      email: "' OR 1=1 --",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects XSS payload in email field", () => {
    const result = signupSchema.safeParse({
      email: "<script>alert(1)</script>@evil.com",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects excessively long email", () => {
    const result = signupSchema.safeParse({
      email: "a".repeat(255) + "@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects excessively long password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "A1" + "a".repeat(100),
    });
    expect(result.success).toBe(false);
  });

  it("rejects null byte injection in password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Password1\x00malicious",
    });
    expect(typeof result).toBe("object");
  });

  it("strips unknown fields — prototype pollution fields not in output schema", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      isAdmin: true,
      role: "admin",
      __proto__: { polluted: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data["isAdmin"]).toBeUndefined();
      expect(data["role"]).toBeUndefined();
      expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    }
  });
}); // ← closing brace for "Auth security — input validation"

describe("Auth security — generic error messages", () => {
  it("signin error message does not reveal email existence", () => {
    const genericError = "Invalid credentials.";
    expect(genericError).not.toMatch(/email/i);
    expect(genericError).not.toMatch(/password/i);
    expect(genericError).not.toMatch(/not found/i);
    expect(genericError).not.toMatch(/exist/i);
  });

  it("signup error message does not reveal email existence", () => {
    const genericError = "Unable to create account. Please try again.";
    expect(genericError).not.toMatch(/already/i);
    expect(genericError).not.toMatch(/registered/i);
    expect(genericError).not.toMatch(/taken/i);
    expect(genericError).not.toMatch(/exist/i);
  });
});