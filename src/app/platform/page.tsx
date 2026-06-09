import { fetchPlatformHealth } from "@/lib/platform/fetch-platform-metrics";
import { fetchTenantRequests } from "@/lib/platform/fetch-platform-data";
import Link from "next/link";

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PlatformOverviewPage() {
  const [health, pendingRequests] = await Promise.all([
    fetchPlatformHealth(),
    fetchTenantRequests("pending"),
  ]);

  const PLATFORM_STATS = [
    {
      label: "Total Stores",
      value: health.total_tenants,
      sub: `${health.active_tenants} active`,
      color: "text-neutral-900",
    },
    {
      label: "Pending Requests",
      value: health.pending_requests,
      sub: "awaiting review",
      color: health.pending_requests > 0
        ? "text-yellow-600"
        : "text-neutral-400",
      href: "/platform/requests",
    },
    {
      label: "Orders Today",
      value: health.today_total_orders,
      sub: formatKES(health.today_total_revenue),
      color: "text-neutral-900",
    },
    {
      label: "Orders This Week",
      value: health.week_total_orders,
      sub: formatKES(health.week_total_revenue),
      color: "text-neutral-900",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-5xl tracking-wide text-neutral-900">
          Platform Overview
        </h1>
        <p className="text-sm text-neutral-400">
          Real-time health across all stores.
        </p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORM_STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-neutral-100 p-6
              flex flex-col gap-1"
          >
            <span className={`font-bebas text-4xl tracking-wide ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              {stat.label}
            </span>
            <span className="text-xs text-neutral-400">{stat.sub}</span>
            {stat.href && stat.value > 0 && (
              <Link
                href={stat.href}
                className="text-[10px] uppercase tracking-widest
                  text-neutral-500 hover:text-neutral-900 transition-colors
                  underline underline-offset-2 mt-1"
              >
                Review →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Pending requests alert */}
      {pendingRequests.length > 0 && (
        <div className="border border-yellow-200 bg-yellow-50 p-5
          flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-yellow-800">
              {pendingRequests.length} store request
              {pendingRequests.length !== 1 ? "s" : ""} awaiting review
            </p>
            <p className="text-xs text-yellow-700">
              {pendingRequests.slice(0, 3).map((r) => r.store_name).join(", ")}
              {pendingRequests.length > 3
                ? ` and ${pendingRequests.length - 3} more`
                : ""}
            </p>
          </div>
          <Link
            href="/platform/requests"
            className="shrink-0 bg-yellow-800 text-white px-4 py-2 text-xs
              uppercase tracking-widest hover:bg-yellow-900 transition-colors"
          >
            Review
          </Link>
        </div>
      )}

      {/* Per-tenant health table */}
      <div className="flex flex-col gap-4">
        <h2 className="font-bebas text-2xl tracking-wide text-neutral-900">
          Store Health
        </h2>

        <div className="bg-white border border-neutral-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {[
                  "Store",
                  "Status",
                  "Products",
                  "Orders",
                  "Today Requests",
                  "Today Orders",
                  "Today Revenue",
                  "Week Revenue",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase
                      tracking-widest text-neutral-400 font-normal
                      whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {health.tenants.map((tenant) => (
                <tr
                  key={tenant.tenant_id}
                  className="border-b border-neutral-50 last:border-0
                    hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-neutral-900">
                        {tenant.tenant_name}
                      </span>
                      {/* FIX: restored missing opening `<a` tag */}
                      <a
                        href={`https://${tenant.tenant_slug}.shoepalace.store`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-neutral-400
                          hover:text-neutral-700 transition-colors"
                      >
                        {tenant.tenant_slug}.shoepalace.store
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-widest
                      ${tenant.is_active ? "text-green-600" : "text-red-500"}`}>
                      {tenant.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.total_products}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.total_orders}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.today_requests.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.today_orders}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.today_revenue > 0
                      ? formatKES(tenant.today_revenue)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {tenant.week_revenue > 0
                      ? formatKES(tenant.week_revenue)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/platform/tenants/${tenant.tenant_id}`}
                      className="text-[10px] uppercase tracking-widest
                        text-neutral-400 hover:text-neutral-900
                        transition-colors"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}