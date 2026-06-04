"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { StepShell, markStepComplete } from "./step-shell";
import type { TenantSettings } from "@/types/tenant";

interface Props {
  settings: TenantSettings | null;
}

export function OnboardingContactStep({ settings }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    contact_email: settings?.contact_email ?? "",
    contact_phone: settings?.contact_phone ?? "",
    contact_address: settings?.contact_address ?? "",
    whatsapp_number: settings?.whatsapp_number ?? "",
    tagline: settings?.tagline ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof values, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleNext() {
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json() as { error: string | null };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to save.");
        return;
      }

      await markStepComplete("step_contact");
      router.push("/admin/onboarding/product");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      title="Contact Details"
      description="Let your customers know how to reach you. These details appear on your contact page and in order emails."
      onNext={handleNext}
      nextLoading={saving}
      backHref="/admin/onboarding/identity"
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Tagline"
          value={values.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="e.g. Premium footwear for Nairobi"
        />
        <Input
          label="Contact Email"
          type="email"
          value={values.contact_email}
          onChange={(e) => set("contact_email", e.target.value)}
          placeholder="hello@yourstore.co.ke"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={values.contact_phone}
          onChange={(e) => set("contact_phone", e.target.value)}
          placeholder="+254 700 000 000"
        />
        <Input
          label="WhatsApp Number"
          value={values.whatsapp_number}
          onChange={(e) => set("whatsapp_number", e.target.value)}
          placeholder="+254700000000"
        />
        <Input
          label="Location"
          value={values.contact_address}
          onChange={(e) => set("contact_address", e.target.value)}
          placeholder="Nairobi, Kenya"
        />
        {error && (
          <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
        )}
      </div>
    </StepShell>
  );
}