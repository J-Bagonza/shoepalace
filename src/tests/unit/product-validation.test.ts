import { describe, it, expect } from "vitest";
import {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  productIdParamsSchema,
} from "@/lib/validations/product";

describe("productListQuerySchema", () => {
  it("applies defaults when no params provided", () => {
    const result = productListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.page_size).toBe(24);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("accepts valid category filter", () => {
    const result = productListQuerySchema.safeParse({ category: "running" });
    expect(result.success).toBe(true);
  });

  it("rejects category with special characters", () => {
    const result = productListQuerySchema.safeParse({ category: "run; DROP TABLE" });
    expect(result.success).toBe(false);
  });

  it("rejects page exceeding maximum", () => {
    const result = productListQuerySchema.safeParse({ page: 9999 });
    expect(result.success).toBe(false);
  });

  it("rejects page_size exceeding 100", () => {
    const result = productListQuerySchema.safeParse({ page_size: 500 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid sort value", () => {
    const result = productListQuerySchema.safeParse({ sort: "malicious" });
    expect(result.success).toBe(false);
  });

  it("rejects search exceeding 100 characters", () => {
    const result = productListQuerySchema.safeParse({ search: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("coerces page from string to number", () => {
    const result = productListQuerySchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.page).toBe(3);
  });
});

describe("createProductSchema", () => {
  const valid = {
    name: "Apex Runner",
    slug: "apex-runner",
    description: "A great shoe for running.",
    price: 199.99,
    category: "running",
    is_featured: false,
  };

  it("accepts valid product", () => {
    expect(createProductSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid slug format", () => {
    const result = createProductSchema.safeParse({ ...valid, slug: "Apex Runner!" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createProductSchema.safeParse({ ...valid, price: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects price with more than 2 decimal places", () => {
    const result = createProductSchema.safeParse({ ...valid, price: 19.999 });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = createProductSchema.safeParse({ ...valid, name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 5000 characters", () => {
    const result = createProductSchema.safeParse({ ...valid, description: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid model_url", () => {
    const result = createProductSchema.safeParse({ ...valid, model_url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts null model_url", () => {
    const result = createProductSchema.safeParse({ ...valid, model_url: null });
    expect(result.success).toBe(true);
  });

  it("strips unknown fields", () => {
    const result = createProductSchema.safeParse({ ...valid, deleted_at: "2024-01-01" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)["deleted_at"]).toBeUndefined();
    }
  });
});

describe("updateProductSchema", () => {
  it("accepts partial update", () => {
    const result = updateProductSchema.safeParse({ price: 299.99 });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug in partial update", () => {
    const result = updateProductSchema.safeParse({ slug: "Invalid Slug!" });
    expect(result.success).toBe(false);
  });
});

describe("productParamsSchema", () => {
  it("accepts valid slug", () => {
    expect(productParamsSchema.safeParse({ slug: "apex-runner-pro" }).success).toBe(true);
  });

  it("rejects slug with uppercase", () => {
    expect(productParamsSchema.safeParse({ slug: "Apex-Runner" }).success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    expect(productParamsSchema.safeParse({ slug: "apex runner" }).success).toBe(false);
  });

  it("rejects empty slug", () => {
    expect(productParamsSchema.safeParse({ slug: "" }).success).toBe(false);
  });
});

describe("productIdParamsSchema", () => {
  it("accepts valid UUID", () => {
    // RFC 4122 compliant: version nibble = 4, variant bits = a (10xx)
    const result = productIdParamsSchema.safeParse({
      id: "11111111-1111-4111-a111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(productIdParamsSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects SQL injection in id", () => {
    expect(
      productIdParamsSchema.safeParse({ id: "' OR 1=1 --" }).success,
    ).toBe(false);
  });
});