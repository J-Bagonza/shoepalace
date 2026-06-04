"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface StepShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  skipHref?: string;
  backHref?: string;
}

export function StepShell({
  title,
  description,
  children,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  nextLoading = false,
  skipHref,
  backHref,
}: StepShellProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          {title}
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed max-w-lg">
          {description}
        </p>
      </div>

      <div className="bg-white border border-neutral-100 p-8">
        {children}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="text-xs uppercase tracking-widest text-neutral-400
                hover:text-neutral-900 transition-colors"
            >
              Back
            </button>
          )}
          {skipHref && (
            <button
              onClick={() => router.push(skipHref)}
              className="text-xs uppercase tracking-widest text-neutral-400
                hover:text-neutral-900 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>

        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            className="bg-neutral-900 text-white px-8 py-3 text-xs
              uppercase tracking-widest hover:bg-neutral-700
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLoading ? "Saving..." : nextLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export async function markStepComplete(
  step: string,
): Promise<boolean> {
  const res = await fetch("/api/admin/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, complete: true }),
  });
  return res.ok;
}