"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prev, next]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square bg-[#F5F0E8] w-full flex items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-neutral-300">
          No Image
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* Thumbnails */}
        {sorted.length > 1 && (
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar shrink-0">
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
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div
          className="relative flex-1 aspect-square md:aspect-[4/5] overflow-hidden bg-[#F5F0E8] cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
          role="button"
          aria-label="View full image"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            {activeImage && (
              <motion.div
                key={activeImage.id}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? "6%" : "-6%", opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d > 0 ? "-6%" : "6%", opacity: 0 }),
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
                  className="object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap hint */}
          <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-widest text-neutral-600 pointer-events-none">
            Tap to view full photo
          </div>

          {/* Prev/Next arrows */}
          {sorted.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9
                  bg-white/80 backdrop-blur-sm flex items-center justify-center
                  text-neutral-900 hover:bg-white transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9
                  bg-white/80 backdrop-blur-sm flex items-center justify-center
                  text-neutral-900 hover:bg-white transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}

          {/* Image counter */}
          {sorted.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-widest text-neutral-600">
              {activeIndex + 1} / {sorted.length}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0">
              <span className="text-[10px] uppercase tracking-widest text-white/50">
                {activeIndex + 1} / {sorted.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                className="text-[10px] uppercase tracking-widest text-white/50
                  hover:text-white transition-colors"
                aria-label="Close"
              >
                Close
              </button>
            </div>

            {/* Main image area */}
            <div
              className="flex-1 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                {activeImage && (
                  <motion.div
                    key={activeImage.id}
                    custom={direction}
                    variants={{
                      enter: (d: number) => ({ x: d > 0 ? "8%" : "-8%", opacity: 0 }),
                      center: { x: 0, opacity: 1 },
                      exit: (d: number) => ({ x: d > 0 ? "-8%" : "8%", opacity: 0 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={activeImage.url}
                      alt={activeImage.alt || productName}
                      fill
                      priority
                      sizes="100vw"
                      className="object-contain"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lightbox arrows */}
              {sorted.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11
                      bg-white/10 hover:bg-white/20 flex items-center justify-center
                      text-white transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11
                      bg-white/10 hover:bg-white/20 flex items-center justify-center
                      text-white transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {sorted.length > 1 && (
              <div
                className="flex gap-2 px-6 py-4 overflow-x-auto no-scrollbar shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {sorted.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => go(i)}
                    className={clsx(
                      "relative shrink-0 h-14 w-14 overflow-hidden transition-all duration-200",
                      i === activeIndex
                        ? "ring-1 ring-white opacity-100"
                        : "ring-1 ring-white/20 opacity-40 hover:opacity-70",
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}