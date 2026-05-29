"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useCartItemCount } from "@/store/cart";
import { useCartControls } from "@/store/ui";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?category=running", label: "Running" },
  { href: "/products?category=lifestyle", label: "Lifestyle" },
  { href: "/products?category=hiking", label: "Hiking" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { openCart } = useCartControls();
  const itemCount = useCartItemCount();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();

  // Navbar background opacity on scroll
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (y) => {
      setScrolled(y > 20);
    });
    return unsubscribe;
  }, [scrollY]);

  // Auth state
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <motion.header
        className={clsx(
          "fixed top-0 left-0 right-0 z-30 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-neutral-100"
            : "bg-transparent",
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          className="mx-auto flex h-[72px] max-w-7xl items-center
            justify-between px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="font-bebas text-2xl tracking-wider text-neutral-900
              hover:text-[#E8001D] transition-colors duration-200"
          >
            ShoePalace
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-8" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    "text-xs uppercase tracking-widest transition-colors duration-200",
                    pathname === link.href
                      ? "text-neutral-900"
                      : "text-neutral-400 hover:text-neutral-900",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            {/* Auth */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={handleSignOut}
                  className="text-xs uppercase tracking-widest text-neutral-400
                    hover:text-neutral-900 transition-colors duration-200"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-xs uppercase tracking-widest text-neutral-400
                    hover:text-neutral-900 transition-colors duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 text-xs uppercase
                tracking-widest text-neutral-900 hover:text-[#E8001D]
                transition-colors duration-200"
              aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
            >
              <span>Cart</span>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex h-4 w-4 items-center justify-center
                    bg-[#E8001D] text-white text-[10px]"
                >
                  {itemCount > 99 ? "99" : itemCount}
                </motion.span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex md:hidden flex-col gap-1.5 p-1"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="block h-px w-5 bg-neutral-900 origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block h-px w-5 bg-neutral-900"
              />
              <motion.span
                animate={
                  menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }
                }
                className="block h-px w-5 bg-neutral-900 origin-center"
              />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={menuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          "fixed top-[72px] left-0 right-0 z-20 bg-white border-b",
          "border-neutral-100 px-6 py-6 md:hidden",
          !menuOpen && "pointer-events-none",
        )}
      >
        <ul className="flex flex-col gap-5" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm uppercase tracking-widest text-neutral-700
                  hover:text-[#E8001D] transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="pt-2 border-t border-neutral-100">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="text-sm uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </motion.div>
    </>
  );
}