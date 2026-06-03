"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signinSchema } from "@/lib/validations/auth";
import type { ApiResponse } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = signinSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const json = (await res.json()) as ApiResponse<{ message: string }>;

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Sign In
        </h1>
        <p className="text-sm text-neutral-500">
          Welcome back to ShoePalace.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <div
            role="alert"
            className="border border-[#E8001D] bg-red-50 px-4 py-3 text-sm text-[#E8001D]"
          >
            {serverError}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors["email"]}
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors["password"]}
          required
        />

        <Button type="submit" loading={loading}>
          Sign In
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-xs uppercase tracking-widest
            text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Forgot password?
        </Link>
      </form>

      <p className="text-center text-sm text-neutral-500">
        No account?{" "}
        <Link
          href="/signup"
          className="text-neutral-900 underline underline-offset-4 hover:text-[#E8001D]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}