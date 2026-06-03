"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PaymentSettingsData {
  has_api_key: boolean;
  payhero_channel_id: string | null;
  is_active: boolean;
}

export function PaymentSettingsForm() {
  const [data, setData] = useState<PaymentSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [channelId, setChannelId] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-settings")
      .then((r) => r.json())
      .then((json: { data: PaymentSettingsData | null }) => {
        if (json.data) {
          setData(json.data);
          setChannelId(json.data.payhero_channel_id ?? "");
          setIsActive(json.data.is_active);
        }
      })
      .catch(() => setError("Failed to load payment settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const payload: Record<string, unknown> = {
      payhero_channel_id: channelId,
      is_active: isActive,
    };

    if (apiKey.trim()) {
      payload["payhero_api_key"] = apiKey;
    }

    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to save.");
        return;
      }

      setSuccess(true);
      setApiKey("");
      setData((prev) =>
        prev
          ? {
              ...prev,
              has_api_key: prev.has_api_key || !!apiKey.trim(),
              payhero_channel_id: channelId,
              is_active: isActive,
            }
          : prev,
      );
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-8 w-48 bg-neutral-100 animate-pulse rounded" />
    );
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">

      {/* Optional notice */}
      <div className="border border-neutral-200 p-4 flex gap-3">
        <span className="text-lg shrink-0">💡</span>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-neutral-700 uppercase tracking-widest">
            Online payment is optional
          </p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            You do not have to set up M-Pesa payments right away. If you leave
            payments inactive, your customers will be given a{" "}
            <span className="font-medium text-neutral-700">
              Cash on Delivery
            </span>{" "}
            option at checkout instead — they pay when their order arrives.
            You can enable M-Pesa payments at any time once you are ready.
          </p>
        </div>
      </div>

      {/* Step by step instructions */}
      <div className="border border-neutral-100 bg-[#F5F0E8] p-5 flex flex-col gap-4">
        <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
          How to set up M-Pesa payments
        </p>
        <ol className="flex flex-col gap-3">
          {[
            {
              step: "1",
              title: "Create a PayHero account",
              body: "Go to app.payhero.co.ke and sign up. You will need your M-Pesa Paybill or Till number to complete setup.",
            },
            {
              step: "2",
              title: "Get your API Key",
              body: 'In your PayHero dashboard, go to Settings then API. Copy the API Key shown there. It looks like &quot;username:password&quot;.',
            },
            {
              step: "3",
              title: "Get your Channel ID",
              body: "In PayHero, go to Channels. Your Channel ID is the number next to your M-Pesa Paybill or Till. It is usually 4 to 6 digits.",
            },
            {
              step: "4",
              title: "Paste both here and save",
              body: "Enter your API Key and Channel ID in the fields below. Toggle payments to Active. Your customers can now pay via M-Pesa.",
            },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center
                bg-neutral-900 text-white text-[10px] font-medium">
                {step}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-medium text-neutral-700">{title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <a
          href="https://app.payhero.co.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-xs uppercase tracking-widest text-neutral-900
            underline underline-offset-2 hover:text-[#E8001D] transition-colors"
        >
          Open PayHero
        </a>
      </div>

      {/* API Key input */}
      <div className="flex flex-col gap-2">
        <Input
          label={
            data?.has_api_key
              ? "PayHero API Key (leave blank to keep existing)"
              : "PayHero API Key"
          }
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={data?.has_api_key ? "••••••••" : "username:password"}
          autoComplete="off"
        />
        {data?.has_api_key && (
          <p className="text-[10px] text-green-600 uppercase tracking-widest">
            API key is configured
          </p>
        )}
      </div>

      {/* Channel ID input */}
      <Input
        label="PayHero Channel ID"
        value={channelId}
        onChange={(e) => setChannelId(e.target.value)}
        placeholder="e.g. 1234"
      />

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setIsActive((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors
            cursor-pointer ${
              isActive ? "bg-neutral-900" : "bg-neutral-200"
            }`}
        >
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white
              shadow transition-transform ${
                isActive ? "translate-x-4" : "translate-x-0.5"
              }`}
          />
        </div>
        <span className="text-xs uppercase tracking-widest text-neutral-600">
          {isActive
            ? "M-Pesa payments active — customers pay online"
            : "M-Pesa payments inactive — customers pay on delivery"}
        </span>
      </label>

      {!isActive && (
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          Your store is running on cash on delivery. Customers will see a
          "Pay on Delivery" option at checkout. No M-Pesa setup is needed
          for this to work.
        </p>
      )}

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
      )}

      {success && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-green-600 uppercase tracking-widest"
        >
          Payment settings saved.
        </motion.p>
      )}

      <Button type="submit" loading={saving} className="w-auto">
        Save Payment Settings
      </Button>
    </form>
  );
}