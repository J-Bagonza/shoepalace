"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";

const CATEGORIES = [
  {
    slug: "running",
    label: "Running",
    description: "Built for speed and endurance.",
    stat: "48 styles",
    accent: "bg-neutral-900",
  },
  {
    slug: "lifestyle",
    label: "Lifestyle",
    description: "Timeless silhouettes refined.",
    stat: "72 styles",
    accent: "bg-[#E8001D]",
  },
  {
    slug: "hiking",
    label: "Hiking",
    description: "Any terrain. Any weather.",
    stat: "31 styles",
    accent: "bg-[#F5F0E8]",
  },
] as const;

const CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export function Categories() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-[#F5F0E8]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="flex flex-col gap-3 mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#E8001D]" />
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              Browse By
            </span>
          </div>
          <h2 className="font-bebas text-display-md text-neutral-900">
            Categories
          </h2>
        </motion.div>

        {/* Category cards */}
        <motion.div
          variants={CONTAINER}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.slug} variants={ITEM}>
              <Link
                href={`/products?category=${cat.slug}`}
                className="group relative flex flex-col justify-between
                  h-64 md:h-80 p-8 overflow-hidden bg-white
                  hover:shadow-lg transition-shadow duration-300"
              >
                {/* Accent corner block */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 12 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  style={{ originX: 1, originY: 0 }}
                  className={`absolute top-0 right-0 h-8 w-8 ${cat.accent}
                    opacity-20 group-hover:opacity-10`}
                />

                {/* Stat */}
                <span className="text-xs uppercase tracking-widest
                  text-neutral-400">
                  {cat.stat}
                </span>

                {/* Label + description */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-bebas text-4xl tracking-wide
                    text-neutral-900 group-hover:text-[#E8001D]
                    transition-colors duration-300">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {cat.description}
                  </p>

                  {/* Arrow */}
                  <motion.span
                    initial={{ x: 0, opacity: 0.4 }}
                    whileHover={{ x: 6, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block text-neutral-900 mt-2 text-sm"
                  >
                    Shop Now →
                  </motion.span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}