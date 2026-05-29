"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

export function Newsletter() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Placeholder — wire to email provider in production
    setSubmitted(true);
  }

  return (
    <section
      ref={ref}
      className="py-24 bg-[#F5F0E8] border-t border-neutral-200"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="flex flex-col md:flex-row items-start md:items-end
            justify-between gap-10"
        >
          <div className="flex flex-col gap-3 max-w-md">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#E8001D]" />
              <span className="text-xs uppercase tracking-widest
                text-neutral-500">
                Stay Updated
              </span>
            </div>
            <h2 className="font-bebas text-display-md text-neutral-900
              leading-none">
              New Drops.
              <br />
              First Look.
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Be first to know about limited releases, collaborations,
              and exclusive member offers.
            </p>
          </div>

          {/* Form */}
          <div className="w-full md:w-auto md:min-w-[380px]">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 py-4"
              >
                <p className="text-sm font-medium text-neutral-900">
                  You are on the list.
                </p>
                <p className="text-xs text-neutral-400">
                  Watch your inbox for exclusive drops.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-3"
              >
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    autoComplete="email"
                    className="flex-1 border border-neutral-300 border-r-0
                      bg-white px-4 py-3.5 text-sm text-neutral-900
                      placeholder:text-neutral-400 focus:outline-none
                      focus:border-neutral-900 transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-neutral-900 text-white px-6 py-3.5 text-xs
                      uppercase tracking-widest hover:bg-neutral-700
                      transition-colors duration-200 shrink-0"
                  >
                    Join
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-[#E8001D]" role="alert">
                    {error}
                  </p>
                )}
                <p className="text-xs text-neutral-400">
                  No spam. Unsubscribe at any time.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}