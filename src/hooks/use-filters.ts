"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { buildSearchParams } from "@/lib/products/filters";
import type { ActiveFilters, SortOption } from "@/lib/products/filters";

export function useFilters(current: ActiveFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (updates: Partial<ActiveFilters>) => {
      const next = { ...current, ...updates, page: 1 };
      const qs = buildSearchParams(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [current, pathname, router],
  );

  const setCategory = useCallback(
    (category: string | undefined) => push({ category }),
    [push],
  );

  const setSort = useCallback(
    (sort: SortOption) => push({ sort }),
    [push],
  );

  const setSearch = useCallback(
    (search: string | undefined) => push({ search }),
    [push],
  );

  const setPrice = useCallback(
    (price: string | undefined) => push({ price }),
    [push],
  );

  const setPage = useCallback(
    (page: number) => {
      const next = { ...current, page };
      const qs = buildSearchParams(next);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
    },
    [current, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = !!(
    current.category ||
    current.search ||
    current.price ||
    current.sort !== "newest"
  );

  return {
    setCategory,
    setSort,
    setSearch,
    setPrice,
    setPage,
    clearFilters,
    hasActiveFilters,
  };
}