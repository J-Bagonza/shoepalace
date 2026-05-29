"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupSchema } from "@/lib/validations/auth";
import type { ApiResponse } from "@/types/api";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = signupSchema.safeParse({ email, password });

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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const json = (await res.json()) as ApiResponse<{ message: string }>;

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Check Your Email
        </h1>
        <p className="text-sm text-neutral-500">
          We sent a confirmation link to{" "}
          <span className="font-medium text-neutral-900">{email}</span>.
          Click it to activate your account.
        </p>
        <Link
          href="/login"
          className="text-sm text-neutral-900 underline underline-offset-4 hover:text-[#E8001D]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Create Account
        </h1>
        <p className="text-sm text-neutral-500">
          Join ShoePalace for exclusive access.
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors["password"]}
          required
        />

        <p className="text-xs text-neutral-400">
          Min 8 characters, one uppercase letter, one number.
        </p>

        <Button type="submit" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-neutral-900 underline underline-offset-4 hover:text-[#E8001D]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}