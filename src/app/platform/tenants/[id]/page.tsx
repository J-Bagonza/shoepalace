import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(n);
}

export default async function TenantDetailPage({ params }: PageProps) {
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();

  const admin = createAdminSupabaseClient();

  const [tenantResult, metricsResult, ordersResult, productsResult] =
    await Promise.all([
      admin
        .from("tenants")
        .select("*")
        .eq("id", params.id)
        .single(),

      admin
        .from("tenant_usage_metrics")
        .select("*")
        .eq("tenant_id", params.id)
        .order("date", { ascending: false })
        .limit(30),

      admin
        .from("orders")
        .select("id, status, total, payment_status, created_at")
        .eq("tenant_id", params.id)
        .order("created_at", { ascending: false })
        .limit(10),

      admin
        .from("products")
        .select("id, name, slug, is_featured, deleted_at")
        .eq("tenant_id", params.id)
        .is("deleted_at", null)
        .limit(20),
    ]);

  if (!tenantResult.data) notFound();

  const tenant = tenantResult.data;
  const metrics = metricsResult.data ?? [];
  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];

  const totalRevenue = metrics.reduce(
    (acc: number, m: { revenue_kes?: number }) =>
      acc + (Number(m.revenue_kes) || 0),
    0,
  );
  const totalOrders = metrics.reduce(
    (acc: number, m: { orders_placed?: number }) =>
      acc + (Number(m.orders_placed) || 0),
    0,
  );
  const totalRequests = metrics.reduce(
    (acc: number, m: { api_requests?: number }) =>
      acc + (Number(m.api_requests) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <Link
            href="/platform/tenants"
            className="text-[10px] uppercase tracking-widest text-neutral-400
              hover:text-neutral-900 transition-colors mb-2 block"
          >
            ← All Stores
          </Link>
          <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
            {tenant.name}
          </h1>
          {/* FIX: restored missing opening `<a` tag */}
          <a
            href={`https://${tenant.slug}.shoepalace.store`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-400 hover:text-neutral-700
              transition-colors"
          >
            {tenant.slug}.shoepalace.store ↗
          </a>
        </div>
        <span className={`text-xs uppercase tracking-widest px-3 py-1.5
          border ${tenant.is_active
            ? "border-green-200 text-green-600 bg-green-50"
            : "border-red-200 text-red-500 bg-red-50"
          }`}>
          {tenant.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total API Requests (30d)",
            value: totalRequests.toLocaleString(),
          },
          { label: "Total Orders (30d)", value: totalOrders },
          { label: "Total Revenue (30d)", value: formatKES(totalRevenue) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-neutral-100 p-5
              flex flex-col gap-1"
          >
            <span className="font-bebas text-3xl tracking-wide
              text-neutral-900">
              {stat.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent orders */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400">
            Recent Orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-400">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-0 border border-neutral-100">
              {orders.map((order: {
                id: string;
                status: string;
                total: number;
                payment_status: string;
                created_at: string;
              }) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between
                    px-4 py-3 border-b border-neutral-50 last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-neutral-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(order.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600">
                      {formatKES(order.total)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest
                      ${order.status === "delivered"
                        ? "text-green-600"
                        : order.status === "cancelled"
                          ? "text-red-500"
                          : "text-neutral-500"
                      }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400">
            Products ({products.length})
          </h2>
          {products.length === 0 ? (
            <p className="text-sm text-neutral-400">No products yet.</p>
          ) : (
            <div className="flex flex-col gap-0 border border-neutral-100">
              {products.map((product: {
                id: string;
                name: string;
                slug: string;
                is_featured: boolean;
              }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between
                    px-4 py-3 border-b border-neutral-50 last:border-0"
                >
                  <span className="text-xs text-neutral-700 truncate
                    max-w-[200px]">
                    {product.name}
                  </span>
                  {product.is_featured && (
                    <span className="text-[10px] uppercase tracking-widest
                      text-neutral-400">
                      Featured
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily metrics table */}
      {metrics.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400">
            Daily Usage (last 30 days)
          </h2>
          <div className="bg-white border border-neutral-100 overflow-hidden
            overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Date", "API Requests", "Orders", "Revenue"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] uppercase
                        tracking-widest text-neutral-400 font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m: {
                  id: string;
                  date: string;
                  api_requests: number;
                  orders_placed: number;
                  revenue_kes: number;
                }) => (
                  <tr
                    key={m.id}
                    className="border-b border-neutral-50 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-xs text-neutral-600">
                      {new Date(m.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-600">
                      {m.api_requests.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-600">
                      {m.orders_placed}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-neutral-600">
                      {m.revenue_kes > 0 ? formatKES(m.revenue_kes) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}