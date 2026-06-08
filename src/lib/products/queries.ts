import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProductListQuery } from "@/lib/validations/product";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPostgrestBuilder = any;

export function applySortOrder(
  query: AnyPostgrestBuilder,
  sort: ProductListQuery["sort"],
) {
  switch (sort) {
    case "price_asc":
      return query.order("price", { ascending: true });
    case "price_desc":
      return query.order("price", { ascending: false });
    case "featured":
      return query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
    case "newest":
    default:
      return query.order("created_at", { ascending: false });
  }
}

export const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price,
  category,
  is_featured,
  model_url,
  deleted_at,
  created_at,
  updated_at,
  images:product_images (
    id,
    url,
    alt,
    position
  ),
  variants:product_variants (
    id,
    size,
    color,
    stock
  )
` as const;