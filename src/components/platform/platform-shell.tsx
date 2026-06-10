"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const NAV = [
  { href: "/platform", label: "Overview", number: "01" },
  { href: "/platform/tenants", label: "Stores", number: "02" },
  { href: "/platform/requests", label: "Requests", number: "03" },
  { href: "/platform/ads", label: "Ads", number: "04" },
  { href: "/", label: "Exit Platform", number: "05", isExit: true },
];

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "rgba(0,0,0,0.5)" }}
          />

          {/* Pills container — centered vertically, full width */}
          <motion.div
            key="pills"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-40 md:hidden flex flex-col items-center justify-center gap-3"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            {NAV.map((link, i) => {
              const isActive =
                !link.isExit &&
                (link.href === "/platform"
                  ? pathname === "/platform"
                  : pathname.startsWith(link.href));

              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.05, duration: 0.18 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={clsx(
                      "flex items-center justify-center",
                      "h-10 px-8 rounded-full",
                      "text-[11px] uppercase tracking-[0.14em] font-medium",
                      "transition-colors duration-150 whitespace-nowrap shadow-sm",
                      link.isExit
                        ? "bg-neutral-700 text-white/50 border border-white/10 hover:bg-neutral-600 hover:text-white/70"
                        : isActive
                        ? "bg-white text-neutral-900"
                        : "bg-neutral-800 text-white/70 border border-white/10 hover:bg-neutral-700 hover:text-white",
                    )}
                    style={{ minWidth: 160 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PlatformShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentPage =
    NAV.find((n) =>
      n.isExit
        ? false
        : n.href === "/platform"
        ? pathname === "/platform"
        : pathname.startsWith(n.href),
    )?.label ?? "Platform";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-neutral-900 text-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-14 flex items-center justify-between">

          {/* Left: brand + current page */}
          <div className="flex items-center gap-3">
            <span className="font-bebas text-xl tracking-widest">
              ShoePalace
            </span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-xs uppercase tracking-widest text-white/60 hidden sm:block">
              {currentPage}
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.filter((l) => !l.isExit).map((link) => {
              const isActive =
                link.href === "/platform"
                  ? pathname === "/platform"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "px-4 py-4 text-xs uppercase tracking-widest",
                    "transition-colors duration-150 border-b-2",
                    isActive
                      ? "text-white border-white"
                      : "text-white/50 border-transparent hover:text-white/80",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: exit (desktop) + hamburger/close (mobile) */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden md:block text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              Exit
            </Link>

            {/* Hamburger / X — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex md:hidden items-center justify-center w-8 h-8 -mr-1"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {menuOpen ? (
                  // X icon in red when menu is open
                  <motion.svg
                    key="x"
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.15 }}
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M2 2L16 16M16 2L2 16"
                      stroke="#E8001D"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                ) : (
                  <motion.div
                    key="burger"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-1.5"
                  >
                    <span className="block h-px w-5 bg-white" />
                    <span className="block h-px w-5 bg-white" />
                    <span className="block h-px w-3 bg-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — stacked pills */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}