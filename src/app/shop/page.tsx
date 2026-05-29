import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFiltersFromParams } from "@/lib/products/filters";
import { fetchProducts } from "@/lib/products/fetch-products";
import { ProductCatalog } from "@/components/product/product-catalog";
import { ProductGridSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse the full ShoePalace collection.",
};

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const filters = parseFiltersFromParams(searchParams);
  const result = await fetchProducts(filters);

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-neutral-100 py-10 bg-[#F5F0E8]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h1 className="font-bebas text-display-md text-neutral-900">
            All Styles
          </h1>
        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={24} />}>
        <ProductCatalog initialResult={result} initialFilters={filters} />
      </Suspense>
    </div>
  );
}