"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  PRICE_RANGES,
  type ActiveFilters,
} from "@/lib/products/filters";
import type { useFilters } from "@/hooks/use-filters";

interface ActiveFilterTagsProps {
  filters: ActiveFilters;
  actions: ReturnType<typeof useFilters>;
}

interface TagProps {
  label: string;
  onRemove: () => void;
}

function Tag({ label, onRemove }: TagProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-2 border border-neutral-200
        px-3 py-1.5 text-[10px] uppercase tracking-widest text-neutral-600"
    >
      {label}
      <button
        onClick={onRemove}
        className="text-neutral-400 hover:text-[#E8001D] transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        ✕
      </button>
    </motion.span>
  );
}

export function ActiveFilterTags({
  filters,
  actions,
}: ActiveFilterTagsProps) {
  const categoryLabel = CATEGORIES.find(
    (c) => c.value === filters.category,
  )?.label;

  const priceLabel = PRICE_RANGES.find(
    (p) => p.value === filters.price,
  )?.label;

  const hasTags = !!(
    filters.category ||
    filters.price ||
    filters.search
  );

  if (!hasTags) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <AnimatePresence mode="popLayout">
        {categoryLabel && (
          <Tag
            key="category"
            label={categoryLabel}
            onRemove={() => actions.setCategory(undefined)}
          />
        )}
        {priceLabel && (
          <Tag
            key="price"
            label={priceLabel}
            onRemove={() => actions.setPrice(undefined)}
          />
        )}
        {filters.search && (
          <Tag
            key="search"
            label={`"${filters.search}"`}
            onRemove={() => actions.setSearch(undefined)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}