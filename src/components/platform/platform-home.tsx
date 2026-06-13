"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { formatPrice } from "@/utils/product";
import { createClient } from "@/lib/supabase/client";
import type { StoreWithProducts } from "@/lib/platform/fetch-stores-directory";

interface PlatformHomeProps {
  stores: StoreWithProducts[];
}

// ─── Auth state hook for platform page ───────────────────────────
type PlatformAuthState = "loading" | "unauthenticated" | "user" | "platform_admin";

function usePlatformAuth() {
  const [state, setState] = useState<PlatformAuthState>("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch("/api/auth/platform-me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store",
            "Pragma": "no-cache",
          },
        });

        if (cancelled) return;

        if (!res.ok) {
          setState("unauthenticated");
          setEmail("");
          return;
        }

        const json = await res.json() as {
          data: { role: string; email: string } | null;
        };

        if (cancelled) return;

        if (!json.data) {
          setState("unauthenticated");
          return;
        }

        setEmail(json.data.email);

        if (json.data.role === "platform_admin") {
          setState("platform_admin");
        } else {
          setState("user");
        }
      } catch {
        if (!cancelled) setState("unauthenticated");
      }
    }

    void resolve();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          if (!cancelled) {
            setState("unauthenticated");
            setEmail("");
          }
        } else {
          void resolve();
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue even if request fails
    }
    setState("unauthenticated");
    setEmail("");
    window.location.href = "/";
  }

  return { state, email, signOut };
}

// ─── Platform Navbar ─────────────────────────────────────────────
function PlatformNavbar({ stores }: { stores: StoreWithProducts[] }) {
  const { state, email, signOut } = usePlatformAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/#shops", label: "Shops" },
    { href: "/#how-it-works", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-100">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8 h-[56px] flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="font-bebas text-2xl tracking-wider text-neutral-900 hover:text-[#E8001D] transition-colors"
        >
          ShoePalace
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-4">

          {state === "loading" && (
            <div className="h-4 w-16 bg-neutral-100 animate-pulse rounded" />
          )}

          {state === "unauthenticated" && (
            <Link
              href="/login"
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </Link>
          )}

          {state === "platform_admin" && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-900 hover:text-[#E8001D] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:block">Platform</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-neutral-100 shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400">Signed in as</p>
                      <p className="text-xs text-neutral-700 truncate mt-0.5">{email}</p>
                      <span className="inline-flex items-center gap-1 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-green-600 uppercase tracking-widest">Platform Admin</span>
                      </span>
                    </div>
                    <div className="py-1">
                      <Link href="/platform" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>Platform Dashboard</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                      <Link href="/platform/requests" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>Store Requests</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                      <Link href="/platform/tenants" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                        <span>All Stores</span>
                        <span className="ml-auto text-neutral-300">→</span>
                      </Link>
                    </div>
                    <div className="border-t border-neutral-100 py-1">
                      <button
                        onClick={() => { setMenuOpen(false); void signOut(); }}
                        className="w-full flex items-center px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              )}
            </div>
          )}

          {state === "user" && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                aria-label="Account menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-100 shadow-lg z-50"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-xs text-neutral-600 truncate">{email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setMenuOpen(false); void signOut(); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              )}
            </div>
          )}

          <Link
            href="/register-store"
            className="bg-neutral-900 text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-[#E8001D] transition-colors hidden sm:block"
          >
            Open a Store
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex md:hidden flex-col gap-1.5 p-1"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block h-px w-5 bg-neutral-900 origin-center" />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="block h-px w-5 bg-neutral-900" />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block h-px w-5 bg-neutral-900 origin-center" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b border-neutral-100 px-6 py-6"
          >
            <ul className="flex flex-col gap-5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
              {state === "platform_admin" && (
                <>
                  <li><Link href="/platform" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">Platform Dashboard</Link></li>
                  <li><Link href="/platform/requests" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">Store Requests</Link></li>
                  <li><Link href="/platform/tenants" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">All Stores</Link></li>
                </>
              )}
              <li>
                <Link href="/register-store" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-widest text-neutral-700 hover:text-[#E8001D] transition-colors">
                  Open a Store
                </Link>
              </li>
              <li className="pt-2 border-t border-neutral-100">
                {state === "unauthenticated" && (
                  <Link href="/login" className="text-sm uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">Sign In</Link>
                )}
                {(state === "user" || state === "platform_admin") && (
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest truncate">{email}</span>
                    <button onClick={() => { setMobileOpen(false); void signOut(); }} className="text-sm uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors text-left">Sign Out</button>
                  </div>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Product Carousel ─────────────────────────────────────────────
function ProductCarousel({
  products,
  storeSlug,
  currency,
}: {
  products: StoreWithProducts["products"];
  storeSlug: string;
  currency: string;
}) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-[#F5F0E8]">
        <p className="text-xs uppercase tracking-widest text-neutral-400">No products yet</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: products.length * 3,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{ width: "max-content" }}
      >
        {[...products, ...products].map((product, i) => (
          <a
            key={`${product.id}-${i}`}
            href={`https://${storeSlug}.${rootDomain}/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-36 group"
          >
            <div className="relative aspect-square bg-white overflow-hidden mb-2 border border-neutral-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="144px"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#F5F0E8]" />
              )}
            </div>
            <p className="text-[11px] font-medium text-neutral-900 truncate">{product.name}</p>
            <p className="text-[11px] text-neutral-500">{formatPrice(product.price, currency)}</p>
          </a>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Store Card ───────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreWithProducts }) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const storeUrl = `https://${store.tenant.slug}.${rootDomain}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={clsx(
        "border bg-white overflow-hidden transition-all",
        store.is_featured ? "border-neutral-900 shadow-sm" : "border-neutral-100",
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          {store.tenant.logo_url ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-sm bg-white border border-neutral-100">
              <Image src={store.tenant.logo_url} alt={store.tenant.name} fill sizes="32px" className="object-contain p-0.5" />
            </div>
          ) : (
            <div className="h-8 w-8 bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold uppercase">{store.tenant.name.charAt(0)}</span>
            </div>
          )}
          <div className="flex flex-col gap-0">
            <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-neutral-900 hover:text-[#E8001D] transition-colors leading-tight">
              {store.tenant.name}
            </a>
            <span className="text-[10px] text-neutral-400">{store.tenant.slug}.shoepalace.store</span>
          </div>
        </div>
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">
          Visit →
        </a>
        {store.is_featured && (
          <span className="text-[10px] uppercase tracking-widest text-[#E8001D] border border-[#E8001D] px-2 py-0.5 shrink-0">
            Featured
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <ProductCarousel products={store.products} storeSlug={store.tenant.slug} currency={store.currency} />
      </div>
    </motion.div>
  );
}


// ─── Main Platform Page ───────────────────────────────────────────
export function PlatformHomePage({ stores }: PlatformHomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <PlatformNavbar stores={stores} />

      {/* ── Hero ── */}
      <section className="pt-[56px] min-h-[58vh] flex items-center bg-[#0A0A0A] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            src="https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/object/public/product-images/platform/2026_0611_171536.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0.85 }}
          />
          <div className="absolute inset-0 bg-[#0A0A0A]/10" />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, #0A0A0A 0%, #0A0A0A 22%, rgba(10,10,10,0.35) 50%, rgba(10,10,10,0.05) 100%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{ background: "linear-gradient(to top, #0A0A0A, transparent)" }}
          />
        </div>

        <div className="absolute inset-0 z-[1] pointer-events-none select-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute font-bebas text-[48px] sm:text-[80px] md:text-[120px] font-black uppercase tracking-tighter"
              style={{
                left: `${(i % 5) * 25}%`,
                top: `${Math.floor(i / 5) * 33}%`,
                color: "white",
                opacity: 0.08,
              }}
            >
              SP
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 py-8 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8 max-w-xl"
          >
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                Kenya&apos;s Premier Footwear Marketplace
              </span>
              <h1 className="font-bebas text-[36px] sm:text-[56px] md:text-[108px] leading-none tracking-tight whitespace-nowrap">
                Every Shoe.<br />
                Every Store.
              </h1>
              <p className="text-sm text-white/55 max-w-md leading-relaxed">
                ShoePalace connects Kenya&apos;s best footwear stores with customers who care about quality. Browse stores, discover exclusive drops, and shop directly from verified vendors.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="#shops"
                className="bg-white text-neutral-900 px-8 py-3.5 text-xs uppercase tracking-widest border border-white hover:bg-[#E8001D] hover:border-[#E8001D] hover:text-white transition-colors"
              >
                Browse Stores
              </a>
              <Link
                href="/register-store"
                className="bg-transparent text-white px-8 py-3.5 text-xs uppercase tracking-widest border border-white/40 hover:border-white transition-colors"
              >
                Open Your Store
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4 border-t border-white/10">
              {[
                { value: stores.length.toString(), label: "Active Stores" },
                { value: "Kenya", label: "Market" },
                { value: "M-Pesa", label: "Payments" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="font-bebas text-2xl tracking-wide text-white">{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-[#F5F0E8] py-20 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3 block">
                The platform
              </span>
              <h2 className="font-bebas text-5xl md:text-6xl tracking-wide text-neutral-900 leading-none">
                Built for Kenya&apos;s<br />shoe market
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed md:text-right">
              Every store is independently run, reviewed by our team, and powered by a shared infrastructure — so the experience is consistent wherever you shop.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-px bg-neutral-200">
            {[
              {
                num: "01",
                title: "Browse verified stores",
                body: "Every store on ShoePalace has been reviewed before going live. No pop-ups, no noise — just real sellers with real stock.",
                detail: "Verified sellers only",
              },
              {
                num: "02",
                title: "Order direct from the source",
                body: "Visit any store, browse their full catalogue, and place your order. Each store manages its own inventory and fulfilment.",
                detail: "Nationwide delivery",
              },
              {
                num: "03",
                title: "Pay with M-Pesa",
                body: "No card required. Every store accepts M-Pesa and you get a confirmation the moment payment goes through.",
                detail: "Instant confirmation",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="bg-[#F5F0E8] p-8 md:p-10 flex flex-col gap-6 group"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bebas text-[56px] text-neutral-300 leading-none group-hover:text-[#E8001D] transition-colors duration-300">
                    {item.num}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 border border-neutral-300 px-2.5 py-1 mt-2">
                    {item.detail}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 flex-1">
                  <h3 className="text-base font-medium text-neutral-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {item.body}
                  </p>
                </div>
                <div className="h-px bg-neutral-300 group-hover:bg-[#E8001D] transition-colors duration-300" />
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Shops directory ── */}
      <section id="shops" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-neutral-900">
                Verified Stores
              </h2>
              <p className="text-sm text-neutral-400">
                {stores.length} store{stores.length !== 1 ? "s" : ""} on the platform
              </p>
            </div>
            <Link
              href="/register-store"
              className="hidden md:block text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4"
            >
              Open your store →
            </Link>
          </div>

          {stores.length === 0 ? (
            <div className="border border-neutral-100 py-24 text-center">
              <p className="text-sm text-neutral-400 uppercase tracking-widest mb-4">No stores yet</p>
              <Link
                href="/register-store"
                className="text-xs uppercase tracking-widest text-neutral-900 underline underline-offset-4 hover:text-[#E8001D] transition-colors"
              >
                Be the first to open a store
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <StoreCard key={store.tenant.id} store={store} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA — "Sell on ShoePalace" ── */}
      <section className="bg-[#0A0A0A] text-white py-0 overflow-hidden relative">
        {/* Background image — visible on all screen sizes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/object/public/product-images/platform/818f929e-6d8e-4a0e-b54e-cb053585fde5.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #0A0A0A 0%, #0A0A0A 15%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.15) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-5 max-w-lg"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              For sellers
            </span>
            <h2 className="font-bebas text-5xl md:text-6xl tracking-wide leading-none">
              Sell on ShoePalace
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Get your own store at yourname.shoepalace.store. We handle the platform — you focus on selling. Applications are reviewed within 24 hours.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/register-store"
                className="inline-flex items-center gap-3 bg-white text-neutral-900 px-8 py-4 text-xs uppercase tracking-widest w-fit hover:bg-[#E8001D] hover:text-white transition-colors"
              >
                Apply to Open a Store
                <span>→</span>
              </Link>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                Free to apply · Reviewed by hand
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-16 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h2 className="font-bebas text-4xl md:text-5xl tracking-wide text-neutral-900">
                  Get In Touch
                </h2>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Questions about the platform, your store application, or anything else? We&apos;re a small team based in Nairobi and we read every message.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Email", value: "hello@shoepalace.store", href: "mailto:hello@shoepalace.store" },
                  { label: "Location", value: "Nairobi, Kenya", href: null },
                  { label: "Response time", value: "Within 24 hours", href: null },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400">{item.label}</span>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-neutral-900 hover:text-[#E8001D] transition-colors">{item.value}</a>
                    ) : (
                      <span className="text-sm text-neutral-900">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-900">
                  Want to open a store?
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Apply to join the platform. Applications are reviewed by hand and we&apos;ll get back to you within 24 hours.
                </p>
              </div>
              <Link
                href="/register-store"
                className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-[#E8001D] transition-colors w-fit"
              >
                Apply Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-100 py-8 relative overflow-hidden min-h-[120px]">
        {/* Left-side image background */}
        <div
          className="absolute left-0 top-0 h-full w-48 md:w-64 pointer-events-none z-0"
          style={{
            backgroundImage:
              "url(https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/object/public/product-images/platform/Adobe%20Express%20-%20file%20(1).png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle dark fade */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0))",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            {[
              { href: "/#shops", label: "Shops" },
              { href: "/#how-it-works", label: "About" },
              { href: "/#contact", label: "Contact" },
              { href: "/register-store", label: "Open a Store" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
            {new Date().getFullYear()} ShoePalace. Kenya&apos;s footwear marketplace.
          </p>
        </div>
      </footer>
    </div>
  );
}