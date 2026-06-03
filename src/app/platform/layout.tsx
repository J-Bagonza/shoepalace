import { requirePlatformAdmin } from "@/lib/platform/require-platform-admin";
import Link from "next/link";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Platform header */}
      <header className="bg-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-14 flex
          items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="font-bebas text-xl tracking-widest">
              ShoePalace Platform
            </span>
            <nav className="flex items-center gap-6">
              {[
                { href: "/platform", label: "Overview" },
                { href: "/platform/tenants", label: "Stores" },
                { href: "/platform/requests", label: "Requests" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs uppercase tracking-widest text-white/60
                    hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-white/40
              hover:text-white transition-colors"
          >
            Exit Platform
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}