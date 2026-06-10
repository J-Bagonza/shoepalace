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

const ALL_NAV_LINKS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.links),
  { href: "/", label: "Back to Store", isBack: true },
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

/* ─────────────────────────────────────────────
   Bottom-sheet mobile menu
   • Slides up from bottom, half-screen height
   • Rounded top-left / top-right corners
   • White bg + subtle red grid overlay
   • Section labels + pill nav links
───────────────────────────────────────────── */
function MobileMenu({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
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
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: "rgba(0,0,0,0.45)" }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.9 }}
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
            style={{ height: "52vh", minHeight: 340 }}
          >
            {/* Sheet surface */}
            <div
              className="relative w-full h-full overflow-hidden"
              style={{ borderRadius: "18px 18px 0 0", background: "#fff" }}
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
                    id="admin-grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="#E8001D"
                      strokeWidth="0.45"
                      opacity="0.15"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#admin-grid)" />
              </svg>

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 relative">
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: "#e0e0e0",
                  }}
                />
              </div>

              {/* Scrollable content */}
              <div className="relative h-full overflow-y-auto pb-6">
                {NAV_GROUPS.map((group, gi) => (
                  <div key={group.label} className={gi === 0 ? "pt-2 px-5" : "pt-1 px-5"}>
                    <p
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "#bbb",
                        marginBottom: 6,
                        paddingLeft: 4,
                      }}
                    >
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      {group.links.map((link, i) => {
                        const isActive = link.exact
                          ? pathname === link.href
                          : pathname.startsWith(link.href);
                        return (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gi * 0.06 + i * 0.04, duration: 0.18 }}
                          >
                            <Link
                              href={link.href}
                              onClick={onClose}
                              className={clsx(
                                "flex items-center justify-center h-10 rounded-full",
                                "text-[11px] uppercase tracking-[0.13em] font-medium",
                                "transition-colors duration-150",
                                isActive
                                  ? "bg-neutral-900 text-white"
                                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-800 hover:text-neutral-900",
                              )}
                            >
                              {link.label}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Back to Store */}
                <div className="px-5 pt-1 pb-2">
                  <div
                    style={{
                      height: 1,
                      background: "rgba(0,0,0,0.06)",
                      marginBottom: 12,
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.18 }}
                  >
                    <Link
                      href="/"
                      onClick={onClose}
                      className="flex items-center justify-center h-10 rounded-full
                        text-[11px] uppercase tracking-[0.13em] font-medium
                        bg-red-50 text-[#E8001D] border border-red-100
                        hover:bg-red-100 transition-colors duration-150"
                    >
                      ← Back to Store
                    </Link>
                  </motion.div>
                  <p className="text-center text-[10px] text-neutral-300 tracking-widest mt-3 truncate">
                    {email}
                  </p>
                </div>
              </div>
            </div>
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
        <header className="lg:hidden bg-white border-b border-neutral-100 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                className="flex items-center justify-center w-8 h-8 -ml-1"
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
              >
                <AnimatePresence mode="wait">
                  {drawerOpen ? (
                    <motion.svg
                      key="x"
                      initial={{ opacity: 0, rotate: -45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.15 }}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M1 1L15 15M15 1L1 15"
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
                      <span className="block h-px w-5 bg-neutral-900" />
                      <span className="block h-px w-5 bg-neutral-900" />
                      <span className="block h-px w-3.5 bg-neutral-900" />
                    </motion.div>
                  )}
                </AnimatePresence>
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

            <div className="w-8" />
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex bg-white border-b border-neutral-100 sticky top-0 z-20">
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

      {/* Mobile menu — bottom sheet */}
      <MobileMenu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        email={email}
      />
    </div>
  );
}