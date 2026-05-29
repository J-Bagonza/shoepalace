"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilterSidebar } from "./filter-sidebar";
import type { ActiveFilters } from "@/lib/products/filters";
import type { useFilters } from "@/hooks/use-filters";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ActiveFilters;
  actions: ReturnType<typeof useFilters>;
  resultCount: number;
}

export function FilterDrawer({
  open,
  onClose,
  filters,
  actions,
  resultCount,
}: FilterDrawerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-white
              shadow-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between px-5 py-4
              border-b border-neutral-100 sticky top-0 bg-white z-10">
              <span className="text-xs uppercase tracking-widest
                text-neutral-900 font-medium">
                Filters
              </span>
              <button
                onClick={onClose}
                className="text-xs uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
                aria-label="Close filters"
              >
                Close
              </button>
            </div>

            <div className="px-5 pb-8">
              <FilterSidebar
                filters={filters}
                actions={actions}
                resultCount={resultCount}
              />
            </div>

            {/* Apply button */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-100
              px-5 py-4">
              <button
                onClick={onClose}
                className="w-full bg-neutral-900 text-white text-xs uppercase
                  tracking-widest py-3.5 hover:bg-neutral-700
                  transition-colors duration-200"
              >
                View {resultCount} Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}