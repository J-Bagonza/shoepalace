"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContentBlock } from "@/types/page";

interface ContentRendererProps {
  blocks: ContentBlock[];
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between py-5 text-left
          focus-visible:outline-none"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-neutral-900 pr-8">
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-400 text-lg shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-neutral-500 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={i}
                className="font-bebas text-3xl md:text-4xl tracking-wide
                  text-neutral-900"
              >
                {block.text}
              </h2>
            );

          case "paragraph":
            return (
              <p
                key={i}
                className="text-base text-neutral-600 leading-relaxed"
              >
                {block.text}
              </p>
            );

          case "policy_item":
            return (
              <div
                key={i}
                className="flex flex-col gap-2 py-6 border-b
                  border-neutral-100 last:border-0"
              >
                <h3 className="text-sm font-medium uppercase tracking-widest
                  text-neutral-900">
                  {block.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {block.body}
                </p>
              </div>
            );

          case "faq_item":
            return (
              <FaqItem
                key={i}
                question={block.question}
                answer={block.answer}
              />
            );

          case "contact_item":
            return (
              <div
                key={i}
                className="flex items-center justify-between py-5
                  border-b border-neutral-100 last:border-0"
              >
                <span className="text-xs uppercase tracking-widest
                  text-neutral-400">
                  {block.label}
                </span>
                <span className="text-sm text-neutral-900">{block.value}</span>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}