import { requirePlatformAdmin } from "@/lib/platform/require-platform-admin";
import Link from "next/link";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  const NAV = [
    { href: "/platform", label: "Overview" },
    { href: "/platform/tenants", label: "Stores" },
    { href: "/platform/requests", label: "Requests" },
    { href: "/platform/ads", label: "Ads" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          {/* Top bar */}
          <div className="h-14 flex items-center justify-between">
            <span className="font-bebas text-xl tracking-widest">
              ShoePalace Platform
            </span>
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-white/40
                hover:text-white transition-colors"
            >
              Exit
            </Link>
          </div>
          {/* Nav — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto
            no-scrollbar pb-0 -mb-px">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-widest text-white/60
                  hover:text-white transition-colors whitespace-nowrap
                  px-3 py-3 shrink-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}