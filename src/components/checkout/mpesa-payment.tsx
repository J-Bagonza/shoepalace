"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/utils/product";
import { useCurrency } from "@/context/currency-context";

interface MpesaPaymentProps {
  orderId: string;
  total: number;
  defaultPhone?: string;
}

type PaymentState =
  | "idle"
  | "initiating"
  | "waiting"
  | "paid"
  | "failed";

const POLL_INTERVAL = 3000; // 3 seconds
const POLL_MAX = 40;        // Stop polling after 2 minutes

export function MpesaPayment({
  orderId,
  total,
  defaultPhone = "",
}: MpesaPaymentProps) {
  const router = useRouter();
  const currency = useCurrency();
  const [phone, setPhone] = useState(defaultPhone);
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollStatus() {
    try {
      const res = await fetch(
        `/api/payments/status?order_id=${orderId}`,
        { cache: "no-store" },
      );
      const json = await res.json() as {
        data: { payment_status: string; order_status: string } | null;
      };

      if (!json.data) return;

      if (json.data.payment_status === "paid") {
        stopPolling();
        setState("paid");
        setTimeout(() => router.push(`/orders/${orderId}`), 1500);
        return;
      }

      if (json.data.payment_status === "failed") {
        stopPolling();
        setState("failed");
        setError(
          "Payment was not completed. You can try again or choose cash on delivery.",
        );
        return;
      }

      setPollCount((c) => {
        if (c + 1 >= POLL_MAX) {
          stopPolling();
          setState("failed");
          setError(
            "Payment timed out. Check your M-Pesa messages or try again.",
          );
        }
        return c + 1;
      });
    } catch {
      // Network error — keep polling silently
    }
  }

  async function handleInitiate() {
    setError(null);

    if (!phone.trim()) {
      setError("Enter your M-Pesa phone number.");
      return;
    }

    setState("initiating");

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, phone }),
      });

      const json = await res.json() as {
        data: { message: string } | null;
        error: string | null;
      };

      if (!res.ok || !json.data) {
        setState("idle");
        setError(json.error ?? "Failed to initiate payment.");
        return;
      }

      setState("waiting");
      setPollCount(0);

      // Start polling for payment status
      pollRef.current = setInterval(pollStatus, POLL_INTERVAL);
    } catch {
      setState("idle");
      setError("Network error. Please try again.");
    }
  }

  function handleRetry() {
    stopPolling();
    setState("idle");
    setError(null);
    setPollCount(0);
  }

  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-2xl tracking-wide text-neutral-900">
          M-Pesa Payment
        </h2>
        <p className="text-sm text-neutral-500">
          Amount due:{" "}
          <span className="font-medium text-neutral-900">
            {formatPrice(total, currency)}
          </span>
        </p>
      </div>

      {state === "idle" && (
        <div className="flex flex-col gap-4">
          <Input
            label="M-Pesa Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX or 2547XXXXXXXX"
            error={error ?? undefined}
          />
          <Button onClick={handleInitiate}>
            Send STK Push
          </Button>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            You will receive a prompt on your phone. Enter your M-Pesa PIN
            to complete payment.
          </p>
        </div>
      )}

      {state === "initiating" && (
        <div className="flex items-center gap-3 py-4">
          <div className="h-4 w-4 border-2 border-neutral-200
            border-t-neutral-900 rounded-full animate-spin shrink-0" />
          <p className="text-sm text-neutral-600">
            Sending payment request...
          </p>
        </div>
      )}

      {state === "waiting" && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="border border-neutral-100 bg-[#F5F0E8] p-5
            flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 border-2 border-neutral-300
                border-t-neutral-900 rounded-full animate-spin shrink-0" />
              <p className="text-sm font-medium text-neutral-900">
                Waiting for payment...
              </p>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Check your phone{phone ? ` (${phone})` : ""} and enter your
              M-Pesa PIN to confirm payment of{" "}
              <span className="font-medium">{formatPrice(total, currency)}</span>.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="text-xs uppercase tracking-widest text-neutral-400
              hover:text-neutral-900 transition-colors"
          >
            Cancel and try again
          </button>
        </motion.div>
      )}

      {state === "paid" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-green-200 bg-green-50 p-5
            flex flex-col gap-2"
        >
          <p className="text-sm font-medium text-green-700">
            Payment confirmed!
          </p>
          <p className="text-xs text-green-600">
            Redirecting to your order...
          </p>
        </motion.div>
      )}

      {state === "failed" && (
        <div className="flex flex-col gap-4">
          <div className="border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error ?? "Payment failed."}
            </p>
          </div>
          <Button onClick={handleRetry} variant="ghost">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}