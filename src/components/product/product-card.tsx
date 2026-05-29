"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";
import { formatPrice, getPrimaryImage, isInStock } from "@/utils/product";
import { Badge } from "@/components/ui/badge";
import { useCartControls } from "@/store/ui";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const CARD_VARIANTS: Variants = {
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

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const { addToCart, loading } = useAddToCart();

  // 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [5, -5]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-5, 5]), {
    stiffness: 200,
    damping: 30,
  });
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
    glareOpacity.set(0.08);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    glareOpacity.set(0);
  }

  const primaryImage = getPrimaryImage(product);
  const secondaryImage = product.images
    ?.sort((a, b) => a.position - b.position)[1];
  const inStock = isInStock(product);
  const firstVariant = product.variants?.[0];

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAddError(null);

    if (!firstVariant) return;

    await addToCart({
      item: {
        id: "",
        variant_id: firstVariant.id,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        image_url: primaryImage?.url ?? "",
        size: firstVariant.size,
        color: firstVariant.color,
        price: product.price,
        quantity: 1,
      },
      onError: (msg) => setAddError(msg),
    });
  }

  return (
    <motion.div variants={CARD_VARIANTS} className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#E8001D]"
      >
        {/* Image container with 3D tilt */}
        <motion.div
          ref={ref}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 900,
            transformStyle: "preserve-3d",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative aspect-[3/4] overflow-hidden bg-[#F5F0E8]
            will-change-transform"
        >
          {/* Primary image */}
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw,
                     (max-width: 1024px) 33vw,
                     25vw"
              className={`object-cover transition-opacity duration-500
                ${secondaryImage ? "group-hover:opacity-0" : ""}`}
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-100" />
          )}

          {/* Secondary image on hover */}
          {secondaryImage && (
            <Image
              src={secondaryImage.url}
              alt={secondaryImage.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw,
                     (max-width: 1024px) 33vw,
                     25vw"
              className="object-cover opacity-0 transition-opacity duration-500
                group-hover:opacity-100"
            />
          )}

          {/* Glare effect */}
          <motion.div
            style={{
              opacity: glareOpacity,
              background: `radial-gradient(circle at ${glareX} ${glareY},
                rgba(255,255,255,0.6) 0%, transparent 70%)`,
            }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_featured && (
              <Badge variant="red">Featured</Badge>
            )}
            {!inStock && (
              <Badge variant="default">Sold Out</Badge>
            )}
          </div>

          {/* Quick add button */}
          {inStock && firstVariant && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileHover={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 opacity-0
                group-hover:opacity-100 transition-opacity duration-200"
            >
              <button
                onClick={handleQuickAdd}
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-[10px]
                  uppercase tracking-widest py-3
                  hover:bg-[#E8001D] transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : `Quick Add — ${firstVariant.size}`}
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Card info */}
        <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate
              group-hover:text-[#E8001D] transition-colors duration-200">
              {product.name}
            </p>
            <p className="text-xs text-neutral-400 uppercase tracking-wider">
              {product.category}
            </p>
            {addError && (
              <p className="text-xs text-[#E8001D] mt-0.5">{addError}</p>
            )}
          </div>
          <p className="text-sm text-neutral-900 shrink-0">
            {formatPrice(product.price)}
          </p>
        </div>

        {/* Color dots */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-2 flex gap-1.5 px-0.5">
            {[...new Set(product.variants.map((v) => v.color))]
              .slice(0, 4)
              .map((color) => (
                <span
                  key={color}
                  title={color}
                  className="h-2.5 w-2.5 rounded-full border border-neutral-200
                    bg-neutral-300"
                />
              ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}