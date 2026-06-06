"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminProductFormSchema,
  slugify,
  type AdminProductFormValues,
} from "@/lib/validations/admin-product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

useEffect(() => {
  fetch("/api/admin/categories")
    .then((r) => r.json())
    .then((json: { data: { id: string; name: string; slug: string }[] }) => {
      if (json.data?.length) setCategories(json.data);
    })
    .catch(() => null);
}, []); 

type FieldErrors = Partial<Record<keyof AdminProductFormValues, string>>;

interface UploadedImage {
  url: string;
  alt: string;
  position: number;
}

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
  const [savedProductId, setSavedProductId] = useState<string | null>(
    product?.id ?? null,
  );

  // Image upload state
  const [images, setImages] = useState<UploadedImage[]>(
    (product?.images ?? [])
      .sort((a, b) => a.position - b.position)
      .map((img, i) => ({ url: img.url, alt: img.alt, position: i })),
  );
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Model upload state
  const [modelUrl, setModelUrl] = useState<string | null>(
    product?.model_url ?? null,
  );
  const [modelUploading, setModelUploading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelDragOver, setModelDragOver] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);

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

  // Save or update product details, returns productId
  async function saveProductDetails(): Promise<string | null> {
    if (!validate()) return null;
    setLoading(true);
    setServerError(null);

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${product!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const payload = { ...values, model_url: modelUrl };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        data?: { id: string };
        error: string | null;
      };

      if (!res.ok || json.error) {
        setServerError(json.error ?? "Something went wrong.");
        return null;
      }

      return json.data?.id ?? savedProductId;
    } catch {
      setServerError("Network error. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = await saveProductDetails();
    if (!id) return;
    router.push("/admin/products");
    router.refresh();
  }

  // Get signed URL from our API
  async function getSignedUrl(
    productId: string,
    type: "image" | "model",
    filename: string,
  ) {
    const res = await fetch("/api/admin/uploads/signed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, type, filename }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      throw new Error(json.error ?? "Failed to get upload URL.");
    }

    const json = (await res.json()) as {
      data: {
        signedUrl: string;
        token: string;
        path: string;
        publicUrl: string;
      };
    };

    return json.data;
  }

  // Ensure product is saved before uploading files
  async function ensureProductSaved(): Promise<string | null> {
    if (savedProductId) return savedProductId;
    const id = await saveProductDetails();
    if (id) setSavedProductId(id);
    return id;
  }

  // Image upload
  async function handleImageFiles(files: FileList) {
    setImageError(null);
    const productId = await ensureProductSaved();
    if (!productId) return;

    setImageUploading(true);
    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          setImageError("Only image files are allowed.");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setImageError("Each image must be under 10MB.");
          continue;
        }

        const { token, path, publicUrl } = await getSignedUrl(
          productId,
          "image",
          file.name,
        );

        const { error } = await supabase.storage
          .from("product-images")
          .uploadToSignedUrl(path, token, file, { contentType: file.type });

        if (error) throw new Error(error.message);

        // Save image record to product_images table
        const position = images.length;
        const saveRes = await fetch("/api/admin/uploads/image-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, url: publicUrl, alt: "", position }),
        });
        if (!saveRes.ok) throw new Error("Failed to save image record.");

        const newImage: UploadedImage = {
          url: publicUrl,
          alt: "",
          position,
        };
        setImages((prev) => [...prev, newImage]);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((img, i) => ({ ...img, position: i })),
    );
  }

  // Model upload
  async function handleModelFile(file: File) {
    setModelError(null);

    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      setModelError("Only .glb or .gltf files are allowed.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setModelError("Model must be under 50MB.");
      return;
    }

    const productId = await ensureProductSaved();
    if (!productId) return;

    setModelUploading(true);
    setModelProgress(10);

    try {
      const { token, path, publicUrl } = await getSignedUrl(
        productId,
        "model",
        file.name,
      );

      setModelProgress(30);

      const supabase = createClient();
      const { error } = await supabase.storage
        .from("product-models")
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || "model/gltf-binary",
        });

      if (error) throw new Error(error.message);

      setModelProgress(100);
      setModelUrl(publicUrl);
      set("model_url", publicUrl);
    } catch (err) {
      setModelError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setModelUploading(false);
      setModelProgress(0);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-10 max-w-2xl"
    >
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="border border-[#E8001D] bg-red-50 px-4 py-3 text-sm text-[#E8001D]"
          >
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic info */}
      <fieldset className="flex flex-col gap-5">
        <legend className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
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
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
              Auto-generated from name
            </p>
          )}
          {mode === "create" && !autoSlug && (
            <button
              type="button"
              onClick={() => setAutoSlug(true)}
              className="self-start text-[10px] uppercase tracking-widest text-neutral-400 underline hover:text-neutral-900 transition-colors"
            >
              Reset to auto
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Describe the product..."
            className={`w-full border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition-colors duration-150 resize-none ${
              fieldErrors.description ? "border-[#E8001D]" : "border-neutral-300"
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
        <legend className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          Pricing & Classification
        </legend>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Price (GBP)
            </label>
            <input
              type="number"
              value={values.price === 0 ? "" : values.price}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0.01"
              max="99999.99"
              placeholder="0.00"
              className={`w-full border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition-colors duration-150 ${
                fieldErrors.price ? "border-[#E8001D]" : "border-neutral-300"
              }`}
            />
            {fieldErrors.price && (
              <p className="text-xs text-[#E8001D]" role="alert">
                {fieldErrors.price}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Category
            </label>
            <select
  value={values.category}
  onChange={(e) => set("category", e.target.value)}
  className={`w-full border bg-white px-4 py-3 text-sm text-neutral-900
    focus:border-neutral-900 focus:outline-none transition-colors
    duration-150 appearance-none ${
    fieldErrors.category ? "border-[#E8001D]" : "border-neutral-300"
  }`}
>
  {categories.length === 0 ? (
    <option value="">Loading categories...</option>
  ) : (
    categories.map((cat) => (
      <option key={cat.id} value={cat.slug}>
        {cat.name}
      </option>
    ))
  )}
</select>
          </div>
        </div>

        {/* Featured toggle */}
        <div className="flex items-center justify-between border border-neutral-200 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-widest text-neutral-700">
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
            className={`relative h-6 w-11 transition-colors duration-200 ${
              values.is_featured ? "bg-neutral-900" : "bg-neutral-200"
            }`}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`absolute top-1 h-4 w-4 bg-white shadow-sm ${
                values.is_featured ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </fieldset>

      {/* ── PRODUCT IMAGES ── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          Product Images
        </legend>
        <p className="text-[10px] text-neutral-300 uppercase tracking-widest -mt-2">
          First image is the primary display image. Max 10MB each.
        </p>

        {/* Existing images grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <motion.div
                key={img.url}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square border border-neutral-200 overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt || `Product image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-neutral-900 text-white text-[8px] uppercase tracking-widest px-1.5 py-0.5">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-white border border-neutral-200 text-neutral-500 hover:text-[#E8001D] w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <div
          onClick={() => imageInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 px-6 py-8 text-center cursor-pointer transition-colors duration-150"
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void handleImageFiles(e.target.files);
            }}
          />
          {imageUploading ? (
            <p className="text-xs uppercase tracking-widest text-neutral-400 animate-pulse">
              Uploading...
            </p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Click to upload images
              </p>
              <p className="text-[10px] text-neutral-300 uppercase tracking-widest">
                JPG, PNG, WEBP — Multiple allowed
              </p>
            </div>
          )}
        </div>

        {imageError && (
          <p className="text-xs text-[#E8001D]" role="alert">
            {imageError}
          </p>
        )}
      </fieldset>

      {/* ── 3D MODEL ── */}
      <fieldset className="flex flex-col gap-4">
        <legend className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          3D Model
        </legend>
        <p className="text-[10px] text-neutral-300 uppercase tracking-widest -mt-2">
          Upload a .glb file to enable the 3D viewer on the product page. Max 50MB.
        </p>

        {modelUrl ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between border border-neutral-200 px-4 py-3"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs uppercase tracking-widest text-neutral-500">
                Model Uploaded
              </span>
              <span className="text-[10px] text-neutral-400 truncate max-w-xs">
                {modelUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setModelUrl(null);
                set("model_url", null);
              }}
              className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-[#E8001D] transition-colors ml-4 shrink-0"
            >
              Remove
            </button>
          </motion.div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setModelDragOver(true);
            }}
            onDragLeave={() => setModelDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setModelDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) void handleModelFile(file);
            }}
            onClick={() => modelInputRef.current?.click()}
            className={`border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-150 ${
              modelDragOver
                ? "border-neutral-900 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <input
              ref={modelInputRef}
              type="file"
              accept=".glb,.gltf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleModelFile(file);
              }}
            />
            {modelUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-px bg-neutral-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-neutral-900"
                    initial={{ width: 0 }}
                    animate={{ width: `${modelProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="text-xs uppercase tracking-widest text-neutral-400">
                  Uploading {modelProgress}%
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest text-neutral-500">
                  Drop .glb file here or click to browse
                </p>
                <p className="text-[10px] text-neutral-300 uppercase tracking-widest">
                  GLB or GLTF — Max 50MB
                </p>
              </div>
            )}
          </div>
        )}

        {modelError && (
          <p className="text-xs text-[#E8001D]" role="alert">
            {modelError}
          </p>
        )}
      </fieldset>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-neutral-100">
        <Button type="submit" loading={loading} className="w-auto px-8">
          {mode === "create" ? "Create Product" : "Save Changes"}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}