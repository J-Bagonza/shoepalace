"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { StepShell, markStepComplete } from "./step-shell";

export function OnboardingPaymentStep() {
  const router = useRouter();
  const [choice, setChoice] = useState<"mpesa" | "cash" | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleNext() {
    if (!choice) return;
    setSaving(true);

    await markStepComplete("step_payment");

    if (choice === "mpesa") {
      // Send to payment settings after onboarding
      router.push("/admin/settings?tab=payment");
    } else {
      router.push("/admin/onboarding/complete");
    }
  }

  return (
    <StepShell
      title="Payment Setup"
      description="Choose how you want to receive payments from customers. You can change this at any time from your store settings."
      onNext={choice ? handleNext : undefined}
      nextLoading={saving}
      nextLabel={choice === "mpesa" ? "Set Up M-Pesa" : "Finish Setup"}
      nextDisabled={!choice}
      backHref="/admin/onboarding/product"
    >
      <div className="flex flex-col gap-4">
        {[
          {
            value: "cash" as const,
            title: "Cash on Delivery",
            description:
              "Customers pay when their order arrives. No online payment setup needed. Best if you are just getting started.",
            tag: "Recommended for new stores",
          },
          {
            value: "mpesa" as const,
            title: "M-Pesa Online",
            description:
              "Customers pay instantly via M-Pesa STK push. Requires a PayHero account and M-Pesa Paybill or Till number.",
            tag: "Requires PayHero account",
          },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setChoice(option.value)}
            className={`text-left border p-5 transition-colors ${
              choice === option.value
                ? "border-neutral-900 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center
                      justify-center shrink-0 ${
                        choice === option.value
                          ? "border-neutral-900"
                          : "border-neutral-300"
                      }`}
                  >
                    {choice === option.value && (
                      <div className="h-2 w-2 rounded-full bg-neutral-900" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-900">
                    {option.title}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed pl-7">
                  {option.description}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-widest
                text-neutral-400 shrink-0 text-right">
                {option.tag}
              </span>
            </div>
          </button>
        ))}

        {choice === "cash" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-neutral-100 bg-[#F5F0E8] p-4"
          >
            <p className="text-xs text-neutral-600 leading-relaxed">
              Cash on Delivery is fully functional out of the box. Customers
              place orders and pay when their shoes arrive. You can switch to
              M-Pesa at any time from Settings → Payment.
            </p>
          </motion.div>
        )}

        {choice === "mpesa" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-neutral-100 bg-[#F5F0E8] p-4"
          >
            <p className="text-xs text-neutral-600 leading-relaxed">
              After this step we will take you to the Payment settings page
              where you can enter your PayHero API key and Channel ID.
            </p>
          </motion.div>
        )}
      </div>
    </StepShell>
  );
}