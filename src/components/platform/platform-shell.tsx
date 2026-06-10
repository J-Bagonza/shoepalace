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

function getArcPositions(count: number) {
  const startAngle = -110;
  const endAngle = 110;
  const radius = 150;

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angleDeg = startAngle + t * (endAngle - startAngle);
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius,
    };
  });
}

function RadialMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const positions = getArcPositions(NAV.length);

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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: "rgba(0,0,0,0.22)" }}
          />

          {/* Anchor pinned to right-center */}
          <div
            className="fixed right-0 z-40 md:hidden pointer-events-none"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
            }}
          >
            {NAV.map((link, i) => {
              const { x, y } = positions[i] ?? { x: 0, y: 0 };
              const isActive =
                link.href === "/platform"
                  ? pathname === "/platform"
                  : pathname.startsWith(link.href);

              return (
                <motion.div
                  key={link.href}
                  initial={{ x: 120, y, opacity: 0, scale: 0.7 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ x: 120, y, opacity: 0, scale: 0.7 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 28,
                    delay: i * 0.06,
                    opacity: { duration: 0.18 },
                  }}
                  style={{
                    position: "absolute",
                    left: -60,
                    top: -18,
                    pointerEvents: "auto",
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={clsx(
                      "flex items-center justify-center",
                      "h-9 px-5 rounded-full",
                      "text-[10px] uppercase tracking-[0.12em] font-medium",
                      "transition-colors duration-150 whitespace-nowrap shadow-sm",
                      isActive
                        ? "bg-white text-neutral-900"
                        : "bg-neutral-800 text-white/70 border border-white/10 hover:bg-neutral-700 hover:text-white",
                    )}
                    style={{ minWidth: 110 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Exit link — bottom right */}
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.28, duration: 0.2 }}
            className="fixed bottom-6 right-4 z-40 md:hidden"
          >
            <Link
              href="/"
              onClick={onClose}
              className="text-[10px] uppercase tracking-widest text-white/50
                hover:text-white transition-colors"
            >
              ← Exit Platform
            </Link>
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

          {/* Right: exit (desktop) + hamburger/close (mobile) */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden md:block text-xs uppercase tracking-widest
                text-white/40 hover:text-white transition-colors"
            >
              Exit
            </Link>

            {/* Hamburger / X — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex md:hidden flex-col gap-1.5 p-1"
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
                    width="18" height="18" viewBox="0 0 18 18" fill="none"
                  >
                    <path d="M2 2L16 16M16 2L2 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
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

      {/* Radial arc mobile menu */}
      <RadialMenu
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