"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center
      px-6 bg-[#F5F0E8]">
      <div className="w-full max-w-sm bg-white p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Reset Password
            </h1>
            <p className="text-sm text-neutral-500">
              Enter your email and we will send you a reset link.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="border border-green-200 bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  If an account exists for{" "}
                  <span className="font-medium">{email}</span>, a reset
                  link has been sent.
                </p>
              </div>
              <Link
                href="/login"
                className="text-xs uppercase tracking-widest text-neutral-400
                  hover:text-neutral-900 transition-colors"
              >
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              {error && (
                <p className="text-xs text-[#E8001D]" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading}>
                Send Reset Link
              </Button>

              <Link
                href="/login"
                className="text-center text-xs uppercase tracking-widest
                  text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}