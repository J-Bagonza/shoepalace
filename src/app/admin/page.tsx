import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getTenantId(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single<{ tenant_id: string }>();

  if (!profile) redirect("/login");
  return profile.tenant_id;
}

async function getStats(tenantId: string) {
  const admin = createAdminSupabaseClient();

  const [products, deletedProducts, orders, pendingOrders] =
    await Promise.all([
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .is("deleted_at", null),
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .not("deleted_at", "is", null),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "pending"),
    ]);

  return {
    activeProducts: products.count ?? 0,
    deletedProducts: deletedProducts.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const tenantId = await getTenantId();
  const stats = await getStats(tenantId);

  const STATS = [
    {
      label: "Active Products",
      value: stats.activeProducts,
      href: "/admin/products",
      color: "text-neutral-900",
    },
    {
      label: "Archived",
      value: stats.deletedProducts,
      href: "/admin/products?show_deleted=true",
      color: "text-neutral-400",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      href: "/admin/orders",
      color: "text-neutral-900",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      href: "/admin/orders?status=pending",
      color:
        stats.pendingOrders > 0 ? "text-yellow-600" : "text-neutral-400",
    },
  ];

  const ACTIONS = [
    {
      label: "Add Product",
      href: "/admin/products/new",
      primary: true,
    },
    { label: "View Products", href: "/admin/products", primary: false },
    { label: "View Orders", href: "/admin/orders", primary: false },
    { label: "Settings", href: "/admin/settings", primary: false },
    { label: "Advertise", href: "/admin/advertise", primary: false },
  ];

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-400">Manage your storefront.</p>
      </div>

      {/* Stats grid — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-1.5 border border-neutral-200
              bg-white p-4 md:p-6 hover:border-neutral-900
              transition-colors duration-200"
          >
            <span className={`font-bebas text-3xl md:text-4xl ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400 leading-tight">
              {stat.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[10px] uppercase tracking-widest text-neutral-400">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={clsx(
                "inline-flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3",
                "text-xs uppercase tracking-widest transition-colors duration-200",
                action.primary
                  ? "bg-neutral-900 text-white hover:bg-neutral-700"
                  : "border border-neutral-200 text-neutral-700 hover:border-neutral-900",
              )}
            >
              {action.label}
              {action.primary && <span>→</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// clsx is used in this file
import { clsx } from "clsx";