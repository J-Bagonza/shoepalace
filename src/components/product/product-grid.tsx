"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  if (loading) {
    return <ProductGridSkeleton count={24} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
      }}
      className="grid grid-cols-2 md:grid-cols-3 gap-px bg-neutral-100"
    >
      {products.map((product, index) => (
        <div key={product.id} className="bg-white p-4 md:p-6">
          <ProductCard product={product} priority={index < 4} />
        </div>
      ))}
    </motion.div>
  );
}