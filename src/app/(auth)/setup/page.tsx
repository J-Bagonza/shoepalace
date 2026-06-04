"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [values, setValues] = useState({
    full_name: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  function set(key: keyof typeof values, val: string) {
    setValues((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
    setServerError(null);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!values.full_name.trim() || values.full_name.length < 2) {
      errs["full_name"] = "Full name is required";
    }
    if (values.password.length < 8) {
      errs["password"] = "Password must be at least 8 characters";
    }
    if (values.password !== values.confirm_password) {
      errs["confirm_password"] = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: values.password,
          full_name: values.full_name,
        }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      setDone(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center
        px-6 bg-[#F5F0E8]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white p-10 flex flex-col gap-6"
        >
          <div className="h-12 w-12 bg-neutral-900 flex items-center
            justify-center">
            <span className="text-white text-xl">✓</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Account Created
            </h1>
            <p className="text-sm text-neutral-500">
              Your store admin account is ready. Sign in to start
              setting up your store.
            </p>
          </div>
          <Link
            href="/login"
            className="bg-neutral-900 text-white px-6 py-3 text-xs
              uppercase tracking-widest text-center hover:bg-neutral-700
              transition-colors"
          >
            Sign In to Your Store
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center
      px-6 bg-[#F5F0E8]">
      <div className="w-full max-w-sm bg-white p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Create Your Admin Account
            </h1>
            <p className="text-sm text-neutral-500">
              Set your name and password to access your store dashboard.
            </p>
          </div>

          {serverError && (
            <div className="border border-[#E8001D] bg-red-50 px-4 py-3
              text-sm text-[#E8001D]">
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <Input
              label="Full Name"
              value={values.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              error={errors["full_name"]}
              autoComplete="name"
              required
            />
            <Input
              label="Password"
              type="password"
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              error={errors["password"]}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={values.confirm_password}
              onChange={(e) => set("confirm_password", e.target.value)}
              error={errors["confirm_password"]}
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}