import { fetchPlatformStats, fetchTenantRequests } from "@/lib/platform/fetch-platform-data";
import Link from "next/link";

export default async function PlatformOverviewPage() {
  const [stats, pendingRequests] = await Promise.all([
    fetchPlatformStats(),
    fetchTenantRequests("pending"),
  ]);

  const STAT_CARDS = [
    {
      label: "Total Stores",
      value: stats.total_tenants,
      color: "text-neutral-900",
    },
    {
      label: "Active Stores",
      value: stats.active_tenants,
      color: "text-green-600",
    },
    {
      label: "Pending Requests",
      value: stats.pending_requests,
      color: stats.pending_requests > 0 ? "text-yellow-600" : "text-neutral-400",
      href: "/platform/requests",
    },
    {
      label: "Total Orders",
      value: stats.total_orders,
      color: "text-neutral-900",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-5xl tracking-wide text-neutral-900">
          Platform Overview
        </h1>
        <p className="text-sm text-neutral-400">
          Manage all ShoePalace stores from here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-neutral-100 p-6
              flex flex-col gap-1"
          >
            <span className={`font-bebas text-4xl tracking-wide ${card.color}`}>
              {card.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              {card.label}
            </span>
            {card.href && card.value > 0 && (
              <Link
                href={card.href}
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
              {pendingRequests
                .slice(0, 3)
                .map((r) => r.store_name)
                .join(", ")}
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
    </div>
  );
}