"use client";

import { useState } from "react";
import { useFilters } from "@/hooks/use-filters";
import { FilterSidebar } from "./filter-sidebar";
import { FilterDrawer } from "./filter-drawer";
import { SortBar } from "./sort-bar";
import { SearchBar } from "./search-bar";
import { ProductGrid } from "./product-grid";
import { Pagination } from "./pagination";
import { ActiveFilterTags } from "./active-filter-tags";
import type { ActiveFilters } from "@/lib/products/filters";
import type { PaginatedResponse } from "@/types/api";
import type { Product } from "@/types/product";

interface ProductCatalogProps {
  initialResult: PaginatedResponse<Product>;
  initialFilters: ActiveFilters;
}

export function ProductCatalog({
  initialResult,
  initialFilters,
}: ProductCatalogProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const actions = useFilters();

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={initialFilters.search}
          onChange={actions.setSearch}
        />
      </div>

      {/* Active filter tags */}
      <ActiveFilterTags filters={initialFilters} actions={actions} />

      {/* Sort bar */}
      <SortBar
        filters={initialFilters}
        actions={actions}
        resultCount={initialResult.total}
        onFilterOpen={() => setFilterDrawerOpen(true)}
      />

      {/* Body */}
      <div className="flex gap-8 mt-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-52 shrink-0">
          <FilterSidebar
            filters={initialFilters}
            actions={actions}
            resultCount={initialResult.total}
          />
        </div>

        {/* Grid + pagination */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={initialResult.data} />
          <Pagination
            page={initialResult.page}
            total_pages={initialResult.total_pages}
            onPageChange={actions.setPage}
          />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={initialFilters}
        actions={actions}
        resultCount={initialResult.total}
      />
    </div>
  );
}