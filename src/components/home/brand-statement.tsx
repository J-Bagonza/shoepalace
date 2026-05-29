"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const WORDS = [
  "PRECISION",
  "CRAFTED",
  "FOR",
  "THOSE",
  "WHO",
  "DEMAND",
  "MORE",
  "FROM",
  "EVERY",
  "STEP",
];

export function BrandStatement() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  return (
    <section
      ref={ref}
      className="py-24 md:py-40 bg-brand-black overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          {/* Left — animated word reveal */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {WORDS.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                className="font-bebas text-display-lg text-white/10
                  leading-none select-none"
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Right — content */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
            className="flex flex-col gap-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#E8001D]" />
              <span className="text-xs uppercase tracking-widest
                text-white/40">
                Our Standard
              </span>
            </div>

            <h2 className="font-bebas text-display-md text-white leading-none">
              Built Different.
              <br />
              <span className="text-[#E8001D]">By Design.</span>
            </h2>

            <p className="text-sm text-white/50 leading-relaxed max-w-sm">
              Every pair starts with a question: how far can we push this?
              From carbon-fibre midsoles to hand-stitched leather uppers,
              we engineer footwear that earns its place on the shelf.
            </p>

            <div className="grid grid-cols-2 gap-6 py-6 border-t
              border-white/10">
              {[
                { value: "100%", label: "Premium materials" },
                { value: "2yr", label: "Craftsmanship warranty" },
                { value: "60+", label: "Countries shipped to" },
                { value: "Est.", label: "MMXXIV London" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="font-bebas text-2xl text-white
                    tracking-wide">
                    {item.value}
                  </span>
                  <span className="text-xs uppercase tracking-widest
                    text-white/30">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/products"
              className="self-start inline-flex items-center gap-3
                border border-white/20 text-white px-8 py-4 text-xs
                uppercase tracking-widest hover:bg-white hover:text-neutral-900
                transition-all duration-300"
            >
              Explore All
              <span>→</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Horizontal scroll marquee strips */}
      <div className="mt-24 flex flex-col gap-3 overflow-hidden">
        <motion.div style={{ x: x1 }} className="flex gap-6 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="font-bebas text-6xl md:text-8xl text-white/5
                tracking-widest shrink-0"
            >
              SHOEPALACE &nbsp; PREMIUM FOOTWEAR &nbsp;
            </span>
          ))}
        </motion.div>
        <motion.div style={{ x: x2 }} className="flex gap-6 whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="font-bebas text-6xl md:text-8xl text-white/5
                tracking-widest shrink-0"
            >
              EST. MMXXIV &nbsp; LONDON &nbsp; PRECISION CRAFTED &nbsp;
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}