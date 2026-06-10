"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signinSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

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

      {/* Google sign in */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full border border-neutral-300 bg-white px-4 py-3
          text-sm text-neutral-700 hover:border-neutral-900
          transition-colors flex items-center justify-center gap-3
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-100" />
        <span className="text-xs uppercase tracking-widest text-neutral-400">
          or
        </span>
        <div className="flex-1 h-px bg-neutral-100" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {serverError && (
          <div
            role="alert"
            className="border border-[#E8001D] bg-red-50 px-4 py-3
              text-sm text-[#E8001D]"
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

        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100">
          <p className="text-center text-xs text-neutral-400">
            Want to sell on ShoePalace?{" "}
            <Link
              href="/register-store"
              className="text-neutral-700 hover:text-neutral-900
                transition-colors underline underline-offset-2"
            >
              Apply to open a store
            </Link>
          </p>
        </div>
      </form>

      <p className="text-center text-sm text-neutral-500">
        No account?{" "}
        <Link
          href="/signup"
          className="text-neutral-900 underline underline-offset-4
            hover:text-[#E8001D]"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}