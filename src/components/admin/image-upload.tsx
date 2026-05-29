"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface UploadedImage {
  url: string;
  path: string;
  alt: string;
  position: number;
}

interface ImageUploadProps {
  productId: string;
  existingImages?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
}

export function ImageUpload({
  productId,
  existingImages = [],
  onChange,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    formData.append("type", "image");

    const res = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    const json = await res.json() as {
      data: { url: string; path: string } | null;
      error: string | null;
    };

    if (!res.ok || !json.data) {
      throw new Error(json.error ?? "Upload failed.");
    }

    return json.data;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      // Client-side pre-check (server validates authoritatively)
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be under 5MB.");
        continue;
      }

      try {
        const result = await uploadFile(file);
        newImages.push({
          url: result.url,
          path: result.path,
          alt: file.name.replace(/\.[^.]+$/, ""),
          position: images.length + newImages.length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }

    if (newImages.length > 0) {
      const updated = [...images, ...newImages];
      setImages(updated);
      onChange?.(updated);
    }

    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, position: i }));
    setImages(updated);
    onChange?.(updated);
  }

  function updateAlt(index: number, alt: string) {
    const updated = images.map((img, i) =>
      i === index ? { ...img, alt } : img,
    );
    setImages(updated);
    onChange?.(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "relative border-2 border-dashed px-6 py-10 text-center",
          "cursor-pointer transition-colors duration-150",
          dragOver
            ? "border-neutral-900 bg-neutral-50"
            : "border-neutral-200 hover:border-neutral-400",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 w-4 border-2 border-neutral-300
              border-t-neutral-900 rounded-full animate-spin" />
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              Uploading...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Drop images here or click to browse
            </p>
            <p className="text-[10px] text-neutral-300 uppercase
              tracking-widest">
              JPEG, PNG, WebP, AVIF — Max 5MB each
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">
          {error}
        </p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {images.map((img, i) => (
              <motion.div
                key={img.url}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <div className="relative aspect-square bg-[#F5F0E8]
                  overflow-hidden group">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-neutral-900
                      text-white text-[8px] uppercase tracking-widest px-1.5
                      py-0.5">
                      Primary
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 h-5 w-5 bg-white
                      text-neutral-900 text-[10px] flex items-center
                      justify-center opacity-0 group-hover:opacity-100
                      transition-opacity hover:bg-[#E8001D]
                      hover:text-white"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>

                {/* Alt text */}
                <input
                  type="text"
                  value={img.alt}
                  onChange={(e) => updateAlt(i, e.target.value)}
                  placeholder="Alt text"
                  maxLength={255}
                  className="w-full border border-neutral-200 px-2 py-1
                    text-[10px] text-neutral-600 focus:border-neutral-900
                    focus:outline-none"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}