"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { ProductVariant } from "@/types/product";
import type { StockMovementReason } from "@/types/inventory";

interface StockManagerProps {
  productId: string;
  variants: ProductVariant[];
}

type MovementEntry = {
  variant_id: string;
  delta: number;
  reason: StockMovementReason;
  note: string;
};

const REASON_OPTIONS: {
  value: StockMovementReason;
  label: string;
  sign: 1 | -1;
}[] = [
  { value: "restock", label: "Restock", sign: 1 },
  { value: "manual_increase", label: "Manual Increase", sign: 1 },
  { value: "manual_decrease", label: "Manual Decrease", sign: -1 },
  { value: "damaged", label: "Damaged / Lost", sign: -1 },
  { value: "return", label: "Customer Return", sign: 1 },
];

export function StockManager({ productId, variants }: StockManagerProps) {
  const router = useRouter();

  const [entries, setEntries] = useState<Record<string, MovementEntry>>(
    Object.fromEntries(
      variants.map((v) => [
        v.id,
        {
          variant_id: v.id,
          delta: 0,
          reason: "restock" as StockMovementReason,
          note: "",
        },
      ]),
    ),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sortedVariants = [...variants].sort((a, b) => {
    const numA = parseFloat(a.size.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.size.replace(/[^0-9.]/g, ""));
    return numA - numB || a.color.localeCompare(b.color);
  });

  function updateEntry(
    variantId: string,
    field: keyof MovementEntry,
    value: string | number,
  ) {
    setEntries((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId]!, [field]: value },
    }));
    setSuccess(false);
  }

  function getEffectiveDelta(entry: MovementEntry): number {
    const option = REASON_OPTIONS.find((r) => r.value === entry.reason);
    const sign = option?.sign ?? 1;
    return sign * Math.abs(entry.delta);
  }

  function getNewStock(variant: ProductVariant): number {
    const entry = entries[variant.id];
    if (!entry || entry.delta === 0) return variant.stock;
    return variant.stock + getEffectiveDelta(entry);
  }

  const changedEntries = Object.values(entries).filter((e) => e.delta !== 0);

  async function handleSave() {
    if (changedEntries.length === 0) return;
    setError(null);
    setSuccess(false);

    // Validate no stock goes below zero
    for (const entry of changedEntries) {
      const variant = variants.find((v) => v.id === entry.variant_id);
      if (!variant) continue;
      const newStock = getNewStock(variant);
      if (newStock < 0) {
        setError(
          `Cannot reduce ${variant.size}/${variant.color} below zero. ` +
          `Current stock: ${variant.stock}.`,
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/admin/products/${productId}/stock-movements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movements: changedEntries.map((entry) => ({
              variant_id: entry.variant_id,
              delta: getEffectiveDelta(entry),
              reason: entry.reason,
              note: entry.note || undefined,
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
      // Reset entries to zero after save
      setEntries(
        Object.fromEntries(
          variants.map((v) => [
            v.id,
            {
              variant_id: v.id,
              delta: 0,
              reason: "restock" as StockMovementReason,
              note: "",
            },
          ]),
        ),
      );
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
      {/* Variant table */}
      <div className="border border-neutral-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[80px_80px_60px_120px_80px_1fr]
          px-4 py-3 bg-neutral-50 border-b border-neutral-100 gap-3">
          {["Size", "Colour", "Stock", "Reason", "Qty", "Note"].map((h) => (
            <span
              key={h}
              className="text-[10px] uppercase tracking-widest text-neutral-400"
            >
              {h}
            </span>
          ))}
        </div>

        {sortedVariants.map((variant, i) => {
          const entry = entries[variant.id]!;
          const newStock = getNewStock(variant);
          const stockChanged = entry.delta !== 0;
          const wouldGoNegative = newStock < 0;
          const option = REASON_OPTIONS.find(
            (r) => r.value === entry.reason,
          );

          return (
            <div
              key={variant.id}
              className={clsx(
                "grid grid-cols-[80px_80px_60px_120px_80px_1fr]",
                "items-center px-4 py-3 gap-3 border-b border-neutral-50",
                "last:border-0",
                i % 2 === 0 ? "bg-white" : "bg-neutral-50/30",
                wouldGoNegative && "bg-red-50",
              )}
            >
              {/* Size */}
              <span className="text-xs font-medium text-neutral-900">
                {variant.size}
              </span>

              {/* Color */}
              <span className="text-xs text-neutral-500 truncate">
                {variant.color}
              </span>

              {/* Current stock → new stock */}
              <div className="flex flex-col gap-0.5">
                <span className={clsx(
                  "text-xs font-medium",
                  variant.stock === 0
                    ? "text-red-500"
                    : variant.stock <= 3
                      ? "text-yellow-600"
                      : "text-green-600",
                )}>
                  {variant.stock}
                </span>
                {stockChanged && (
                  <span className={clsx(
                    "text-[10px]",
                    wouldGoNegative ? "text-red-500" : "text-neutral-400",
                  )}>
                    → {newStock}
                  </span>
                )}
              </div>

              {/* Reason */}
              <select
                value={entry.reason}
                onChange={(e) =>
                  updateEntry(
                    variant.id,
                    "reason",
                    e.target.value as StockMovementReason,
                  )
                }
                className="border border-neutral-200 bg-white px-2 py-1
                  text-[10px] uppercase tracking-widest text-neutral-700
                  focus:border-neutral-900 focus:outline-none w-full"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">
                  {option?.sign === -1 ? "−" : "+"}
                </span>
                <input
                  type="number"
                  min="0"
                  max="99999"
                  value={entry.delta === 0 ? "" : Math.abs(entry.delta)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    updateEntry(
                      variant.id,
                      "delta",
                      isNaN(val) ? 0 : Math.abs(val),
                    );
                  }}
                  placeholder="0"
                  className={clsx(
                    "w-full border px-2 py-1 text-xs text-neutral-900",
                    "focus:outline-none focus:border-neutral-900 transition-colors",
                    stockChanged
                      ? wouldGoNegative
                        ? "border-red-400 bg-red-50"
                        : "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white",
                  )}
                />
              </div>

              {/* Note */}
              <input
                type="text"
                value={entry.note}
                onChange={(e) => updateEntry(variant.id, "note", e.target.value)}
                placeholder="Optional note"
                maxLength={200}
                className="w-full border border-neutral-200 bg-white px-2 py-1
                  text-[10px] text-neutral-600 focus:border-neutral-900
                  focus:outline-none transition-colors"
              />
            </div>
          );
        })}
      </div>

      {/* Change summary */}
      <AnimatePresence>
        {changedEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="border border-neutral-100 bg-neutral-50 p-4
              flex flex-col gap-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">
              Pending changes ({changedEntries.length} variant
              {changedEntries.length !== 1 ? "s" : ""})
            </p>
            {changedEntries.map((entry) => {
              const variant = variants.find((v) => v.id === entry.variant_id);
              if (!variant) return null;
              const effective = getEffectiveDelta(entry);
              const newStock = variant.stock + effective;
              return (
                <p
                  key={entry.variant_id}
                  className="text-xs text-neutral-600"
                >
                  {variant.size}/{variant.color}: {variant.stock}{" "}
                  <span className={
                    effective > 0 ? "text-green-600" : "text-red-500"
                  }>
                    {effective > 0 ? `+${effective}` : effective}
                  </span>{" "}
                  → {newStock < 0 ? (
                    <span className="text-red-500">
                      {newStock} (invalid)
                    </span>
                  ) : (
                    <span className="font-medium">{newStock}</span>
                  )}
                  {entry.reason && (
                    <span className="text-neutral-400">
                      {" "}({entry.reason.replace("_", " ")})
                    </span>
                  )}
                </p>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

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
          disabled={loading || changedEntries.length === 0}
          className="bg-neutral-900 text-white px-8 py-3 text-xs uppercase
            tracking-widest hover:bg-neutral-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Saving..."
            : `Save ${changedEntries.length > 0
                ? `(${changedEntries.length})`
                : ""
              } Changes`}
        </button>
        <button
          onClick={() =>
            setEntries(
              Object.fromEntries(
                variants.map((v) => [
                  v.id,
                  {
                    variant_id: v.id,
                    delta: 0,
                    reason: "restock" as StockMovementReason,
                    note: "",
                  },
                ]),
              ),
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