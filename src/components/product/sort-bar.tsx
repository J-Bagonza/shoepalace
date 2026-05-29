"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  SORT_OPTIONS,
  type ActiveFilters,
  type SortOption,
} from "@/lib/products/filters";
import type { useFilters } from "@/hooks/use-filters";

interface SortBarProps {
  filters: ActiveFilters;
  actions: ReturnType<typeof useFilters>;
  resultCount: number;
  onFilterOpen: () => void;
}

export function SortBar({
  filters,
  actions,
  resultCount,
  onFilterOpen,
}: SortBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentSort =
    SORT_OPTIONS.find((o) => o.value === filters.sort) ?? SORT_OPTIONS[0];

  return (
    <div className="flex items-center justify-between py-4 border-b
      border-neutral-100">
      {/* Left — result count + mobile filter toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onFilterOpen}
          className="flex items-center gap-2 text-xs uppercase tracking-widest
            text-neutral-600 hover:text-neutral-900 transition-colors lg:hidden"
          aria-label="Open filters"
        >
          <span>Filter</span>
          {actions.hasActiveFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8001D]" />
          )}
        </button>

        <p className="hidden lg:block text-xs text-neutral-400">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </p>
      </div>

      {/* Right — sort dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setSortOpen((prev) => !prev)}
          className="flex items-center gap-2 text-xs uppercase tracking-widest
            text-neutral-600 hover:text-neutral-900 transition-colors"
          aria-expanded={sortOpen}
          aria-haspopup="listbox"
        >
          <span className="text-neutral-400">Sort:</span>
          <span className="text-neutral-900">{currentSort?.label}</span>
          <motion.span
            animate={{ rotate: sortOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block text-neutral-400 text-[10px]"
          >
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {sortOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              role="listbox"
              className="absolute right-0 top-full mt-2 z-20 w-52 bg-white
                border border-neutral-100 shadow-lg py-1"
            >
              {SORT_OPTIONS.map((option) => (
                <li key={option.value} role="option"
                  aria-selected={filters.sort === option.value}>
                  <button
                    onClick={() => {
                      actions.setSort(option.value as SortOption);
                      setSortOpen(false);
                    }}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 text-xs uppercase",
                      "tracking-wider transition-colors duration-150",
                      filters.sort === option.value
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-50",
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}