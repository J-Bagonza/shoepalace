"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { ProductVariant } from "@/types/product";

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  currency: string;
}

interface EditState {
  size: string;
  color: string;
  stock: string;
}

const EMPTY_NEW: EditState = { size: "", color: "", stock: "0" };

export function VariantManager({
  productId,
  variants: initialVariants,
  currency,
}: VariantManagerProps) {
  const router = useRouter();
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(EMPTY_NEW);
  const [adding, setAdding] = useState(false);
  const [newVariant, setNewVariant] = useState<EditState>(EMPTY_NEW);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sorted = [...variants].sort((a, b) => {
    const numA = parseFloat(a.size.replace(/[^0-9.]/g, ""));
    const numB = parseFloat(b.size.replace(/[^0-9.]/g, ""));
    return numA - numB || a.color.localeCompare(b.color);
  });

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  // ── ADD ──
  async function handleAdd() {
    clearMessages();
    if (!newVariant.size.trim() || !newVariant.color.trim()) {
      setError("Size and color are required.");
      return;
    }
    const stock = parseInt(newVariant.stock, 10);
    if (isNaN(stock) || stock < 0) {
      setError("Stock must be 0 or more.");
      return;
    }

    setLoading("add");
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: [{ size: newVariant.size.trim(), color: newVariant.color.trim(), stock }],
        }),
      });

      const json = await res.json() as { data?: ProductVariant[]; error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to add variant.");
        return;
      }

      setVariants((prev) => [...prev, ...(json.data ?? [])]);
      setNewVariant(EMPTY_NEW);
      setAdding(false);
      setSuccess("Variant added.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  // ── EDIT ──
  function startEdit(variant: ProductVariant) {
    setEditingId(variant.id);
    setEditState({
      size: variant.size,
      color: variant.color,
      stock: String(variant.stock),
    });
    clearMessages();
  }

  async function handleSaveEdit(variantId: string) {
    clearMessages();
    const stock = parseInt(editState.stock, 10);
    if (isNaN(stock) || stock < 0) {
      setError("Stock must be 0 or more.");
      return;
    }
    if (!editState.size.trim() || !editState.color.trim()) {
      setError("Size and color are required.");
      return;
    }

    setLoading(variantId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          size: editState.size.trim(),
          color: editState.color.trim(),
          stock,
        }),
      });

      const json = await res.json() as {
        data?: { id: string; size: string; color: string; stock: number };
        error: string | null;
      };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to update variant.");
        return;
      }

      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId && json.data
            ? { ...v, size: json.data.size, color: json.data.color, stock: json.data.stock }
            : v,
        ),
      );
      setEditingId(null);
      setSuccess("Variant updated.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  // ── DELETE ──
  async function handleDelete(variantId: string) {
    clearMessages();
    if (!confirm("Delete this variant? This cannot be undone.")) return;

    setLoading(variantId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to delete variant.");
        return;
      }

      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setSuccess("Variant deleted.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400">
          Variants ({variants.length})
        </h2>
        {!adding && (
          <button
            onClick={() => { setAdding(true); clearMessages(); }}
            className="text-xs uppercase tracking-widest text-neutral-900
              border border-neutral-200 px-3 py-1.5 hover:border-neutral-900
              transition-colors"
          >
            + Add Variant
          </button>
        )}
      </div>

      {/* Add new variant row */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border border-neutral-900 p-4 flex flex-col gap-3"
          >
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">
              New Variant
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400">
                  Size
                </label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
                  placeholder="e.g. UK 9"
                  className="border border-neutral-200 px-3 py-2 text-sm
                    focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400">
                  Color
                </label>
                <input
                  type="text"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
                  placeholder="e.g. Black"
                  className="border border-neutral-200 px-3 py-2 text-sm
                    focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant((p) => ({ ...p, stock: e.target.value }))}
                  className="border border-neutral-200 px-3 py-2 text-sm
                    focus:border-neutral-900 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={loading === "add"}
                className="bg-neutral-900 text-white px-5 py-2 text-xs
                  uppercase tracking-widest hover:bg-neutral-700
                  transition-colors disabled:opacity-50"
              >
                {loading === "add" ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewVariant(EMPTY_NEW); }}
                className="text-xs uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variants table */}
      {sorted.length === 0 ? (
        <div className="border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400 uppercase tracking-widest">
            No variants yet. Add one above.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-100 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_80px_1fr] gap-3 px-4 py-3
            bg-neutral-50 border-b border-neutral-100">
            {["Size", "Color", "Stock", "Actions"].map((h) => (
              <span key={h} className="text-[10px] uppercase tracking-widest
                text-neutral-400">
                {h}
              </span>
            ))}
          </div>

          {sorted.map((variant, i) => {
            const isEditing = editingId === variant.id;
            const isLoading = loading === variant.id;

            return (
              <div
                key={variant.id}
                className={clsx(
                  "grid grid-cols-[1fr_1fr_80px_1fr] gap-3 px-4 py-3",
                  "border-b border-neutral-50 last:border-0 items-center",
                  i % 2 === 0 ? "bg-white" : "bg-neutral-50/30",
                )}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editState.size}
                      onChange={(e) => setEditState((p) => ({ ...p, size: e.target.value }))}
                      className="border border-neutral-900 px-2 py-1 text-sm
                        focus:outline-none w-full"
                    />
                    <input
                      type="text"
                      value={editState.color}
                      onChange={(e) => setEditState((p) => ({ ...p, color: e.target.value }))}
                      className="border border-neutral-900 px-2 py-1 text-sm
                        focus:outline-none w-full"
                    />
                    <input
                      type="number"
                      min="0"
                      value={editState.stock}
                      onChange={(e) => setEditState((p) => ({ ...p, stock: e.target.value }))}
                      className="border border-neutral-900 px-2 py-1 text-sm
                        focus:outline-none w-full"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(variant.id)}
                        disabled={isLoading}
                        className="text-[10px] uppercase tracking-widest
                          text-green-700 hover:text-green-900 transition-colors
                          disabled:opacity-50"
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[10px] uppercase tracking-widest
                          text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-neutral-900">
                      {variant.size}
                    </span>
                    <span className="text-sm text-neutral-500">
                      {variant.color}
                    </span>
                    <span className={clsx(
                      "text-sm font-medium",
                      variant.stock === 0 ? "text-red-500"
                      : variant.stock <= 3 ? "text-yellow-600"
                      : "text-green-600",
                    )}>
                      {variant.stock}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startEdit(variant)}
                        disabled={isLoading}
                        className="text-[10px] uppercase tracking-widest
                          text-neutral-500 hover:text-neutral-900 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        disabled={isLoading}
                        className="text-[10px] uppercase tracking-widest
                          text-neutral-400 hover:text-[#E8001D] transition-colors
                          disabled:opacity-50"
                      >
                        {isLoading ? "..." : "Delete"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Currency note */}
      <p className="text-[10px] uppercase tracking-widest text-neutral-300">
        Store currency: {currency} — change in Settings
      </p>

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
      )}
      {success && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-600 uppercase tracking-widest"
          role="status"
        >
          {success}
        </motion.p>
      )}
    </div>
  );
}