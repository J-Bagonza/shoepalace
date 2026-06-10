"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { formatPrice, getPrimaryImage, isInStock } from "@/utils/product";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { useCartItems, useCartActions } from "@/store/cart";
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
  const items = useCartItems();
  const { updateQuantity, removeItem } = useCartActions();

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

  // Cart state for this product's first variant
  const cartItem = firstVariant
    ? items.find((i) => i.variant_id === firstVariant.id)
    : null;
  const cartQty = cartItem?.quantity ?? 0;

  async function handleAddToCart(e: React.MouseEvent) {
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

  function handleIncrease(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    updateQuantity(firstVariant.id, cartQty + 1);
  }

  function handleDecrease(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    if (cartQty <= 1) {
      removeItem(firstVariant.id);
    } else {
      updateQuantity(firstVariant.id, cartQty - 1);
    }
  }

  return (
    <motion.div variants={CARD_VARIANTS} className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#E8001D]"
      >
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

          {secondaryImage && (
            <Image
              src={secondaryImage.url}
              alt={secondaryImage.alt || product.name}
              fill
              sizes="(max-width: 640px) 50vw,
                     (max-width: 1024px) 33vw,
                     25vw"
              className="object-cover opacity-0 transition-opacity
                duration-500 group-hover:opacity-100"
            />
          )}

          <motion.div
            style={{
              opacity: glareOpacity,
              background: `radial-gradient(circle at ${glareX} ${glareY},
                rgba(255,255,255,0.6) 0%, transparent 70%)`,
            }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_featured && <Badge variant="red">Featured</Badge>}
            {!inStock && <Badge variant="default">Sold Out</Badge>}
          </div>

          {/* Cart controls */}
          {inStock && firstVariant && (
            <div
              className="absolute bottom-3 right-3 z-10"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <AnimatePresence mode="wait">
                {cartQty === 0 ? (
                  <motion.button
                    key="add"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="h-9 w-9 bg-neutral-900 text-white
                      flex items-center justify-center
                      hover:bg-[#E8001D] disabled:opacity-50
                      opacity-0 group-hover:opacity-100 transition-all duration-200"
                    aria-label="Add to cart"
                  >
                    <svg
                      width="14" height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </motion.button>
                ) : (
                  <motion.div
                    key="controls"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center bg-neutral-900"
                  >
                    <button
                      onClick={handleDecrease}
                      className="h-9 w-8 text-white flex items-center
                        justify-center hover:bg-[#E8001D]
                        transition-colors text-base leading-none"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="text-white text-xs font-medium
                      min-w-[18px] text-center tabular-nums">
                      {cartQty}
                    </span>
                    <button
                      onClick={handleIncrease}
                      className="h-9 w-8 text-white flex items-center
                        justify-center hover:bg-[#E8001D]
                        transition-colors text-base leading-none"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

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

        {(product.variants ?? []).length > 0 && (
          <div className="mt-2 flex gap-1.5 px-0.5">
            {[...new Set((product.variants ?? []).map((v) => v.color))]
              .slice(0, 4)
              .map((color) => (
                <span
                  key={color}
                  title={color}
                  className="h-2.5 w-2.5 rounded-full border
                    border-neutral-200 bg-neutral-300"
                />
              ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}