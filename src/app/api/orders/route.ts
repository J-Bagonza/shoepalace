import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email/order-emails";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { trackOrder } from "@/lib/metrics/track-usage";
import { createOrderSchema } from "@/lib/validations/order";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";
import type { Order } from "@/types/order";

export const dynamic = "force-dynamic";

const SHIPPING_FEE = 300; // KES 300 flat rate

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);
  const tenantId = getTenantIdFromHeaders();

  const validation = await validateBody(req, createOrderSchema);
  if (!validation.success) return validation.response;

  const input = validation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  // Get authenticated user if logged in
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // =============================================
  // VALIDATE ALL VARIANTS EXIST + HAVE STOCK
  // SECURITY: never trust client prices
  // =============================================
  const variantIds = input.items.map((i) => i.variant_id);

  const { data: variants, error: variantError } = await admin
    .from("product_variants")
    .select(`
      id, stock, size, color,
      products!inner (
        id, name, slug, price, deleted_at, tenant_id,
        product_images ( url, position )
      )
    `)
    .in("id", variantIds)
    .eq("products.tenant_id", tenantId)
    .is("products.deleted_at", null);

  if (variantError || !variants || variants.length !== variantIds.length) {
    const body: ApiResponse = {
      data: null,
      error: "One or more items are unavailable.",
      status: 422,
    };
    return Response.json(body, { status: 422 });
  }

  // Map variants by id for quick lookup
  const variantMap = new Map(
    variants.map((v) => [v.id, v]),
  );

  // Check stock for each item using current stock view
  for (const item of input.items) {
    const variant = variantMap.get(item.variant_id);
    if (!variant) {
      return Response.json(
        { data: null, error: "Item not found.", status: 422 },
        { status: 422 },
      );
    }

    // Use current_stock view for accurate real-time stock
    const { data: stockData } = await admin
      .from("current_stock")
      .select("stock")
      .eq("variant_id", item.variant_id)
      .eq("tenant_id", tenantId)
      .single<{ stock: number }>();

    const currentStock = stockData?.stock ?? variant.stock;

    if (currentStock < item.quantity) {
      return Response.json(
        {
          data: null,
          error: `Insufficient stock for ${(variant.products as { name: string }).name} — ${variant.size}/${variant.color}. Only ${currentStock} left.`,
          status: 409,
        },
        { status: 409 },
      );
    }
  }

  // =============================================
  // CALCULATE TOTALS SERVER-SIDE
  // SECURITY: prices always from DB
  // =============================================
  let subtotal = 0;
  const orderItems = input.items.map((item) => {
    const variant = variantMap.get(item.variant_id)!;
    const product = variant.products as {
      id: string;
      name: string;
      slug: string;
      price: number;
    };
    const images = (variant as { product_images?: { url: string; position: number }[] })
      .product_images ?? [];
    const primaryImage = [...images].sort((a, b) => a.position - b.position)[0];
    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;

    return {
      tenant_id: tenantId,
      variant_id: item.variant_id,
      product_name: product.name,
      product_slug: product.slug,
      variant_size: variant.size,
      variant_color: variant.color,
      image_url: primaryImage?.url ?? null,
      unit_price: product.price,
      quantity: item.quantity,
      subtotal: lineTotal,
    };
  });

  const total = subtotal + SHIPPING_FEE;

  // =============================================
  // CREATE ORDER + ITEMS IN TRANSACTION
  // =============================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (admin as any)
    .from("orders")
    .insert({
      tenant_id: tenantId,
      customer_id: user?.id ?? null,
      customer_email: input.customer_email,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone ?? null,
      shipping_address: input.shipping_address,
      notes: input.notes ?? null,
      payment_method: input.payment_method,
      subtotal,
      shipping_fee: SHIPPING_FEE,
      total,
      status: "pending",
      payment_status: "unpaid",
    })
    .select()
    .single() as { data: Order | null; error: { message: string } | null };

  if (orderError || !order) {
    log.error(
      { requestId, event: "order.create.error" },
      orderError?.message ?? "unknown",
    );
    return Response.json(
      { data: null, error: "Failed to create order.", status: 500 },
      { status: 500 },
    );
  }

  // Insert order items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (admin as any)
    .from("order_items")
    .insert(
      orderItems.map((item) => ({ ...item, order_id: order.id })),
    ) as { error: { message: string } | null };

  if (itemsError) {
    log.error(
      { requestId, event: "order.items.create.error" },
      itemsError.message,
    );
    // Clean up orphaned order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("orders").delete().eq("id", order.id);
    return Response.json(
      { data: null, error: "Failed to create order.", status: 500 },
      { status: 500 },
    );
  }

  // Insert initial order event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("order_events").insert({
    order_id: order.id,
    tenant_id: tenantId,
    status: "pending",
    actor_type: "system",
    note: "Order placed.",
  });
  // Note: stock decrement is handled by the decrement_stock_on_confirm
  // DB trigger when order status transitions to "confirmed".

  // Clear cart if authenticated
  if (user?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId);
  }

  log.info(
    { requestId, event: "order.create.success", orderId: order.id },
    "Order created",
  );

  // Track usage metric — fire and forget
  trackOrder(tenantId, total)

  // Send confirmation email — fire and forget, never block the response
  sendOrderConfirmationEmail(order.id, tenantId).catch((err) =>
    log.error({ requestId, event: "order.email.error" }, String(err)),
  );

  const body: ApiResponse<{ orderId: string; total: number }> = {
    data: { orderId: order.id, total },
    error: null,
    status: 201,
  };
  return Response.json(body, { status: 201 });
}

export const POST = withRateLimit("api", handler);