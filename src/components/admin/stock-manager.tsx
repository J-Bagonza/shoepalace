"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ProductVariant } from "@/types/product";

interface StockManagerProps {
  productId: string;
  variants: ProductVariant[];
}

export function StockManager({ productId, variants }: StockManagerProps) {
  const router = useRouter();
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(variants.map((v) => [v.id, v.stock])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sortedVariants = [...variants].sort((a, b) => {
    const numA = parseFloat(a.size.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.size.replace(/[^0-9.]/g, ""));
    return numA - numB || a.color.localeCompare(b.color);
  });

  function handleChange(id: string, value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setStocks((prev) => ({ ...prev, [id]: Math.min(num, 99999) }));
    setSuccess(false);
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/variants`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variants: Object.entries(stocks).map(([id, stock]) => ({
              id,
              stock,
            })),
          }),
        },
      );

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to update stock.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (variants.length === 0) {
    return (
      <div className="border border-neutral-100 p-8 text-center">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">
          No variants found for this product.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Variants grid */}
      <div className="border border-neutral-100 overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 bg-neutral-50
          border-b border-neutral-100">
          {["Size", "Colour", "Current Stock", "New Stock"].map((h) => (
            <span
              key={h}
              className="text-[10px] uppercase tracking-widest text-neutral-400"
            >
              {h}
            </span>
          ))}
        </div>

        {sortedVariants.map((variant, i) => {
          const currentStock = stocks[variant.id] ?? variant.stock;
          const changed = currentStock !== variant.stock;

          return (
            <div
              key={variant.id}
              className={`grid grid-cols-4 items-center px-4 py-3
                border-b border-neutral-50 last:border-0
                ${i % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}`}
            >
              <span className="text-xs font-medium text-neutral-900">
                {variant.size}
              </span>
              <span className="text-xs text-neutral-500">{variant.color}</span>
              <span className={`text-xs ${
                variant.stock === 0
                  ? "text-red-500"
                  : variant.stock <= 3
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}>
                {variant.stock}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="99999"
                  value={currentStock}
                  onChange={(e) => handleChange(variant.id, e.target.value)}
                  className={`w-20 border px-2 py-1.5 text-xs text-neutral-900
                    focus:outline-none focus:border-neutral-900 transition-colors
                    ${changed
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white"
                    }`}
                />
                {changed && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] text-neutral-400 uppercase
                      tracking-widest"
                  >
                    {currentStock > variant.stock ? "+" : ""}
                    {currentStock - variant.stock}
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {Object.entries(stocks).some(
        ([id, stock]) => stock !== variants.find((v) => v.id === id)?.stock,
      ) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-neutral-500
            uppercase tracking-widest"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
          Unsaved changes
        </motion.div>
      )}

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">
          {error}
        </p>
      )}

      {success && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-600 uppercase tracking-widest"
          role="status"
        >
          Stock updated successfully.
        </motion.p>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-neutral-900 text-white px-8 py-3 text-xs uppercase
            tracking-widest hover:bg-neutral-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Stock Levels"}
        </button>
        <button
          onClick={() =>
            setStocks(
              Object.fromEntries(variants.map((v) => [v.id, v.stock])),
            )
          }
          className="text-xs uppercase tracking-widest text-neutral-400
            hover:text-neutral-900 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}