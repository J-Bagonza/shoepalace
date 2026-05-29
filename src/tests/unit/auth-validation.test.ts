import { describe, it, expect } from "vitest";
import { signupSchema, signinSchema } from "@/lib/validations/auth";

describe("signupSchema", () => {
  it("accepts valid credentials", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password under 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password with no uppercase letter", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password with no number", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "PasswordOnly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 72 characters", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "A1" + "a".repeat(71),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = signupSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects extra unexpected fields via strip (no error but strips)", () => {
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
});

describe("signinSchema", () => {
  it("accepts valid credentials", () => {
    const result = signinSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = signinSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = signinSchema.safeParse({
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });
});