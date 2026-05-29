import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProductListQuery } from "@/lib/validations/product";

type Client = SupabaseClient<Database>;

/**
 * Applies sort order to a products query.
 */
export function applySortOrder(
  query: ReturnType<Client["from"]>,
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

/**
 * Base product select with joined images and variants.
 */
export const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price,
  category,
  is_featured,
  model_url,
  created_at,
  updated_at,
  product_images (
    id,
    url,
    alt,
    position
  ),
  product_variants (
    id,
    size,
    color,
    stock
  )
` as const;