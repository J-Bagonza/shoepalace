"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { ProductImage } from "@/types/product";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const activeImage = sorted[activeIndex];

  const go = useCallback(
    (index: number) => {
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    },
    [activeIndex],
  );

  const prev = useCallback(() => {
    go(activeIndex === 0 ? sorted.length - 1 : activeIndex - 1);
  }, [activeIndex, go, sorted.length]);

  const next = useCallback(() => {
    go(activeIndex === sorted.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, go, sorted.length]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square bg-[#F5F0E8] w-full flex items-center
        justify-center">
        <span className="text-xs uppercase tracking-widest text-neutral-300">
          No Image
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible
          no-scrollbar shrink-0">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => go(i)}
              className={clsx(
                "relative shrink-0 h-16 w-16 md:h-20 md:w-20 overflow-hidden",
                "transition-all duration-200 focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-[#E8001D]",
                i === activeIndex
                  ? "ring-1 ring-neutral-900"
                  : "ring-1 ring-neutral-100 opacity-60 hover:opacity-100",
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
            >
              <Image
                src={img.url}
                alt={img.alt || productName}
                fill
                sizes="80px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-square md:aspect-[4/5]
        overflow-hidden bg-[#F5F0E8]">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          {activeImage && (
            <motion.div
              key={activeImage.id}
              custom={direction}
              variants={{
                enter: (d: number) => ({
                  x: d > 0 ? "6%" : "-6%",
                  opacity: 0,
                }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({
                  x: d > 0 ? "-6%" : "6%",
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className="absolute inset-0"
            >
              <Image
                src={activeImage.url}
                alt={activeImage.alt || productName}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prev/Next arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9
                bg-white/80 backdrop-blur-sm flex items-center justify-center
                text-neutral-900 hover:bg-white transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-neutral-900"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9
                bg-white/80 backdrop-blur-sm flex items-center justify-center
                text-neutral-900 hover:bg-white transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-neutral-900"
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}

        {/* Image counter */}
        {sorted.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-white/80
            backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase
            tracking-widest text-neutral-600">
            {activeIndex + 1} / {sorted.length}
          </div>
        )}
      </div>
    </div>
  );
}