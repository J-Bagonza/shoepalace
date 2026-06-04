"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StepShell, markStepComplete } from "./step-shell";

interface Props {
  storeName: string;
  logoUrl: string | null;
}

export function OnboardingIdentityStep({ storeName, logoUrl: initial }: Props) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
    } catch {
      setUploadError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  async function handleNext() {
    setSaving(true);
    await markStepComplete("step_identity");
    router.push("/admin/onboarding/contact");
  }

  return (
    <StepShell
      title="Your Store Identity"
      description="Your store name has been set. Upload a logo to make your store look professional. You can always change this later."
      onNext={handleNext}
      nextLoading={saving}
    >
      <div className="flex flex-col gap-6">
        {/* Store name — read only */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest
            text-neutral-500">
            Store Name
          </label>
          <div className="border border-neutral-100 bg-neutral-50 px-4 py-3">
            <p className="text-sm font-medium text-neutral-900">{storeName}</p>
          </div>
          <p className="text-[10px] text-neutral-400">
            Contact support to change your store name.
          </p>
        </div>

        {/* Logo upload */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium uppercase tracking-widest
            text-neutral-500">
            Store Logo (optional)
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
                  {uploading ? "Uploading..." : "Replace logo"}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 px-6 py-10
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
            <p className="text-xs text-[#E8001D]">{uploadError}</p>
          )}
        </div>
      </div>
    </StepShell>
  );
}