"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface ModelUploadProps {
  productId: string;
  existingUrl?: string | null;
  onChange?: (url: string | null) => void;
}

export function ModelUpload({
  productId,
  existingUrl,
  onChange,
}: ModelUploadProps) {
  const [url, setUrl] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    // Client-side pre-check
    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      setError("Only .glb or .gltf files are allowed.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Model must be under 50MB.");
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", productId);
    formData.append("type", "model");

    try {
      // Use XMLHttpRequest for upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText) as {
                data: { url: string } | null;
                error: string | null;
              };
              if (json.data?.url) {
                setUrl(json.data.url);
                onChange?.(json.data.url);
                resolve();
              } else {
                reject(new Error(json.error ?? "Upload failed."));
              }
            } catch {
              reject(new Error("Invalid response."));
            }
          } else {
            reject(new Error("Upload failed."));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error.")));
        xhr.open("POST", "/api/admin/uploads");
        xhr.send(formData);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function handleRemove() {
    setUrl(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-4">
      {url ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between border
            border-neutral-200 px-4 py-3"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs uppercase tracking-widest
              text-neutral-500">
              Model Uploaded
            </span>
            <span className="text-[10px] text-neutral-400 truncate
              max-w-xs">
              {url}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] uppercase tracking-widest text-neutral-400
              hover:text-[#E8001D] transition-colors ml-4 shrink-0"
          >
            Remove
          </button>
        </motion.div>
      ) : (
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
            accept=".glb,.gltf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-48 h-px bg-neutral-200 overflow-hidden">
                <motion.div
                  className="h-full bg-neutral-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Uploading {progress}%
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Drop .glb file here or click to browse
              </p>
              <p className="text-[10px] text-neutral-300 uppercase
                tracking-widest">
                GLB or GLTF — Max 50MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}