import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateBody } from "@/lib/validations/request";
import { addCartItemSchema } from "@/lib/validations/cart";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";
import type { CartItem } from "@/types/cart";

const CART_SELECT = `
  id,
  variant_id,
  quantity,
  product_variants (
    id,
    size,
    color,
    stock,
    products (
      id,
      name,
      slug,
      price,
      product_images ( url, alt, position )
    )
  )
` as const;

interface RawCartRow {
  id: string;
  variant_id: string;
  quantity: number;
  product_variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
    products: {
      id: string;
      name: string;
      slug: string;
      price: number;
      product_images: { url: string; alt: string; position: number }[];
    };
  };
}

function mapCartRow(row: RawCartRow): CartItem {
  const variant = row.product_variants;
  const product = variant.products;
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  return {
    id: row.id,
    variant_id: row.variant_id,
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    image_url: images[0]?.url ?? "",
    size: variant.size,
    color: variant.color,
    price: product.price,
    quantity: row.quantity,
  };
}

async function getHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .eq("user_id", auth.userId)
    .returns<RawCartRow[]>();

  if (error) {
    log.error({ requestId, event: "cart.get.error" }, error.message);
    const body: ApiResponse = { data: null, error: "Failed to fetch cart.", status: 500 };
    return Response.json(body, { status: 500 });
  }

  const items = (data ?? []).map(mapCartRow);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);

  const body: ApiResponse<{ items: CartItem[]; total: number; item_count: number }> = {
    data: { items, total, item_count },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

async function addHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, addCartItemSchema);
  if (!validation.success) return validation.response;

  const { variant_id, quantity } = validation.data;
  const admin = createAdminSupabaseClient();

  const { data: variant, error: variantError } = await admin
    .from("product_variants")
    .select("id, stock, products!inner(deleted_at)")
    .eq("id", variant_id)
    .single<{
      id: string;
      stock: number;
      products: { deleted_at: string | null };
    }>();

  if (variantError || !variant) {
    const body: ApiResponse = { data: null, error: "Variant not found.", status: 404 };
    return Response.json(body, { status: 404 });
  }

  if (variant.products.deleted_at) {
    const body: ApiResponse = {
      data: null,
      error: "Product is no longer available.",
      status: 410,
    };
    return Response.json(body, { status: 410 });
  }

  if (variant.stock < quantity) {
    const body: ApiResponse = { data: null, error: "Insufficient stock.", status: 409 };
    return Response.json(body, { status: 409 });
  }

  const supabase = createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", auth.userId)
    .eq("variant_id", variant_id)
    .single<{ id: string; quantity: number }>();

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, 99);

    if (newQty > variant.stock) {
      const body: ApiResponse = { data: null, error: "Insufficient stock.", status: 409 };
      return Response.json(body, { status: 409 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id)
      .eq("user_id", auth.userId) as { error: { message: string } | null };

    if (error) {
      log.error({ requestId, event: "cart.add.update.error" }, error.message);
      const body: ApiResponse = { data: null, error: "Failed to update cart.", status: 500 };
      return Response.json(body, { status: 500 });
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cart_items")
      .insert({ user_id: auth.userId, variant_id, quantity }) as {
      error: { message: string } | null;
    };

    if (error) {
      log.error({ requestId, event: "cart.add.insert.error" }, error.message);
      const body: ApiResponse = { data: null, error: "Failed to add to cart.", status: 500 };
      return Response.json(body, { status: 500 });
    }
  }

  log.info({ requestId, event: "cart.add.success" }, "Item added to cart");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Item added to cart." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", getHandler);
export const POST = withRateLimit("api", addHandler);