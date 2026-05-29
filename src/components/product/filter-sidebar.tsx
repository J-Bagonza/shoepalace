"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import {
  CATEGORIES,
  SORT_OPTIONS,
  PRICE_RANGES,
  type ActiveFilters,
  type SortOption,
} from "@/lib/products/filters";
import type { useFilters } from "@/hooks/use-filters";

interface FilterSidebarProps {
  filters: ActiveFilters;
  actions: ReturnType<typeof useFilters>;
  resultCount: number;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 border-b border-neutral-100
      last:border-0">
      <h3 className="text-xs uppercase tracking-widest text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-3 py-2 text-xs uppercase",
        "tracking-wider transition-all duration-150 text-left w-full",
        active
          ? "bg-neutral-900 text-white"
          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100",
      )}
    >
      {children}
      {active && (
        <span className="ml-2 text-white/60 text-[10px]">✓</span>
      )}
    </button>
  );
}

export function FilterSidebar({
  filters,
  actions,
  resultCount,
}: FilterSidebarProps) {
  return (
    <aside className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b
        border-neutral-100">
        <h2 className="text-xs uppercase tracking-widest text-neutral-900">
          Filter
        </h2>
        {actions.hasActiveFilters && (
          <button
            onClick={actions.clearFilters}
            className="text-[10px] uppercase tracking-widest text-neutral-400
              hover:text-[#E8001D] transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="py-3 border-b border-neutral-100">
        <p className="text-xs text-neutral-400">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      </div>

      {/* Sort */}
      <FilterSection title="Sort By">
        <div className="flex flex-col gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={filters.sort === option.value}
              onClick={() => actions.setSort(option.value as SortOption)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        <div className="flex flex-col gap-1.5">
          <FilterChip
            active={!filters.category}
            onClick={() => actions.setCategory(undefined)}
          >
            All
          </FilterChip>
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.value}
              active={filters.category === cat.value}
              onClick={() =>
                actions.setCategory(
                  filters.category === cat.value ? undefined : cat.value,
                )
              }
            >
              {cat.label}
            </FilterChip>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <div className="flex flex-col gap-1.5">
          <FilterChip
            active={!filters.price}
            onClick={() => actions.setPrice(undefined)}
          >
            Any Price
          </FilterChip>
          {PRICE_RANGES.map((range) => (
            <FilterChip
              key={range.value}
              active={filters.price === range.value}
              onClick={() =>
                actions.setPrice(
                  filters.price === range.value ? undefined : range.value,
                )
              }
            >
              {range.label}
            </FilterChip>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}