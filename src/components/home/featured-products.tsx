"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";
import { formatPrice } from "@/utils/product";
import { useCurrency } from "@/context/currency-context";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

interface FeaturedProductsProps {
  products: Product[];
}

const CONTAINER: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), {
    stiffness: 200,
    damping: 30,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const primaryImage = [...(product.images ?? [])]
    .sort((a, b) => a.position - b.position)[0];

  return (
    <motion.div variants={ITEM}>
      <Link href={`/products/${product.slug}`} className="group block">
        <motion.div
          ref={ref}
          style={{ rotateX, rotateY, transformPerspective: 800 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative aspect-[3/4] overflow-hidden bg-[#F5F0E8]
            will-change-transform"
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700
                ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-100" />
          )}

          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-neutral-900/10"
          />

          {/* Quick shop pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2
              bg-white text-neutral-900 text-[10px] uppercase tracking-widest
              px-4 py-2 whitespace-nowrap"
          >
            Quick View
          </motion.div>

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute top-3 left-3">
              <Badge variant="red">Featured</Badge>
            </div>
          )}
        </motion.div>

        <div className="flex items-start justify-between mt-3 px-0.5">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-neutral-900 group-hover:text-[#E8001D]
              transition-colors duration-200">
              {product.name}
            </p>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">
              {product.category}
            </p>
          </div>
          <p className="text-sm text-neutral-900 shrink-0 ml-4">
            {formatPrice(product.price, currency)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const currency = useCurrency();

  if (products.length === 0) return null;

  return (
    <section ref={ref} className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="flex items-end justify-between mb-12"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#E8001D]" />
              <span className="text-xs uppercase tracking-widest
                text-neutral-400">
                Hand Picked
              </span>
            </div>
            <h2 className="font-bebas text-display-md text-neutral-900">
              Featured Drops
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="hidden sm:flex items-center gap-2 text-xs uppercase
              tracking-widest text-neutral-400 hover:text-neutral-900
              transition-colors duration-200"
          >
            View All
            <span>→</span>
          </Link>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={CONTAINER}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-100"
        >
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="bg-white p-4 md:p-6">
              <ProductCard product={product} currency={currency} />
            </div>
          ))}
        </motion.div>

        {/* Mobile view all */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-8 flex justify-center sm:hidden"
        >
          <Link
            href="/products?featured=true"
            className="text-xs uppercase tracking-widest text-neutral-900
              underline underline-offset-4 hover:text-[#E8001D]
              transition-colors"
          >
            View All Featured
          </Link>
        </motion.div>
      </div>
    </section>
  );
}