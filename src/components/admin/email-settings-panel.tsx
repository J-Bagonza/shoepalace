"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function EmailSettingsPanel() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleTest() {
    setResult(null);
    setTesting(true);

    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
      });
      const json = await res.json() as {
        data: { success: boolean } | null;
        error: string | null;
      };

      setResult({
        success: res.ok && !!json.data?.success,
        message: res.ok
          ? "Test email sent successfully."
          : json.error ?? "Failed to send test email.",
      });
    } catch {
      setResult({ success: false, message: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  const fromEmail =
    process.env.NEXT_PUBLIC_FROM_EMAIL ?? "orders@shoepalace.co.ke";

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-neutral-100 bg-[#F5F0E8] p-5
        flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-neutral-500
          font-medium">
          Transactional Emails
        </p>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Your store automatically sends emails for order confirmations,
          status updates, and password resets. Emails are sent from{" "}
          <span className="font-medium text-neutral-700">{fromEmail}</span>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-neutral-500
          font-medium">
          Automated Emails
        </p>
        {[
          {
            trigger: "Order placed",
            email: "Order confirmation with items, total and tracking link",
          },
          {
            trigger: "Status: Confirmed",
            email: "Order confirmed — being prepared",
          },
          {
            trigger: "Status: Shipped",
            email: "Order on its way",
          },
          {
            trigger: "Status: Delivered",
            email: "Order delivered confirmation",
          },
          {
            trigger: "Status: Cancelled",
            email: "Cancellation notice with refund info",
          },
          {
            trigger: "Password reset",
            email: "Branded reset link valid for 1 hour",
          },
        ].map((item) => (
          <div
            key={item.trigger}
            className="flex items-start justify-between gap-4 py-3
              border-b border-neutral-100 last:border-0"
          >
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400 shrink-0 mt-0.5 w-32">
              {item.trigger}
            </span>
            <span className="text-xs text-neutral-600">{item.email}</span>
            <span className="text-[10px] text-green-600 uppercase
              tracking-widest shrink-0">
              Active
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-neutral-500
          font-medium">
          Test Email
        </p>
        <p className="text-xs text-neutral-400">
          Send a test email to confirm your setup is working.
        </p>
        <button
          onClick={handleTest}
          disabled={testing}
          className="self-start bg-neutral-900 text-white px-6 py-2.5
            text-xs uppercase tracking-widest hover:bg-neutral-700
            transition-colors disabled:opacity-50"
        >
          {testing ? "Sending..." : "Send Test Email"}
        </button>

        {result && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs uppercase tracking-widest ${
              result.success ? "text-green-600" : "text-[#E8001D]"
            }`}
          >
            {result.message}
          </motion.p>
        )}
      </div>
    </div>
  );
}