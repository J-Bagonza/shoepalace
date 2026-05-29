import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getStats() {
  const admin = createAdminSupabaseClient();

  const [products, deletedProducts, auditLogs] = await Promise.all([
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null),
    admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    activeProducts: products.count ?? 0,
    deletedProducts: deletedProducts.count ?? 0,
    auditEvents: auditLogs.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const STATS = [
    {
      label: "Active Products",
      value: stats.activeProducts,
      href: "/admin/products",
    },
    {
      label: "Archived Products",
      value: stats.deletedProducts,
      href: "/admin/products?show_deleted=true",
    },
    {
      label: "Audit Events",
      value: stats.auditEvents,
      href: "/admin/logs",
    },
  ];

  const ACTIONS = [
    { label: "Add New Product", href: "/admin/products/new" },
    { label: "View All Products", href: "/admin/products" },
    { label: "View Audit Logs", href: "/admin/logs" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-400">
          Manage your ShoePalace storefront.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-1 border border-neutral-200 bg-white
              p-6 hover:border-neutral-900 transition-colors duration-200"
          >
            <span className="font-bebas text-4xl text-neutral-900">
              {stat.value}
            </span>
            <span className="text-xs uppercase tracking-widest
              text-neutral-400">
              {stat.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-2 border border-neutral-200
                px-5 py-3 text-xs uppercase tracking-widest text-neutral-700
                hover:border-neutral-900 hover:text-neutral-900
                transition-colors duration-200"
            >
              {action.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}