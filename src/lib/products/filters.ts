export const CATEGORIES = [
  { value: "running", label: "Running" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "hiking", label: "Hiking" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
] as const;

export const PRICE_RANGES = [
  { value: "0-100", label: "Under £100" },
  { value: "100-200", label: "£100 – £200" },
  { value: "200-300", label: "£200 – £300" },
  { value: "300+", label: "Over £300" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export type CategoryOption = (typeof CATEGORIES)[number]["value"];
export type PriceRange = (typeof PRICE_RANGES)[number]["value"];

export interface ActiveFilters {
  category?: string;
  sort: SortOption;
  search?: string;
  price?: string;
  page: number;
  page_size: number;
}

export function parseFiltersFromParams(
  params: Record<string, string | string[] | undefined>,
): ActiveFilters {
  const get = (key: string): string | undefined => {
    const val = params[key];
    return typeof val === "string" ? val : undefined;
  };

  const sort = get("sort") ?? "newest";
  const validSort = SORT_OPTIONS.map((s) => s.value).includes(
    sort as SortOption,
  )
    ? (sort as SortOption)
    : "newest";

  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);
  const page_size = 24;

  return {
    category: get("category"),
    sort: validSort,
    search: get("search"),
    price: get("price"),
    page,
    page_size,
  };
}

export function buildSearchParams(filters: Partial<ActiveFilters>): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.sort && filters.sort !== "newest")
    params.set("sort", filters.sort);
  if (filters.search) params.set("search", filters.search);
  if (filters.price) params.set("price", filters.price);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  return params.toString();
}