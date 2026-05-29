"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import { ProductCard } from "./product-card";
import type { Product } from "@/types/product";

interface RelatedProductsProps {
  products: Product[];
  currentCategory: string;
}

const CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export function RelatedProducts({
  products,
  currentCategory,
}: RelatedProductsProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  if (products.length === 0) return null;

  return (
    <section ref={ref} className="py-20 border-t border-neutral-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="flex items-end justify-between mb-10"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#E8001D]" />
              <span className="text-xs uppercase tracking-widest
                text-neutral-400">
                More Like This
              </span>
            </div>
            <h2 className="font-bebas text-3xl md:text-4xl tracking-wide
              text-neutral-900">
              You May Also Like
            </h2>
          </div>
          <Link
            href={`/products?category=${currentCategory}`}
            className="hidden sm:flex items-center gap-2 text-xs uppercase
              tracking-widest text-neutral-400 hover:text-neutral-900
              transition-colors"
          >
            View All →
          </Link>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={CONTAINER}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-100"
        >
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 md:p-6">
              <ProductCard product={product} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}