import { describe, it, expect } from "vitest";
import {
  getPrimaryImage,
  formatPrice,
  getAvailableSizes,
  getAvailableColors,
  isInStock,
  getVariantStock,
} from "@/utils/product";
import type { Product } from "@/types/product";

const MOCK_PRODUCT: Product = {
  id: "prod-1",
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
  images: [
    { id: "img-1", url: "/img1.jpg", alt: "Side", position: 0 },
    { id: "img-2", url: "/img2.jpg", alt: "Top", position: 1 },
  ],
  variants: [
    { id: "v1", size: "UK 8", color: "Black", stock: 5 },
    { id: "v2", size: "UK 9", color: "Black", stock: 0 },
    { id: "v3", size: "UK 8", color: "White", stock: 3 },
    { id: "v4", size: "UK 7", color: "Black", stock: 2 },
  ],
};

describe("getPrimaryImage", () => {
  it("returns image at position 0", () => {
    const result = getPrimaryImage(MOCK_PRODUCT);
    expect(result?.url).toBe("/img1.jpg");
  });

  it("returns null for product with no images", () => {
    expect(getPrimaryImage({ ...MOCK_PRODUCT, images: [] })).toBeNull();
  });

  it("returns first image when none at position 0", () => {
    const product = {
      ...MOCK_PRODUCT,
      images: [
        { id: "i1", url: "/img3.jpg", alt: "", position: 2 },
        { id: "i2", url: "/img4.jpg", alt: "", position: 5 },
      ],
    };
    expect(getPrimaryImage(product)?.url).toBe("/img3.jpg");
  });
});

describe("formatPrice", () => {
  it("formats GBP correctly", () => {
    expect(formatPrice(199.99)).toContain("199.99");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toContain("0");
  });

  it("formats large prices", () => {
    expect(formatPrice(1000)).toContain("1,000");
  });
});

describe("getAvailableSizes", () => {
  it("returns unique sorted sizes", () => {
    const sizes = getAvailableSizes(MOCK_PRODUCT);
    expect(sizes).toEqual(["UK 7", "UK 8", "UK 9"]);
  });

  it("returns empty array for no variants", () => {
    expect(getAvailableSizes({ ...MOCK_PRODUCT, variants: [] })).toEqual([]);
  });
});

describe("getAvailableColors", () => {
  it("returns unique colors", () => {
    const colors = getAvailableColors(MOCK_PRODUCT);
    expect(colors).toContain("Black");
    expect(colors).toContain("White");
    expect(colors).toHaveLength(2);
  });
});

describe("isInStock", () => {
  it("returns true when any variant has stock", () => {
    expect(isInStock(MOCK_PRODUCT)).toBe(true);
  });

  it("returns false when all variants have zero stock", () => {
    const product = {
      ...MOCK_PRODUCT,
      variants: (MOCK_PRODUCT.variants ?? []).map((v) => ({ ...v, stock: 0 })),
    };
    expect(isInStock(product)).toBe(false);
  });

  it("returns false for empty variants", () => {
    expect(isInStock({ ...MOCK_PRODUCT, variants: [] })).toBe(false);
  });
});

describe("getVariantStock", () => {
  it("returns correct stock for size/color combo", () => {
    expect(getVariantStock(MOCK_PRODUCT, "UK 8", "Black")).toBe(5);
  });

  it("returns 0 for out of stock variant", () => {
    expect(getVariantStock(MOCK_PRODUCT, "UK 9", "Black")).toBe(0);
  });

  it("returns 0 for non-existent combination", () => {
    expect(getVariantStock(MOCK_PRODUCT, "UK 9", "White")).toBe(0);
  });
});