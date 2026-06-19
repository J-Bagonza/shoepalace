"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const SIZE_DATA = [
  { uk: "UK 6", eu: "EU 39", us: "US 7", cm: "24.5" },
  { uk: "UK 7", eu: "EU 40", us: "US 8", cm: "25.4" },
  { uk: "UK 8", eu: "EU 41", us: "US 9", cm: "26.2" },
  { uk: "UK 9", eu: "EU 42", us: "US 10", cm: "27.1" },
  { uk: "UK 10", eu: "EU 43", us: "US 11", cm: "27.9" },
  { uk: "UK 11", eu: "EU 44", us: "US 12", cm: "28.8" },
  { uk: "UK 12", eu: "EU 46", us: "US 13", cm: "29.6" },
] as const;

export function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal wrapper — handles centering + viewport clamping */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center
              p-4 pointer-events-none"
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              className="w-full max-w-lg max-h-[85vh] bg-white shadow-2xl
                pointer-events-auto flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Size guide"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — fixed */}
              <div className="flex items-center justify-between px-5 sm:px-6
                py-4 sm:py-5 border-b border-neutral-100 shrink-0">
                <h2 className="font-bebas text-xl sm:text-2xl tracking-wide
                  text-neutral-900">
                  Size Guide
                </h2>
                <button
                  onClick={onClose}
                  className="text-xs uppercase tracking-widest text-neutral-400
                    hover:text-neutral-900 transition-colors"
                  aria-label="Close size guide"
                >
                  Close
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1">
                {/* Measure tip */}
                <div className="px-5 sm:px-6 py-4 bg-[#F5F0E8] border-b
                  border-neutral-100">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Measure your foot from heel to toe while standing. Use
                    the centimetre measurement for the most accurate fit.
                    If between sizes, size up.
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        {["UK", "EU", "US", "CM"].map((h) => (
                          <th
                            key={h}
                            className="px-4 sm:px-6 py-3 text-left
                              text-[10px] uppercase tracking-widest
                              text-neutral-400 font-normal whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_DATA.map((row, i) => (
                        <tr
                          key={row.uk}
                          className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                        >
                          <td className="px-4 sm:px-6 py-3 text-xs
                            font-medium text-neutral-900 whitespace-nowrap">
                            {row.uk}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs
                            text-neutral-600 whitespace-nowrap">
                            {row.eu}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs
                            text-neutral-600 whitespace-nowrap">
                            {row.us}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs
                            text-neutral-600 whitespace-nowrap">
                            {row.cm}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer — fixed */}
              <div className="px-5 sm:px-6 py-4 border-t border-neutral-100
                shrink-0">
                <p className="text-xs text-neutral-400">
                  All measurements are approximate. Fit may vary by style.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}