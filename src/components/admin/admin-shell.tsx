"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  isBack?: boolean;
};

const NAV_GROUPS: { label: string; links: NavItem[] }[] = [
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

// Flat nav links for the radial menu, with "Back to Store" appended as the 7th pill
const ALL_NAV_LINKS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.links),
  { href: "/", label: "Back to Store", isBack: true },
];

// Keep angles strictly between -90° and +90° so cos is always positive,
// meaning every pill has a positive (leftward) x offset from the right-edge anchor.
function getArcPositions(count: number) {
  const startAngle = -75;
  const endAngle = 75;
  const radius = 165;

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
      <div className="px-4 py-5 border-b border-neutral-100">
        <Link
          href="/admin"
          onClick={onClose}
          className="font-bebas text-xl tracking-wider text-neutral-900
            hover:text-[#E8001D] transition-colors"
        >
          ShoePalace
        </Link>
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
          Admin Dashboard
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-300 px-3 mb-1">
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

      <div className="px-4 py-4 border-t border-neutral-100">
        <p className="text-[10px] text-neutral-400 truncate mb-3">{email}</p>
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

// Radial arc mobile menu — pills fan out from the right edge
function RadialMenu({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
}) {
  const pathname = usePathname();
  const positions = getArcPositions(ALL_NAV_LINKS.length);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll
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
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: "rgba(0,0,0,0.18)" }}
          />

          {/* Invisible anchor pinned to right-center of screen.
              All pills are positioned relative to this. */}
          <div
            className="fixed right-0 z-40 lg:hidden pointer-events-none"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
            }}
          >
            {ALL_NAV_LINKS.map((link, i) => {
              const { x, y } = positions[i] ?? { x: 0, y: 0 };
              const isActive =
                !link.isBack &&
                (link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href));

              return (
                <motion.div
                  key={link.href + i}
                  initial={{ x: 120, y, opacity: 0, scale: 0.7 }}
                  animate={{ x, y, opacity: 1, scale: 1 }}
                  exit={{ x: 120, y, opacity: 0, scale: 0.7 }}
                  transition={{
                    type: "spring",
                    stiffness: 320,
                    damping: 28,
                    delay: i * 0.055,
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
                      "transition-colors duration-150 whitespace-nowrap",
                      "shadow-sm",
                      link.isBack
                        ? "bg-neutral-100 text-neutral-500 border border-neutral-200 hover:border-neutral-400 hover:text-neutral-700"
                        : isActive
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900",
                    )}
                    style={{ minWidth: 110 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Email footer — bottom-right */}
          <motion.div
            key="footer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.25, duration: 0.2 }}
            className="fixed bottom-6 right-4 z-40 lg:hidden"
          >
            <p className="text-[10px] text-neutral-400 tracking-widest truncate max-w-[180px]">
              {email}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.links).find((l) =>
      l.exact ? pathname === l.href : pathname.startsWith(l.href),
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-neutral-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0
        bg-white border-r border-neutral-100 sticky top-0 h-screen">
        <Sidebar email={email} />
      </aside>

      {/* Main area */}
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
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                {currentLabel}
              </span>
            </div>

            <Link
              href="/admin"
              className="font-bebas text-lg tracking-wider text-neutral-900"
            >
              ShoePalace
            </Link>

            {/* Close X visible when menu is open */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.button
                  key="close-x"
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -45 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="absolute right-4 top-3.5 z-50
                    flex items-center justify-center w-8 h-8
                    text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
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
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>

      {/* Radial arc mobile menu */}
      <RadialMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        email={email}
      />
    </div>
  );
}