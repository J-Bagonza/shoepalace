"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FormValues {
  store_name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  phone: string;
  description: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

export default function RegisterStorePage() {
  const [values, setValues] = useState<FormValues>({
    store_name: "",
    slug: "",
    owner_name: "",
    owner_email: "",
    phone: "",
    description: "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function set(key: keyof FormValues, value: string) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-generate slug from store name unless manually edited
      if (key === "store_name" && !slugManuallyEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setServerError(null);
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    set("slug", slugify(value));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!values.store_name.trim() || values.store_name.length < 2) {
      newErrors["store_name"] = "Store name must be at least 2 characters";
    }
    if (!values.slug || values.slug.length < 2) {
      newErrors["slug"] = "Store URL must be at least 2 characters";
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      newErrors["slug"] =
        "Store URL can only contain lowercase letters, numbers and hyphens";
    }
    if (!values.owner_name.trim() || values.owner_name.length < 2) {
      newErrors["owner_name"] = "Full name is required";
    }
    if (
      !values.owner_email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.owner_email)
    ) {
      newErrors["owner_email"] = "Valid email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/platform/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: values.store_name,
          slug: values.slug,
          owner_name: values.owner_name,
          owner_email: values.owner_email,
          phone: values.phone || undefined,
          description: values.description || undefined,
        }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center
        px-6 bg-[#F5F0E8]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Request Submitted
            </h1>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Thank you. Your store application for{" "}
              <span className="font-medium text-neutral-900">
                {values.slug}.shoepalace.com
              </span>{" "}
              has been submitted.
            </p>
          </div>
          <div className="border border-neutral-100 bg-[#F5F0E8] p-4
            flex flex-col gap-1">
            <p className="text-xs font-medium text-neutral-700">
              What happens next?
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We will review your application and contact you at{" "}
              <span className="font-medium">{values.owner_email}</span>{" "}
              within 24 hours.
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center
      px-6 bg-[#F5F0E8] py-12">
      <div className="w-full max-w-lg bg-white p-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="font-bebas text-2xl tracking-widest text-neutral-900
                hover:text-[#E8001D] transition-colors"
            >
              ShoePalace
            </Link>
            <h1 className="font-bebas text-3xl tracking-wide text-neutral-900">
              Open Your Store
            </h1>
            <p className="text-sm text-neutral-500">
              Apply to sell on ShoePalace. We review all applications
              manually — approved stores go live within 24 hours.
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="border border-[#E8001D] bg-red-50 px-4 py-3
                text-sm text-[#E8001D]"
            >
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            <fieldset className="flex flex-col gap-4">
              <legend className="text-[10px] uppercase tracking-widest
                text-neutral-400 mb-1">
                Store Details
              </legend>

              <Input
                label="Store Name"
                value={values.store_name}
                onChange={(e) => set("store_name", e.target.value)}
                error={errors["store_name"]}
                placeholder="My Shoe Store"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase
                  tracking-widest text-neutral-500">
                  Store URL
                </label>
                <div className="flex items-center border border-neutral-300
                  focus-within:border-neutral-900 transition-colors">
                  <span className="px-3 py-3 text-xs text-neutral-400
                    bg-neutral-50 border-r border-neutral-200 shrink-0">
                    shoepalace.com/
                  </span>
                  <input
                    type="text"
                    value={values.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-store"
                    className="flex-1 px-3 py-3 text-sm text-neutral-900
                      focus:outline-none bg-white"
                  />
                </div>
                {errors["slug"] && (
                  <p className="text-xs text-[#E8001D]" role="alert">
                    {errors["slug"]}
                  </p>
                )}
                {values.slug && !errors["slug"] && (
                  <p className="text-[10px] text-neutral-400">
                    Your store will be at{" "}
                    <span className="font-medium text-neutral-600">
                      {values.slug}.shoepalace.com
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase
                  tracking-widest text-neutral-500">
                  About Your Store (optional)
                </label>
                <textarea
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="What do you sell? Tell us a bit about your business."
                  className="w-full border border-neutral-300 bg-white px-4 py-3
                    text-sm text-neutral-900 placeholder:text-neutral-400
                    focus:border-neutral-900 focus:outline-none resize-none
                    transition-colors"
                />
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="text-[10px] uppercase tracking-widest
                text-neutral-400 mb-1">
                Your Details
              </legend>

              <Input
                label="Full Name"
                value={values.owner_name}
                onChange={(e) => set("owner_name", e.target.value)}
                error={errors["owner_name"]}
                autoComplete="name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={values.owner_email}
                onChange={(e) => set("owner_email", e.target.value)}
                error={errors["owner_email"]}
                autoComplete="email"
                required
              />
              <Input
                label="Phone (optional)"
                type="tel"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                autoComplete="tel"
              />
            </fieldset>

            <Button type="submit" loading={loading}>
              Submit Application
            </Button>
          </form>

          <p className="text-center text-xs text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-neutral-700 hover:text-neutral-900
                transition-colors underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}