"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImageGallery } from "./image-gallery";
import { VariantSelector } from "./variant-selector";
import { SizeGuideModal } from "./size-guide-modal";
import { RelatedProducts } from "./related-products";
import { ModelViewerWrapper } from "@/components/three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { formatPrice, isInStock } from "@/utils/product";
import { useCurrency } from "@/context/currency-context";
import type { Product, ProductVariant } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetail({
  product,
  relatedProducts,
}: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const { addToCart, loading } = useAddToCart();
  const currency = useCurrency();

  const inStock = isInStock(product);

  const sortedImages = [...(product.images ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  async function handleAddToCart() {
    setAddError(null);
    setAddSuccess(false);

    if (!selectedVariant) {
      setAddError("Please select a size.");
      return;
    }

    if (selectedVariant.stock === 0) {
      setAddError("Selected size is out of stock.");
      return;
    }

    await addToCart({
      item: {
        id: "",
        variant_id: selectedVariant.id,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        image_url: sortedImages[0]?.url ?? "",
        size: selectedVariant.size,
        color: selectedVariant.color,
        price: product.price,
        quantity: 1,
      },
      onSuccess: () => setAddSuccess(true),
      onError: (msg) => setAddError(msg),
    });
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left — media */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
          >
            <ModelViewerWrapper
              modelUrl={product.model_url ?? null}
              fallback={
                <ImageGallery
                  images={product.images ?? []}
                  productName={product.name}
                />
              }
            />
          </motion.div>

          {/* Right — info */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
            className="flex flex-col gap-8"
          >
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest
                  text-neutral-400">
                  {product.category}
                </span>
                {product.is_featured && (
                  <Badge variant="red">Featured</Badge>
                )}
                {!inStock && (
                  <Badge variant="default">Sold Out</Badge>
                )}
              </div>

              <h1 className="font-bebas text-display-md text-neutral-900
                leading-none">
                {product.name}
              </h1>

              <p className="text-2xl text-neutral-900">
                {formatPrice(product.price, currency)}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Description */}
            <p className="text-sm text-neutral-500 leading-relaxed">
              {product.description}
            </p>

            {/* Variant selector */}
            {inStock ? (
              <VariantSelector
                product={product}
                onVariantChange={setSelectedVariant}
              />
            ) : (
              <p className="text-sm text-neutral-400 uppercase tracking-widest">
                Currently out of stock
              </p>
            )}

            {/* Size guide link */}
            <button
              onClick={() => setSizeGuideOpen(true)}
              className="self-start text-xs uppercase tracking-widest
                text-neutral-400 underline underline-offset-4
                hover:text-neutral-900 transition-colors"
            >
              Size Guide
            </button>

            {/* Add to cart */}
            {inStock && (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAddToCart}
                  loading={loading}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  variant="primary"
                >
                  {selectedVariant
                    ? selectedVariant.stock === 0
                      ? "Out of Stock"
                      : "Add to Cart"
                    : "Select a Size"}
                </Button>

                {addError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-[#E8001D] text-center"
                    role="alert"
                  >
                    {addError}
                  </motion.p>
                )}

                {addSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green-600 text-center uppercase
                      tracking-widest"
                    role="status"
                  >
                    Added to cart
                  </motion.p>
                )}
              </div>
            )}

            {/* Trust signals */}
            <div className="flex flex-col gap-2 pt-4 border-t
              border-neutral-100">
              {[
                "Free shipping on orders over £100",
                "Free returns within 30 days",
                "2 year craftsmanship warranty",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="h-px w-4 bg-[#E8001D] shrink-0" />
                  <p className="text-xs text-neutral-500">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Related products */}
      <RelatedProducts
        products={relatedProducts}
        currentCategory={product.category}
      />

      {/* Size guide modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </>
  );
}