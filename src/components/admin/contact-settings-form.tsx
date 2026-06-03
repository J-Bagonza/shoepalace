"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TenantSettings } from "@/types/tenant";

interface ContactSettingsFormProps {
  settings: TenantSettings | null;
}

export function ContactSettingsForm({ settings }: ContactSettingsFormProps) {
  const router = useRouter();

  const [values, setValues] = useState({
    tagline: settings?.tagline ?? "",
    contact_email: settings?.contact_email ?? "",
    contact_phone: settings?.contact_phone ?? "",
    contact_address: settings?.contact_address ?? "",
    instagram_url: settings?.instagram_url ?? "",
    whatsapp_number: settings?.whatsapp_number ?? "",
    shipping_info: settings?.shipping_info ?? "",
    returns_info: settings?.returns_info ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to save settings.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
      <Input
        label="Store Tagline"
        value={values.tagline}
        onChange={(e) => set("tagline", e.target.value)}
        placeholder="Precision-crafted footwear..."
      />

      <div className="h-px bg-neutral-100" />

      <Input
        label="Contact Email"
        type="email"
        value={values.contact_email}
        onChange={(e) => set("contact_email", e.target.value)}
        placeholder="hello@yourstore.co.ke"
      />

      <Input
        label="Phone / WhatsApp"
        value={values.contact_phone}
        onChange={(e) => set("contact_phone", e.target.value)}
        placeholder="+254 700 000 000"
      />

      <Input
        label="WhatsApp Number (international format)"
        value={values.whatsapp_number}
        onChange={(e) => set("whatsapp_number", e.target.value)}
        placeholder="+254700000000"
      />

      <Input
        label="Location / Address"
        value={values.contact_address}
        onChange={(e) => set("contact_address", e.target.value)}
        placeholder="Nairobi, Kenya"
      />

      <Input
        label="Instagram URL"
        type="url"
        value={values.instagram_url}
        onChange={(e) => set("instagram_url", e.target.value)}
        placeholder="https://instagram.com/yourstore"
      />

      <div className="h-px bg-neutral-100" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest
          text-neutral-500">
          Shipping Info
        </label>
        <textarea
          value={values.shipping_info}
          onChange={(e) => set("shipping_info", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Nairobi 1-2 days. Rest of Kenya 3-5 days."
          className="w-full border border-neutral-300 bg-white px-4 py-3
            text-sm text-neutral-900 placeholder:text-neutral-400
            focus:border-neutral-900 focus:outline-none resize-none
            transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest
          text-neutral-500">
          Returns Info
        </label>
        <textarea
          value={values.returns_info}
          onChange={(e) => set("returns_info", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Unworn items within 30 days..."
          className="w-full border border-neutral-300 bg-white px-4 py-3
            text-sm text-neutral-900 placeholder:text-neutral-400
            focus:border-neutral-900 focus:outline-none resize-none
            transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
      )}

      {success && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-600 uppercase tracking-widest"
        >
          Settings saved.
        </motion.p>
      )}

      <Button type="submit" loading={loading} className="w-auto">
        Save Settings
      </Button>
    </form>
  );
}