"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { StepShell, markStepComplete } from "./step-shell";

const CATEGORIES = [
  "running",
  "lifestyle",
  "hiking",
  "formal",
  "casual",
  "sport",
] as const;

export function OnboardingProductStep() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    description: "",
    price: "",
    category: "lifestyle",
  });
  const [variants, setVariants] = useState([
    { size: "UK 7", color: "Black", stock: "10" },
    { size: "UK 8", color: "Black", stock: "10" },
    { size: "UK 9", color: "Black", stock: "10" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof values, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function setVariant(
    i: number,
    key: keyof (typeof variants)[number],
    val: string,
  ) {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [key]: val } : v)),
    );
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { size: "", color: "Black", stock: "5" },
    ]);
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function handleNext() {
    setError(null);

    if (!values.name.trim()) {
      setError("Product name is required.");
      return;
    }
    const price = parseFloat(values.price);
    if (isNaN(price) || price <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (variants.length === 0) {
      setError("Add at least one size variant.");
      return;
    }

    setSaving(true);

    try {
      // Create product
      const productRes = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || "New product",
          price,
          category: values.category,
          slug: generateSlug(values.name),
          is_featured: true,
          variants: variants
            .filter((v) => v.size.trim())
            .map((v) => ({
              size: v.size,
              color: v.color,
              stock: parseInt(v.stock, 10) || 0,
            })),
        }),
      });

      const productJson = await productRes.json() as {
        error: string | null;
      };

      if (!productRes.ok || productJson.error) {
        setError(productJson.error ?? "Failed to create product.");
        return;
      }

      await markStepComplete("step_first_product");
      router.push("/admin/onboarding/payment");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Add Your First Product"
      description="Add a shoe to your store. You can add more products, images and variants from your admin dashboard after setup."
      onNext={handleNext}
      nextLoading={saving}
      skipHref="/admin/onboarding/payment"
      backHref="/admin/onboarding/contact"
    >
      <div className="flex flex-col gap-6">
        {/* Product details */}
        <div className="flex flex-col gap-4">
          <Input
            label="Product Name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Air Max 90"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest
              text-neutral-500">
              Description
            </label>
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="w-full border border-neutral-300 bg-white px-4 py-3
                text-sm text-neutral-900 placeholder:text-neutral-400
                focus:border-neutral-900 focus:outline-none resize-none
                transition-colors"
              placeholder="Brief product description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (KES)"
              type="number"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="5000"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest
                text-neutral-500">
                Category
              </label>
              <select
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                className="border border-neutral-300 bg-white px-4 py-3
                  text-sm text-neutral-900 focus:border-neutral-900
                  focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium uppercase tracking-widest
            text-neutral-500">
            Sizes & Stock
          </label>

          <div className="flex flex-col gap-2">
            {variants.map((variant, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_auto]
                gap-2 items-center">
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => setVariant(i, "size", e.target.value)}
                  placeholder="UK 8"
                  className="border border-neutral-200 px-3 py-2 text-xs
                    text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e) => setVariant(i, "color", e.target.value)}
                  placeholder="Black"
                  className="border border-neutral-200 px-3 py-2 text-xs
                    text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => setVariant(i, "stock", e.target.value)}
                  min="0"
                  placeholder="Qty"
                  className="border border-neutral-200 px-3 py-2 text-xs
                    text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-neutral-300 hover:text-[#E8001D]
                    transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="self-start text-xs uppercase tracking-widest
              text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            + Add Size
          </button>
        </div>

        {error && (
          <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
        )}
      </div>
    </StepShell>
  );
}