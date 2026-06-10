import { fetchAllTenants } from "@/lib/platform/fetch-platform-data";
import Link from "next/link";
import type { Tenant } from "@/types/tenant";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PlatformTenantsPage() {
  const tenants = await fetchAllTenants();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
            All Stores
          </h1>
          <p className="text-sm text-neutral-400">
            {tenants.length} store{tenants.length !== 1 ? "s" : ""} on the platform
          </p>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {tenants.length === 0 ? (
          <div className="p-12 text-center border border-neutral-100">
            <p className="text-sm text-neutral-400 uppercase tracking-widest">
              No stores yet.
            </p>
          </div>
        ) : (
          tenants.map((tenant: Tenant) => (
            <div
              key={tenant.id}
              className="bg-white border border-neutral-100 p-4
                flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-neutral-900">
                    {tenant.name}
                  </span>
                  <a
                    href={`https://${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-400 hover:text-neutral-900
                      transition-colors underline underline-offset-2"
                  >
                    {tenant.slug}.shoepalace.store
                  </a>
                </div>
                <span className={`text-[10px] uppercase tracking-widest ${
                  tenant.is_active ? "text-green-600" : "text-red-500"
                }`}>
                  {tenant.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2
                border-t border-neutral-50">
                <span className="text-[10px] text-neutral-400">
                  {formatDate(tenant.created_at)}
                </span>
                <Link
                  href={`/platform/tenants/${tenant.id}`}
                  className="text-[10px] uppercase tracking-widest
                    text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Manage →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-neutral-100
        overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              {["Store", "Subdomain", "Status", "Created", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[10px] uppercase
                    tracking-widest text-neutral-400 font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant: Tenant) => (
              <tr
                key={tenant.id}
                className="border-b border-neutral-50 last:border-0
                  hover:bg-neutral-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-neutral-900">
                      {tenant.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {tenant.id.slice(0, 8)}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <a
                    href={`https://${tenant.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-900
                      transition-colors underline underline-offset-2"
                  >
                    {tenant.slug}.shoepalace.store
                  </a>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] uppercase tracking-widest ${
                    tenant.is_active ? "text-green-600" : "text-red-500"
                  }`}>
                    {tenant.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-neutral-400">
                  {formatDate(tenant.created_at)}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/platform/tenants/${tenant.id}`}
                    className="text-[10px] uppercase tracking-widest
                      text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-400 uppercase tracking-widest">
              No stores yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}