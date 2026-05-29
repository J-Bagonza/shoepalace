import { describe, it, expect } from "vitest";
import {
  adminProductFormSchema,
  slugify,
} from "@/lib/validations/admin-product";

const VALID = {
  name: "Apex Runner Pro",
  slug: "apex-runner-pro",
  description: "A great shoe for running.",
  price: 199.99,
  category: "running",
  is_featured: false,
};

describe("adminProductFormSchema", () => {
  it("accepts valid product", () => {
    expect(adminProductFormSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, name: "" }).success,
    ).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, slug: "Apex-Runner" }).success,
    ).toBe(false);
  });

  it("rejects slug with spaces", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, slug: "apex runner" }).success,
    ).toBe(false);
  });

  it("rejects price of zero", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, price: 0 }).success,
    ).toBe(false);
  });

  it("rejects negative price", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, price: -10 }).success,
    ).toBe(false);
  });

  it("rejects price above 99999.99", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, price: 100000 }).success,
    ).toBe(false);
  });

  it("rejects invalid category format", () => {
    expect(
      adminProductFormSchema.safeParse({
        ...VALID,
        category: "Running Shoes!",
      }).success,
    ).toBe(false);
  });

  it("accepts null model_url", () => {
    expect(
      adminProductFormSchema.safeParse({ ...VALID, model_url: null }).success,
    ).toBe(true);
  });

  it("rejects invalid model_url", () => {
    expect(
      adminProductFormSchema.safeParse({
        ...VALID,
        model_url: "not-a-url",
      }).success,
    ).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("Apex Runner")).toBe("apex-runner");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("apex runner pro")).toBe("apex-runner-pro");
  });

  it("removes special characters", () => {
    expect(slugify("apex! runner@pro#")).toBe("apex-runner-pro");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("apex---runner")).toBe("apex-runner");
  });

  it("trims whitespace", () => {
    expect(slugify("  apex runner  ")).toBe("apex-runner");
  });

  it("limits to 100 characters", () => {
    const long = "a".repeat(120);
    expect(slugify(long).length).toBeLessThanOrEqual(100);
  });
});