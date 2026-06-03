import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchCustomerOrders } from "@/lib/orders/fetch-order";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/utils/product";
import type { OrderStatus } from "@/types/order";

export const metadata: Metadata = { title: "My Orders" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orders = await fetchCustomerOrders();

  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-12">
        <Container size="lg">
          <h1 className="font-bebas text-display-md text-neutral-900
            leading-none">
            My Orders
          </h1>
        </Container>
      </div>

      <Container size="lg" className="py-12">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <p className="text-sm text-neutral-400 uppercase tracking-widest">
              No orders yet.
            </p>
            <Link
              href="/products"
              className="text-xs uppercase tracking-widest text-neutral-900
                underline underline-offset-4 hover:text-[#E8001D]
                transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between border
                  border-neutral-100 p-5 hover:border-neutral-300
                  transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-mono text-neutral-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm font-medium text-neutral-900
                    group-hover:text-[#E8001D] transition-colors">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={order.status as OrderStatus} />
                  <span className="text-neutral-300 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}