"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const NAV_GROUPS = [
  {
    label: "Store",
    links: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/orders", label: "Orders" },
    ],
  },
  {
    label: "Manage",
    links: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/advertise", label: "Advertise" },
      { href: "/admin/logs", label: "Audit Logs" },
    ],
  },
];

function NavLink({
  href,
  label,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 text-xs uppercase",
        "tracking-widest transition-colors duration-150 rounded-sm",
        isActive
          ? "bg-neutral-900 text-white"
          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
      )}
    >
      {label}
    </Link>
  );
}

function Sidebar({
  email,
  onClose,
}: {
  email: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-neutral-100">
        <Link
          href="/admin"
          onClick={onClose}
          className="font-bebas text-xl tracking-wider text-neutral-900
            hover:text-[#E8001D] transition-colors"
        >
          ShoePalace
        </Link>
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest
          mt-0.5">
          Admin Dashboard
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-300
              px-3 mb-1">
              {group.label}
            </p>
            {group.links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                exact={link.exact}
                onClick={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-neutral-100">
        <p className="text-[10px] text-neutral-400 truncate mb-3">
          {email}
        </p>
        <Link
          href="/"
          onClick={onClose}
          className="text-[10px] uppercase tracking-widest text-neutral-400
            hover:text-neutral-900 transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.links).find((l) =>
      l.exact ? pathname === l.href : pathname.startsWith(l.href),
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-neutral-50 flex">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0
        bg-white border-r border-neutral-100 sticky top-0 h-screen">
        <Sidebar email={email} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-neutral-100
          sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              {/* Hamburger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col gap-1.5 p-1 -ml-1"
                aria-label="Open menu"
              >
                <span className="block h-px w-5 bg-neutral-900" />
                <span className="block h-px w-5 bg-neutral-900" />
                <span className="block h-px w-3.5 bg-neutral-900" />
              </button>
              <span className="text-xs uppercase tracking-widest
                text-neutral-500">
                {currentLabel}
              </span>
            </div>

            <Link
              href="/admin"
              className="font-bebas text-lg tracking-wider text-neutral-900"
            >
              ShoePalace
            </Link>
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex bg-white border-b border-neutral-100
          sticky top-0 z-20">
          <div className="w-full px-8 h-14 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              {currentLabel}
            </p>
            <p className="text-[10px] text-neutral-400 truncate max-w-xs">
              {email}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            />

            {/* Drawer — slides from left */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 35,
              }}
              className="fixed top-0 left-0 bottom-0 z-40 w-64 bg-white
                shadow-xl lg:hidden"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 p-1"
                aria-label="Close menu"
              >
                <div className="flex flex-col gap-1.5">
                  <motion.span
                    animate={{ rotate: 45, y: 6 }}
                    className="block h-px w-5 bg-neutral-900 origin-center"
                  />
                  <motion.span
                    animate={{ opacity: 0 }}
                    className="block h-px w-5 bg-neutral-900"
                  />
                  <motion.span
                    animate={{ rotate: -45, y: -6 }}
                    className="block h-px w-5 bg-neutral-900 origin-center"
                  />
                </div>
              </button>

              <Sidebar
                email={email}
                onClose={() => setDrawerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}