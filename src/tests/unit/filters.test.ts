import { describe, it, expect } from "vitest";
import {
  parseFiltersFromParams,
  buildSearchParams,
} from "@/lib/products/filters";

describe("parseFiltersFromParams", () => {
  it("returns defaults for empty params", () => {
    const result = parseFiltersFromParams({});
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(24);
    expect(result.sort).toBe("newest");
    expect(result.category).toBeUndefined();
  });

  it("parses valid category", () => {
    const result = parseFiltersFromParams({ category: "running" });
    expect(result.category).toBe("running");
  });

  it("parses valid sort", () => {
    const result = parseFiltersFromParams({ sort: "price_asc" });
    expect(result.sort).toBe("price_asc");
  });

  it("falls back to newest for invalid sort", () => {
    const result = parseFiltersFromParams({ sort: "invalid_sort" });
    expect(result.sort).toBe("newest");
  });

  it("parses page number", () => {
    const result = parseFiltersFromParams({ page: "3" });
    expect(result.page).toBe(3);
  });

  it("defaults page to 1 for invalid value", () => {
    const result = parseFiltersFromParams({ page: "abc" });
    expect(result.page).toBe(1);
  });

  it("defaults page to 1 for negative value", () => {
    const result = parseFiltersFromParams({ page: "-5" });
    expect(result.page).toBe(1);
  });
});

describe("buildSearchParams", () => {
  it("omits default sort from params", () => {
    const result = buildSearchParams({ sort: "newest", page: 1 });
    expect(result).not.toContain("sort");
    expect(result).not.toContain("page");
  });

  it("includes non-default sort", () => {
    const result = buildSearchParams({ sort: "price_asc" });
    expect(result).toContain("sort=price_asc");
  });

  it("includes category when set", () => {
    const result = buildSearchParams({ category: "running" });
    expect(result).toContain("category=running");
  });

  it("omits page 1", () => {
    const result = buildSearchParams({ page: 1 });
    expect(result).not.toContain("page");
  });

  it("includes page above 1", () => {
    const result = buildSearchParams({ page: 3 });
    expect(result).toContain("page=3");
  });

  it("includes search term", () => {
    const result = buildSearchParams({ search: "runner" });
    expect(result).toContain("search=runner");
  });
});