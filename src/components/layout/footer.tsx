"use client";

import Link from "next/link";
import Image from "next/image";
import { useTenant } from "@/lib/tenant/context";

const FOOTER_LINKS = {
  shop: [
    { href: "/products?category=running", label: "Running" },
    { href: "/products?category=lifestyle", label: "Lifestyle" },
    { href: "/products?category=hiking", label: "Hiking" },
    { href: "/products?featured=true", label: "Featured" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/careers", label: "Careers" },
  ],
  support: [
    { href: "/faq", label: "FAQ" },
    { href: "/returns", label: "Returns" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export function Footer() {
  const tenant = useTenant();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-black text-white">
      {/* Marquee strip */}
      <div className="border-y border-white/10 overflow-hidden py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="font-bebas text-lg tracking-widest text-white/20
                mx-8 shrink-0"
            >
              PRECISION CRAFTED &nbsp; FREE SHIPPING OVER £100 &nbsp;
              PREMIUM FOOTWEAR &nbsp; EST. MMXXIV
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand — image sits behind this column only */}
          <div className="col-span-2 md:col-span-1 relative flex flex-col
            justify-end gap-3 overflow-hidden rounded-sm h-[220px] p-5">
            <Image
              src="https://hisgmvazdmtgjuepuqit.supabase.co/storage/v1/render/image/public/product-images/hero/ChatGPT%20Image%20Jun%2020,%202026,%2012_08_09%20PM.png?width=400&height=500&resize=cover&quality=80"
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 280px"
              className="object-cover object-center"
              aria-hidden
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.25))",
              }}
            />
            <Link
              href="/"
              className="relative z-10 font-bebas text-2xl tracking-wider text-white
                hover:text-[#E8001D] transition-colors"
            >
              {tenant.name}
            </Link>
            <p className="relative z-10 text-xs text-white/70 leading-relaxed max-w-[200px]">
              Precision-crafted footwear for those who move with purpose.
            </p>
          </div>

          {/* Shop */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-white/30">
              Shop
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white
                      transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-white/30">
              Company
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white
                      transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest text-white/30">
              Support
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white
                      transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 pt-8 border-t border-white/10 flex flex-col
            sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <p className="text-xs text-white/30">
            {year} {tenant.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-white/30 hover:text-white/60
                transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-white/30 hover:text-white/60
                transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}