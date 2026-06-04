import Link from "next/link";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";

export default async function OnboardingCompletePage() {
  const tenant = await getTenantFromHeaders();

  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <div className="flex flex-col gap-3">
        <div className="mx-auto h-16 w-16 bg-neutral-900 flex items-center
          justify-center">
          <span className="text-white text-2xl">✓</span>
        </div>
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Your Store is Live
        </h1>
        <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
          {tenant?.name ?? "Your store"} is set up and ready to take orders.
          Head to your dashboard to add more products and manage your store.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/admin"
          className="bg-neutral-900 text-white px-8 py-4 text-xs
            uppercase tracking-widest hover:bg-neutral-700 transition-colors
            text-center"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/products"
          target="_blank"
          className="border border-neutral-200 text-neutral-600 px-8 py-4
            text-xs uppercase tracking-widest hover:border-neutral-900
            transition-colors text-center"
        >
          View Your Store
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
        {[
          { label: "Add more products", href: "/admin/products/new" },
          { label: "Upload product images", href: "/admin/products" },
          { label: "Set up M-Pesa", href: "/admin/settings?tab=payment" },
          { label: "Edit contact page", href: "/admin/settings?tab=pages" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border border-neutral-100 p-3 text-xs text-neutral-600
              hover:border-neutral-900 hover:text-neutral-900 transition-colors"
          >
            {item.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}