"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { getAvailableSizes, getAvailableColors } from "@/utils/product";
import type { Product, ProductVariant } from "@/types/product";

interface VariantSelectorProps {
  product: Product;
  onVariantChange: (variant: ProductVariant | null) => void;
}

export function VariantSelector({
  product,
  onVariantChange,
}: VariantSelectorProps) {
  const sizes = getAvailableSizes(product);
  const colors = getAvailableColors(product);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0] ?? null,
  );

  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return (
      product.variants?.find(
        (v) => v.size === selectedSize && v.color === selectedColor,
      ) ?? null
    );
  }, [selectedSize, selectedColor, product.variants]);

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    const variant =
      product.variants?.find(
        (v) => v.size === size && v.color === (selectedColor ?? colors[0]),
      ) ?? null;
    onVariantChange(variant);
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color);
    const variant =
      product.variants?.find(
        (v) => v.size === (selectedSize ?? sizes[0]) && v.color === color,
      ) ?? null;
    onVariantChange(variant);
  }

  function isSizeAvailable(size: string): boolean {
    return (product.variants ?? []).some(
      (v) =>
        v.size === size &&
        (!selectedColor || v.color === selectedColor) &&
        v.stock > 0,
    );
  }

  function isColorAvailable(color: string): boolean {
    return (product.variants ?? []).some(
      (v) =>
        v.color === color &&
        (!selectedSize || v.size === selectedSize) &&
        v.stock > 0,
    );
  }

  const stock = selectedVariant?.stock ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Color selector */}
      {colors.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest
              text-neutral-500">
              Colour
            </span>
            {selectedColor && (
              <span className="text-xs text-neutral-900">
                {selectedColor}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const available = isColorAvailable(color);
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => available && handleColorSelect(color)}
                  disabled={!available}
                  className={clsx(
                    "px-4 py-2 text-xs uppercase tracking-wider",
                    "transition-all duration-150 focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-neutral-900",
                    active
                      ? "bg-neutral-900 text-white"
                      : available
                        ? "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
                        : "border border-neutral-100 text-neutral-300 cursor-not-allowed line-through",
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest
              text-neutral-500">
              Size
            </span>
            {!selectedSize && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[#E8001D] uppercase tracking-widest"
              >
                Select a size
              </motion.span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => available && handleSizeSelect(size)}
                  disabled={!available}
                  className={clsx(
                    "py-3 text-xs uppercase tracking-wider relative",
                    "transition-all duration-150 focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-neutral-900",
                    active
                      ? "bg-neutral-900 text-white"
                      : available
                        ? "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
                        : "border border-neutral-100 text-neutral-300 cursor-not-allowed",
                  )}
                  aria-label={`Size ${size}${!available ? ", out of stock" : ""}`}
                >
                  {size}
                  {/* Out of stock diagonal line */}
                  {!available && (
                    <span
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="absolute top-1/2 left-0 right-0
                        h-px bg-neutral-200 rotate-[-20deg]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock indicator */}
      {selectedVariant && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              stock > 5
                ? "bg-green-500"
                : stock > 0
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
          />
          <span className="text-xs text-neutral-500">
            {stock > 5
              ? "In Stock"
              : stock > 0
                ? `Only ${stock} left`
                : "Out of Stock"}
          </span>
        </motion.div>
      )}

      {/* Low / out of stock warnings */}
      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
        <p className="text-xs text-yellow-600 uppercase tracking-widest">
          Only {selectedVariant.stock} left
        </p>
      )}

      {selectedVariant && selectedVariant.stock === 0 && (
        <p className="text-xs text-red-500 uppercase tracking-widest">
          Out of stock
        </p>
      )}
    </div>
  );
}