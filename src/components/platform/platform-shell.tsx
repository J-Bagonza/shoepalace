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

/* ─────────────────────────────────────────────
   Bottom-sheet mobile menu
   • Slides up from bottom, half-screen height
   • Rounded top-left / top-right corners
   • Dark bg + subtle red grid overlay
   • Numbered pill nav links
───────────────────────────────────────────── */
function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
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
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "rgba(0,0,0,0.6)" }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            className="fixed bottom-0 inset-x-0 z-40 md:hidden"
            style={{ height: "52vh", minHeight: 320 }}
          >
            {/* Sheet surface — dark */}
            <div
              className="relative w-full h-full overflow-hidden"
              style={{ borderRadius: "18px 18px 0 0", background: "#171717" }}
            >
              {/* Red grid SVG overlay */}
              <svg
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="platform-grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="#E8001D"
                      strokeWidth="0.45"
                      opacity="0.22"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#platform-grid)" />
              </svg>

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 relative">
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
              </div>

              {/* Nav links */}
              <div className="relative px-5 pt-3 flex flex-col gap-2.5 pb-4">
                {NAV.filter((l) => !l.isExit).map((link, i) => {
                  const isActive =
                    link.href === "/platform"
                      ? pathname === "/platform"
                      : pathname.startsWith(link.href);

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.18 }}
                    >
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={clsx(
                          "flex items-center gap-3 h-11 px-5 rounded-full",
                          "text-[11px] uppercase tracking-[0.13em] font-medium",
                          "transition-colors duration-150",
                          isActive
                            ? "bg-white text-neutral-900"
                            : "bg-transparent text-white/60 border border-white/10 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <span
                          className={clsx(
                            "text-[10px] tabular-nums",
                            isActive ? "text-neutral-400" : "text-white/25",
                          )}
                        >
                          {link.number}
                        </span>
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.07)",
                    margin: "2px 0",
                  }}
                />

                {/* Exit */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.18 }}
                >
                  <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 h-11 px-5 rounded-full
                      text-[11px] uppercase tracking-[0.13em] font-medium
                      bg-transparent text-white/25 border border-white/07
                      hover:text-white/50 transition-colors duration-150"
                  >
                    <span className="text-[10px] tabular-nums text-white/15">05</span>
                    Exit Platform
                  </Link>
                </motion.div>
              </div>
            </div>
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

      {/* Mobile menu — bottom sheet */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-10">
        {children}
      </main>
    </div>
  );
}