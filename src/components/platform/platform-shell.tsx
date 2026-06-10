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
];

function FloatingMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — very subtle, no heavy overlay */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{
              background:
                "linear-gradient(to left, rgba(0,0,0,0.15) 0%, transparent 60%)",
            }}
          />

          {/* Menu panel — slides in from right */}
          <motion.nav
            key="menu"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 35,
              opacity: { duration: 0.2 },
            }}
            className="fixed top-0 right-0 bottom-0 z-50 w-72
              flex flex-col justify-between px-8 py-10"
            style={{
              background: "transparent",
              // Frosted glass effect — looks premium on all backgrounds
              backdropFilter: "blur(0px)",
            }}
          >
            {/* Close button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="flex flex-col gap-1.5 p-1 group"
                aria-label="Close menu"
              >
                <motion.span
                  animate={{ rotate: 45, y: 6 }}
                  className="block h-px w-6 bg-neutral-900 origin-center"
                />
                <motion.span
                  animate={{ opacity: 0 }}
                  className="block h-px w-6 bg-neutral-900"
                />
                <motion.span
                  animate={{ rotate: -45, y: -6 }}
                  className="block h-px w-6 bg-neutral-900 origin-center"
                />
              </button>
            </div>

            {/* Nav links — large, spaced, floating feel */}
            <div className="flex flex-col gap-2">
              {NAV.map((link, i) => {
                const isActive =
                  link.href === "/platform"
                    ? pathname === "/platform"
                    : pathname.startsWith(link.href);

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.05 + i * 0.06,
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Link
                      href={link.href}
                      className={clsx(
                        "group flex items-baseline gap-4 py-3",
                        "transition-all duration-200",
                      )}
                    >
                      <span
                        className={clsx(
                          "text-[10px] font-mono transition-colors duration-200",
                          isActive
                            ? "text-neutral-400"
                            : "text-neutral-300 group-hover:text-neutral-400",
                        )}
                      >
                        {link.number}
                      </span>
                      <span
                        className={clsx(
                          "font-bebas tracking-wide transition-all duration-200",
                          isActive
                            ? "text-5xl text-neutral-900"
                            : "text-4xl text-neutral-400 group-hover:text-5xl group-hover:text-neutral-800",
                        )}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom — exit link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-4"
            >
              <div className="h-px bg-neutral-200" />
              <Link
                href="/"
                className="text-xs uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
              >
                ← Exit Platform
              </Link>
            </motion.div>
          </motion.nav>
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
      n.href === "/platform"
        ? pathname === "/platform"
        : pathname.startsWith(n.href),
    )?.label ?? "Platform";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-neutral-900 text-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 h-14 flex
          items-center justify-between">

          {/* Left: brand + current page */}
          <div className="flex items-center gap-3">
            <span className="font-bebas text-xl tracking-widest">
              ShoePalace
            </span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-xs uppercase tracking-widest
              text-white/60 hidden sm:block">
              {currentPage}
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((link) => {
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

          {/* Right: exit (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden md:block text-xs uppercase tracking-widest
                text-white/40 hover:text-white transition-colors"
            >
              Exit
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex md:hidden flex-col gap-1.5 p-1"
              aria-label="Open menu"
            >
              <span className="block h-px w-5 bg-white" />
              <span className="block h-px w-5 bg-white" />
              <span className="block h-px w-3 bg-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating mobile menu */}
      <FloatingMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}