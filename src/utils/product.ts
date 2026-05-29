import type { Product } from "@/types/product";

/**
 * Returns the primary image for a product.
 * Falls back to first image if no position 0 exists.
 */
export function getPrimaryImage(product: Product): {
  url: string;
  alt: string;
} | null {
  if (!product.images || product.images.length === 0) return null;

  const sorted = [...product.images].sort((a, b) => a.position - b.position);
  const primary = sorted[0];

  if (!primary) return null;

  return { url: primary.url, alt: primary.alt };
}

/**
 * Formats price in GBP.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}

/**
 * Returns unique sizes from product variants sorted numerically.
 */
export function getAvailableSizes(product: Product): string[] {
  if (!product.variants) return [];
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  return sizes.sort((a, b) => {
    const numA = parseFloat(a.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.replace(/[^0-9.]/g, ""));
    return numA - numB;
  });
}

/**
 * Returns unique colors from product variants.
 */
export function getAvailableColors(product: Product): string[] {
  if (!product.variants) return [];
  return [...new Set(product.variants.map((v) => v.color))];
}

/**
 * Returns true if any variant has stock > 0.
 */
export function isInStock(product: Product): boolean {
  if (!product.variants) return false;
  return product.variants.some((v) => v.stock > 0);
}

/**
 * Returns stock for a specific variant combination.
 */
export function getVariantStock(
  product: Product,
  size: string,
  color: string,
): number {
  if (!product.variants) return 0;
  const variant = product.variants.find(
    (v) => v.size === size && v.color === color,
  );
  return variant?.stock ?? 0;
}