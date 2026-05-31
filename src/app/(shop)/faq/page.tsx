"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Nairobi deliveries take 1-2 business days. Rest of Kenya takes 3-5 business days. You will receive a tracking update once your order is dispatched.",
  },
  {
    q: "How do I pay?",
    a: "We accept M-Pesa, credit/debit cards, and cash on delivery within Nairobi. M-Pesa is the fastest and most reliable payment method.",
  },
  {
    q: "Are the shoes authentic?",
    a: "Every pair we sell is 100% authentic. We source directly from authorised distributors and brand representatives. We do not sell replicas.",
  },
  {
    q: "What if my size is not available?",
    a: "Use the Notify Me option on the product page and we will alert you when your size is back in stock. You can also contact us directly.",
  },
  {
    q: "Can I return shoes I have worn?",
    a: "No. Returns are only accepted for unworn shoes in original condition with tags attached, within 30 days of delivery.",
  },
  {
    q: "Do you ship outside Kenya?",
    a: "Currently we only ship within Kenya. International shipping is on our roadmap for 2025.",
  },
  {
    q: "How do I know my size?",
    a: "Check our Size Guide page for a full conversion chart. If you are between sizes we recommend sizing up.",
  },
] as const;

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            FAQ
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-0 max-w-2xl divide-y
          divide-neutral-100">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5
                  text-left focus-visible:outline-none"
                aria-expanded={open === i}
              >
                <span className="text-sm font-medium text-neutral-900 pr-8">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-neutral-400 text-lg shrink-0"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm text-neutral-500 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}