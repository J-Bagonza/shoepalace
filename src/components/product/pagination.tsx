"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";

interface PaginationProps {
  page: number;
  total_pages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  total_pages,
  onPageChange,
}: PaginationProps) {
  if (total_pages <= 1) return null;

  // Build page number array with ellipsis
  function getPages(): (number | "...")[] {
    if (total_pages <= 7) {
      return Array.from({ length: total_pages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];

    if (page > 3) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(total_pages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < total_pages - 2) pages.push("...");

    pages.push(total_pages);
    return pages;
  }

  const pages = getPages();

  return (
    <nav
      className="flex items-center justify-center gap-1 py-12"
      aria-label="Pagination"
    >
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2.5 text-xs uppercase tracking-widest
          text-neutral-400 hover:text-neutral-900 transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-xs text-neutral-300 select-none"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <motion.button
            key={p}
            onClick={() => onPageChange(p)}
            whileTap={{ scale: 0.92 }}
            className={clsx(
              "h-9 w-9 text-xs transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-neutral-900",
              p === page
                ? "bg-neutral-900 text-white"
                : "text-neutral-500 hover:bg-neutral-100",
            )}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </motion.button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages}
        className="px-4 py-2.5 text-xs uppercase tracking-widest
          text-neutral-400 hover:text-neutral-900 transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}