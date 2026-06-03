"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/types/tenant";

interface StoreIdentityFormProps {
  tenant: Tenant;
}

export function StoreIdentityForm({ tenant }: StoreIdentityFormProps) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant.logo_url);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/logo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json() as {
        data: { url: string } | null;
        error: string | null;
      };

      if (!res.ok || !json.data) {
        setUploadError(json.error ?? "Upload failed.");
        return;
      }

      setLogoUrl(json.data.url);
      setSuccess(true);
      router.refresh();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Store name — read only, changed by platform admin only */}
      <div className="flex flex-col gap-2">
        <Input
          label="Store Name"
          value={tenant.name}
          disabled
          onChange={() => {}}
        />
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
          Store name is set by the platform. Contact support to change it.
        </p>
      </div>

      {/* Subdomain — read only */}
      <div className="flex flex-col gap-2">
        <Input
          label="Your Store URL"
          value={`${tenant.slug}.shoepalace.com`}
          disabled
          onChange={() => {}}
        />
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-4">
        <label className="text-xs font-medium uppercase tracking-widest
          text-neutral-500">
          Store Logo
        </label>

        {logoUrl ? (
          <div className="flex items-center gap-6">
            <div className="relative h-16 w-16 border border-neutral-100
              bg-[#F5F0E8] overflow-hidden">
              <Image
                src={logoUrl}
                alt="Store logo"
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs uppercase tracking-widest text-neutral-500
                  hover:text-neutral-900 transition-colors underline
                  underline-offset-4"
              >
                {uploading ? "Uploading..." : "Replace Logo"}
              </button>
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="text-xs uppercase tracking-widest text-neutral-400
                  hover:text-[#E8001D] transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-neutral-200 px-6 py-8
              text-center cursor-pointer hover:border-neutral-400
              transition-colors"
          >
            {uploading ? (
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Uploading...
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-widest text-neutral-500">
                  Click to upload logo
                </p>
                <p className="text-[10px] text-neutral-300 uppercase
                  tracking-widest">
                  JPEG, PNG, WebP, SVG — Max 1MB
                </p>
              </div>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleLogoUpload}
        />

        {uploadError && (
          <p className="text-xs text-[#E8001D]" role="alert">
            {uploadError}
          </p>
        )}

        {success && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-green-600 uppercase tracking-widest"
          >
            Logo updated successfully.
          </motion.p>
        )}
      </div>
    </div>
  );
}