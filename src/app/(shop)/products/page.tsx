import { parseFiltersFromParams } from "@/lib/products/filters";
import { fetchProducts } from "@/lib/products/api";
import { ProductCatalog } from "@/components/product";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Shoe Palace",
  description: "Browse our full collection of shoes.",
};

interface ProductsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const filters = parseFiltersFromParams(searchParams);
  const result = await fetchProducts(filters);

  return (
    <main>
      <ProductCatalog initialResult={result} initialFilters={filters} />
    </main>
  );
}