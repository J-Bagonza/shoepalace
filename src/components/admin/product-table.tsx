"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/utils/product";
import type { Product } from "@/types/product";

interface AdminProductTableProps {
  products: Product[];
  showDeleted: boolean;
}

function getStockStatus(variants: { stock: number }[]): {
  label: string;
  className: string;
} | null {
  if (!variants || variants.length === 0) return null;
  const total = variants.reduce((sum, v) => sum + v.stock, 0);
  const hasZero = variants.some((v) => v.stock === 0);

  if (total === 0) {
    return {
      label: "Out of stock",
      className: "text-red-500",
    };
  }
  if (hasZero || total <= 5) {
    return {
      label: `Low stock (${total})`,
      className: "text-yellow-600",
    };
  }
  return {
    label: `In stock (${total})`,
    className: "text-green-600",
  };
}

export function AdminProductTable({
  products,
  showDeleted,
}: AdminProductTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Soft delete this product?")) return;
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const json = await res.json() as { error: string | null };
      if (!res.ok) {
        setError(json.error ?? "Failed to delete.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestore(id: string) {
    setActionLoading(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${id}/restore`, {
        method: "PATCH",
      });
      const json = await res.json() as { error: string | null };
      if (!res.ok) {
        setError(json.error ?? "Failed to restore.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error.");
    } finally {
      setActionLoading(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 border
        border-neutral-100">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-xs text-[#E8001D] uppercase tracking-widest">
          {error}
        </p>
      )}

      <div className="overflow-x-auto border border-neutral-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {[
                "Product",
                "Category",
                "Price",
                "Stock",
                "Featured",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] uppercase
                    tracking-widest text-neutral-400 font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {products.map((product) => {
                const primaryImage = [...(product.images ?? [])]
                  .sort((a, b) => a.position - b.position)[0];
                const totalStock = (product.variants ?? []).reduce(
                  (sum, v) => sum + v.stock,
                  0,
                );

                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-neutral-50 hover:bg-neutral-50
                      transition-colors"
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0
                          bg-[#F5F0E8] overflow-hidden">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-neutral-100" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-neutral-900
                            truncate max-w-[160px]">
                            {product.name}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            /{product.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-xs text-neutral-600
                      uppercase tracking-wider">
                      {product.category}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-xs text-neutral-900">
                      {formatPrice(product.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      {(() => {
                        const status = getStockStatus(product.variants ?? []);
                        return status ? (
                          <span className={`text-[10px] uppercase tracking-widest ${status.className}`}>
                            {status.label}
                          </span>
                        ) : (
                          <span className={`text-xs ${
                            totalStock > 10
                              ? "text-green-600"
                              : totalStock > 0
                                ? "text-yellow-600"
                                : "text-red-500"
                          }`}>
                            {totalStock}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-widest
                        ${product.is_featured
                          ? "text-[#E8001D]"
                          : "text-neutral-300"
                        }`}>
                        {product.is_featured ? "Yes" : "No"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {!showDeleted ? (
                          <>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="text-[10px] uppercase tracking-widest
                                text-neutral-500 hover:text-neutral-900
                                transition-colors"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/products/${product.id}/stock`}
                              className="text-[10px] uppercase tracking-widest
                                text-neutral-500 hover:text-neutral-900
                                transition-colors"
                            >
                              Stock
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={actionLoading === product.id}
                              className="text-[10px] uppercase tracking-widest
                                text-neutral-400 hover:text-[#E8001D]
                                transition-colors disabled:opacity-40"
                            >
                              {actionLoading === product.id
                                ? "..."
                                : "Archive"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(product.id)}
                            disabled={actionLoading === product.id}
                            className="text-[10px] uppercase tracking-widest
                              text-neutral-500 hover:text-neutral-900
                              transition-colors disabled:opacity-40"
                          >
                            {actionLoading === product.id
                              ? "..."
                              : "Restore"}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}