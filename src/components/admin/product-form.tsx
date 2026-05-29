"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminProductFormSchema,
  slugify,
  type AdminProductFormValues,
} from "@/lib/validations/admin-product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

const CATEGORIES = [
  { value: "running", label: "Running" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "hiking", label: "Hiking" },
] as const;

type FieldErrors = Partial<Record<keyof AdminProductFormValues, string>>;

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<AdminProductFormValues>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    category: product?.category ?? "running",
    is_featured: product?.is_featured ?? false,
    model_url: product?.model_url ?? null,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(mode === "create");

  // Auto-generate slug from name in create mode
  useEffect(() => {
    if (autoSlug && mode === "create") {
      setValues((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [values.name, autoSlug, mode]);

  function set<K extends keyof AdminProductFormValues>(
    key: K,
    value: AdminProductFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const result = adminProductFormSchema.safeParse(values);
    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const errors: FieldErrors = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0] as keyof AdminProductFormValues;
      if (!errors[key]) errors[key] = issue.message;
    });
    setFieldErrors(errors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product!.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-8 max-w-2xl"
    >
      {serverError && (
        <div
          role="alert"
          className="border border-[#E8001D] bg-red-50 px-4 py-3
            text-sm text-[#E8001D]"
        >
          {serverError}
        </div>
      )}

      {/* Basic info */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs uppercase tracking-widest
          text-neutral-400 mb-2">
          Basic Information
        </legend>

        <Input
          label="Product Name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          error={fieldErrors.name}
          placeholder="e.g. Apex Runner Pro"
          required
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Slug"
            value={values.slug}
            onChange={(e) => {
              setAutoSlug(false);
              set("slug", e.target.value);
            }}
            error={fieldErrors.slug}
            placeholder="e.g. apex-runner-pro"
            required
          />
          {mode === "create" && autoSlug && (
            <p className="text-[10px] text-neutral-400 uppercase
              tracking-widest">
              Auto-generated from name
            </p>
          )}
          {mode === "create" && !autoSlug && (
            <button
              type="button"
              onClick={() => setAutoSlug(true)}
              className="self-start text-[10px] uppercase tracking-widest
                text-neutral-400 underline hover:text-neutral-900
                transition-colors"
            >
              Reset to auto
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest
            text-neutral-500">
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Describe the product..."
            className={`w-full border bg-white px-4 py-3 text-sm
              text-neutral-900 placeholder:text-neutral-400
              focus:border-neutral-900 focus:outline-none
              transition-colors duration-150 resize-none
              ${fieldErrors.description
                ? "border-[#E8001D]"
                : "border-neutral-300"
              }`}
          />
          <div className="flex items-center justify-between">
            {fieldErrors.description ? (
              <p className="text-xs text-[#E8001D]" role="alert">
                {fieldErrors.description}
              </p>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-neutral-300">
              {values.description.length}/5000
            </span>
          </div>
        </div>
      </fieldset>

      {/* Pricing + category */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs uppercase tracking-widest
          text-neutral-400 mb-2">
          Pricing & Classification
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest
              text-neutral-500">
              Price (GBP)
            </label>
            <input
              type="number"
              value={values.price === 0 ? "" : values.price}
              onChange={(e) =>
                set("price", parseFloat(e.target.value) || 0)
              }
              step="0.01"
              min="0.01"
              max="99999.99"
              placeholder="0.00"
              className={`w-full border bg-white px-4 py-3 text-sm
                text-neutral-900 placeholder:text-neutral-400
                focus:border-neutral-900 focus:outline-none
                transition-colors duration-150
                ${fieldErrors.price
                  ? "border-[#E8001D]"
                  : "border-neutral-300"
                }`}
            />
            {fieldErrors.price && (
              <p className="text-xs text-[#E8001D]" role="alert">
                {fieldErrors.price}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest
              text-neutral-500">
              Category
            </label>
            <select
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={`w-full border bg-white px-4 py-3 text-sm
                text-neutral-900 focus:border-neutral-900 focus:outline-none
                transition-colors duration-150 appearance-none
                ${fieldErrors.category
                  ? "border-[#E8001D]"
                  : "border-neutral-300"
                }`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="text-xs text-[#E8001D]" role="alert">
                {fieldErrors.category}
              </p>
            )}
          </div>
        </div>

        {/* Featured toggle */}
        <div className="flex items-center justify-between border
          border-neutral-200 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-widest
              text-neutral-700">
              Featured Product
            </span>
            <span className="text-[10px] text-neutral-400">
              Appears on homepage and featured collections
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.is_featured}
            onClick={() => set("is_featured", !values.is_featured)}
            className={`relative h-6 w-11 transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-neutral-900
              ${values.is_featured ? "bg-neutral-900" : "bg-neutral-200"}`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`absolute top-1 h-4 w-4 bg-white shadow-sm
                ${values.is_featured ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
      </fieldset>

      {/* 3D Model URL */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs uppercase tracking-widest
          text-neutral-400 mb-2">
          3D Model
        </legend>

        <Input
          label="Model URL (optional)"
          type="url"
          value={values.model_url ?? ""}
          onChange={(e) =>
            set("model_url", e.target.value || null)
          }
          error={fieldErrors.model_url}
          placeholder="https://your-storage.supabase.co/..."
        />
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest
          -mt-3">
          Upload your .glb file via the upload section, then paste the URL here.
        </p>
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t
        border-neutral-100">
        <Button type="submit" loading={loading} className="w-auto px-8">
          {mode === "create" ? "Create Product" : "Save Changes"}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs uppercase tracking-widest text-neutral-400
            hover:text-neutral-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}