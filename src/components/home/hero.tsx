"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";

const STAGGER_CONTAINER = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const FADE_UP = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const FADE_IN = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden
        bg-[#F5F0E8]"
    >
      {/* Parallax background grid lines */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Vertical lines */}
        {[25, 50, 75].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 bottom-0 w-px bg-neutral-900/5"
            style={{ left: `${pos}%` }}
          />
        ))}
        {/* Horizontal lines */}
        {[33, 66].map((pos) => (
          <div
            key={pos}
            className="absolute left-0 right-0 h-px bg-neutral-900/5"
            style={{ top: `${pos}%` }}
          />
        ))}
      </motion.div>

      {/* Red accent block */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 }}
        style={{ originY: 1 }}
        className="absolute bottom-0 right-0 w-1/3 h-2/3 bg-[#E8001D]/5
          pointer-events-none"
        aria-hidden="true"
      />

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full
          py-24 md:py-0"
      >
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          className="flex flex-col gap-8 max-w-5xl"
        >
          {/* Eyebrow */}
          <motion.div variants={FADE_IN} className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#E8001D]" />
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              New Season Collection
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={FADE_UP}
            className="font-bebas text-display-xl text-neutral-900 leading-none"
          >
            Move With
            <br />
            <span className="text-[#E8001D]">Purpose.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={FADE_UP}
            className="text-base md:text-lg text-neutral-500 max-w-md
              leading-relaxed"
          >
            Precision-engineered footwear for every terrain. Built for those
            who demand more from every step.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={FADE_UP}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-neutral-900 text-white
                px-8 py-4 text-xs uppercase tracking-widest
                hover:bg-neutral-700 transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Shop Collection
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                className="inline-block"
              >
                →
              </motion.span>
            </Link>
            <Link
              href="/products?featured=true"
              className="inline-flex items-center gap-3 border border-neutral-300
                text-neutral-900 px-8 py-4 text-xs uppercase tracking-widest
                hover:border-neutral-900 transition-colors duration-200"
            >
              Featured Drops
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={FADE_UP}
            className="flex items-center gap-8 pt-4 border-t border-neutral-200"
          >
            {[
              { value: "200+", label: "Styles" },
              { value: "Free", label: "Returns" },
              { value: "4.9", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="font-bebas text-2xl text-neutral-900
                  tracking-wide">
                  {stat.value}
                </span>
                <span className="text-xs uppercase tracking-widest
                  text-neutral-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex
          flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-[10px] uppercase tracking-widest
          text-neutral-400">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="h-6 w-px bg-neutral-300"
        />
      </motion.div>
    </section>
  );
}