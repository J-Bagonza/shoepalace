"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice } from "@/utils/product";
import type { StoreWithProducts } from "@/lib/platform/fetch-stores-directory";

interface PlatformHomeProps {
  stores: StoreWithProducts[];
}

function ProductCarousel({
  products,
  storeSlug,
}: {
  products: StoreWithProducts["products"];
  storeSlug: string;
}) {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-[#F5F0E8]">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          No products yet
        </p>
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
            <div className="relative aspect-square bg-[#F5F0E8] overflow-hidden mb-2">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="144px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#F5F0E8]" />
              )}
            </div>
            <p className="text-[11px] font-medium text-neutral-900 truncate">
              {product.name}
            </p>
            <p className="text-[11px] text-neutral-500">
              {formatPrice(product.price)}
            </p>
          </a>
        ))}
      </motion.div>
    </div>
  );
}

function StoreCard({ store }: { store: StoreWithProducts }) {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const storeUrl = `https://${store.tenant.slug}.${rootDomain}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="border border-neutral-100 bg-white overflow-hidden group"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          {store.tenant.logo_url ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-sm bg-[#F5F0E8]">
              <Image
                src={store.tenant.logo_url}
                alt={store.tenant.name}
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-neutral-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold uppercase">
                {store.tenant.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-neutral-900 hover:text-[#E8001D] transition-colors leading-tight"
            >
              {store.tenant.name}
            </a>
            <span className="text-[10px] text-neutral-400">
              {store.tenant.slug}.shoepalace.store
            </span>
          </div>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Visit →
        </a>
      </div>

      <div className="px-5 py-4">
        <ProductCarousel
          products={store.products}
          storeSlug={store.tenant.slug}
        />
      </div>
    </motion.div>
  );
}

export function PlatformHomePage({ stores }: PlatformHomeProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Platform Navbar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-100">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8 h-[56px] flex items-center justify-between">
          <Link
            href="/"
            className="font-bebas text-2xl tracking-wider text-neutral-900 hover:text-[#E8001D] transition-colors"
          >
            ShoePalace
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {[
              { href: "/#shops", label: "Shops" },
              { href: "/#running", label: "Running" },
              { href: "/#lifestyle", label: "Lifestyle" },
              { href: "/#hiking", label: "Hiking" },
            ].map((link) => (
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

          <Link
            href="/register-store"
            className="bg-neutral-900 text-white px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-[#E8001D] transition-colors"
          >
            Open a Store
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-[46px] min-h-[70vh] flex items-center bg-[#0A0A0A] text-white relative overflow-hidden">

        {/* ── Video background — full bleed, right-weighted ── */}
        <div className="absolute inset-0 z-0">
          <video
            src="https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/object/public/product-images/platform/V9Crop_144147.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0.4 }}
          />
          {/* Layer 1: global dark veil so video never overpowers text */}
          <div className="absolute inset-0 bg-[#0A0A0A]/50" />
          {/* Layer 2: strong left fade — text zone is fully opaque dark */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #0A0A0A 0%, #0A0A0A 38%, rgba(10,10,10,0.6) 60%, rgba(10,10,10,0.15) 100%)",
            }}
          />
          {/* Layer 3: bottom fade into next section */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{
              background: "linear-gradient(to top, #0A0A0A, transparent)",
            }}
          />
        </div>

        {/* ── SP watermarks — above video, below content ── */}
        <div className="absolute inset-0 z-[1] pointer-events-none select-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute font-bebas text-[120px] font-black uppercase tracking-tighter"
              style={{
                left: `${(i % 5) * 25}%`,
                top: `${Math.floor(i / 5) * 33}%`,
                color: "white",
                opacity: 0.025,
              }}
            >
              SP
            </div>
          ))}
        </div>

        {/* ── Hero content — pinned left ── */}
        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 py-16">
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
              <h1 className="font-bebas text-[72px] md:text-[108px] leading-none tracking-tight">
                <p>Every Shoe.</p><br />
                <p>Every Store.</p>
              </h1>
              <p className="text-sm text-white/55 max-w-md leading-relaxed">
                ShoePalace connects Kenya&apos;s best footwear stores with
                customers who care about quality. Browse stores, discover
                exclusive drops, and shop directly from verified vendors.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* White-background primary CTA */}
              <a
                href="#shops"
                className="bg-white text-neutral-900 px-8 py-3.5 text-xs uppercase tracking-widest border border-white hover:bg-[#E8001D] hover:border-[#E8001D] hover:text-white transition-colors"
              >
                Browse Stores
              </a>
              {/* Ghost outline secondary CTA */}
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
                  <span className="font-bebas text-2xl tracking-wide text-white">
                    {stat.value}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#F5F0E8] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Browse Stores",
                body: "Explore verified shoe stores from across Kenya. Each store is reviewed before going live.",
              },
              {
                step: "02",
                title: "Shop Directly",
                body: "Visit any store, browse their catalogue, and order shoes delivered straight to you.",
              },
              {
                step: "03",
                title: "Pay via M-Pesa",
                body: "Every store accepts M-Pesa. Pay instantly and track your order in real time.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <span className="font-bebas text-5xl text-neutral-200 leading-none">
                  {item.step}
                </span>
                <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-900">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops directory */}
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
              <p className="text-sm text-neutral-400 uppercase tracking-widest mb-4">
                No stores yet
              </p>
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

      {/* CTA — open a store */}
      <section className="bg-[#0A0A0A] text-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="font-bebas text-4xl tracking-wide">
              Sell on ShoePalace
            </h2>
            <p className="text-sm text-white/60 max-w-md leading-relaxed">
              Get your own store at yourname.shoepalace.store. We handle
              the platform — you focus on selling. Applications reviewed
              within 24 hours.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/register-store"
              className="bg-white text-neutral-900 px-8 py-4 text-xs uppercase tracking-widest text-center hover:bg-[#E8001D] hover:text-white transition-colors"
            >
              Apply to Open a Store
            </Link>
            <p className="text-[10px] text-white/30 text-center uppercase tracking-widest">
              Free to apply · Reviewed by hand
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <span className="font-bebas text-xl tracking-widest text-neutral-900">
            ShoePalace
          </span>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
            {new Date().getFullYear()} ShoePalace. Kenya&apos;s footwear marketplace.
          </p>
        </div>
      </footer>
    </div>
  );
}