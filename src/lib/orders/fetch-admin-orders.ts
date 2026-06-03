import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Order } from "@/types/order";

export async function fetchAdminOrderById(id: string): Promise<Order | null> {
  const admin = createAdminSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        product:products ( id, name, images ),
        variant:product_variants ( id, size, color )
      ),
      customer:profiles ( id, full_name, email )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Order;
}