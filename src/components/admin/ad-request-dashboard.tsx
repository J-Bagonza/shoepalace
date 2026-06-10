"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  PLACEMENT_LABELS,
  PLACEMENT_DESCRIPTIONS,
  PLACEMENT_PRICES,
  type AdListing,
  type AdPlacement,
} from "@/types/ads";

interface AdRequestDashboardProps {
  existingAds: AdListing[];
}

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved — Awaiting Payment",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  expired: {
    label: "Expired",
    className: "bg-neutral-100 text-neutral-500 border-neutral-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-400 border-neutral-200",
  },
};

const PLACEMENTS: AdPlacement[] = [
  "homepage_hero",
  "homepage_featured",
  "directory_top",
];

function formatKES(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdRequestDashboard({
  existingAds,
}: AdRequestDashboardProps) {
  const router = useRouter();
  const [selectedPlacement, setSelectedPlacement] =
    useState<AdPlacement | null>(null);
  const [message, setMessage] = useState("");
  const [requestedStart, setRequestedStart] = useState("");
  const [requestedEnd, setRequestedEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const activeAds = existingAds.filter(
    (ad) => !["cancelled", "expired", "rejected"].includes(ad.status),
  );

  const activePlacements = new Set(
    activeAds.map((ad) => ad.placement),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlacement) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: selectedPlacement,
          message: message || undefined,
          requested_start: requestedStart || undefined,
          requested_end: requestedEnd || undefined,
        }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setSubmitError(json.error ?? "Failed to submit.");
        return;
      }

      setSubmitted(true);
      setSelectedPlacement(null);
      setMessage("");
      setRequestedStart("");
      setRequestedEnd("");
      router.refresh();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(adId: string) {
    setCancelling(adId);
    try {
      const res = await fetch(`/api/admin/ads?id=${adId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silent
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Existing ads */}
      {existingAds.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400">
            Your Ad Requests
          </h2>
          <div className="flex flex-col gap-3">
            {existingAds.map((ad) => {
              const statusStyle =
                STATUS_STYLES[ad.status] ?? STATUS_STYLES["pending"]!;
              return (
                <div
                  key={ad.id}
                  className="border border-neutral-100 bg-white p-5
                    flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between
                    gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {PLACEMENT_LABELS[ad.placement as AdPlacement]}
                      </p>
                      <span
                        className={clsx(
                          "inline-flex items-center self-start border px-2 py-0.5",
                          "text-[10px] uppercase tracking-widest",
                          statusStyle.className,
                        )}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {formatDate(ad.created_at)}
                    </span>
                  </div>

                  {ad.message && (
                    <p className="text-xs text-neutral-500 italic">
                      &ldquo;{ad.message}&rdquo;
                    </p>
                  )}

                  {(ad.requested_start || ad.requested_end) && (
                    <p className="text-xs text-neutral-400">
                      Requested:{" "}
                      {ad.requested_start && formatDate(ad.requested_start)}
                      {ad.requested_start && ad.requested_end && " → "}
                      {ad.requested_end && formatDate(ad.requested_end)}
                    </p>
                  )}

                  {ad.status === "approved" && (
                    <div className="border border-blue-100 bg-blue-50
                      p-3 flex flex-col gap-1.5">
                      <p className="text-xs font-medium text-blue-800">
                        Approved — Complete Payment to Go Live
                      </p>
                      {ad.price_kes && (
                        <p className="text-xs text-blue-700">
                          Price: {formatKES(ad.price_kes)}
                        </p>
                      )}
                      {ad.approved_start && ad.approved_end && (
                        <p className="text-xs text-blue-600">
                          Dates: {formatDate(ad.approved_start)} →{" "}
                          {formatDate(ad.approved_end)}
                        </p>
                      )}
                      {ad.admin_note && (
                        <p className="text-xs text-blue-600 italic">
                          Note: {ad.admin_note}
                        </p>
                      )}
                      <p className="text-[10px] text-blue-500 mt-1">
                        Contact hello@shoepalace.store to complete
                        payment via M-Pesa.
                      </p>
                    </div>
                  )}

                  {ad.status === "active" && (
                    <div className="border border-green-100 bg-green-50
                      p-3 flex flex-col gap-1">
                      <p className="text-xs font-medium text-green-700">
                        Your ad is live on shoepalace.store
                      </p>
                      {ad.approved_start && ad.approved_end && (
                        <p className="text-xs text-green-600">
                          {formatDate(ad.approved_start)} →{" "}
                          {formatDate(ad.approved_end)}
                        </p>
                      )}
                    </div>
                  )}

                  {ad.status === "rejected" && ad.rejection_note && (
                    <div className="border border-red-100 bg-red-50
                      p-3">
                      <p className="text-xs text-red-600">
                        Reason: {ad.rejection_note}
                      </p>
                    </div>
                  )}

                  {ad.status === "pending" && (
                    <button
                      onClick={() => handleCancel(ad.id)}
                      disabled={cancelling === ad.id}
                      className="self-start text-[10px] uppercase
                        tracking-widest text-neutral-400
                        hover:text-[#E8001D] transition-colors"
                    >
                      {cancelling === ad.id
                        ? "Cancelling..."
                        : "Cancel Request"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New request form */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400">
          Apply for Featured Placement
        </h2>

        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="border border-green-200 bg-green-50 p-4"
            >
              <p className="text-sm text-green-700">
                Request submitted. We will review it within 24 hours
                and get back to you by email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placement cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {PLACEMENTS.map((placement) => {
            const isActive = activePlacements.has(placement);
            const isSelected = selectedPlacement === placement;

            return (
              <button
                key={placement}
                type="button"
                disabled={isActive}
                onClick={() =>
                  setSelectedPlacement(
                    isSelected ? null : placement,
                  )
                }
                className={clsx(
                  "text-left border p-5 transition-all duration-150",
                  "flex flex-col gap-3",
                  isActive &&
                    "opacity-50 cursor-not-allowed border-neutral-100",
                  isSelected &&
                    "border-neutral-900 bg-neutral-50",
                  !isSelected &&
                    !isActive &&
                    "border-neutral-200 hover:border-neutral-400",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium uppercase
                    tracking-widest text-neutral-900">
                    {PLACEMENT_LABELS[placement]}
                  </span>
                  {isActive && (
                    <span className="text-[10px] uppercase tracking-widest
                      text-neutral-400 shrink-0">
                      Active
                    </span>
                  )}
                  {!isActive && (
                    <div
                      className={clsx(
                        "h-4 w-4 rounded-full border-2 shrink-0 mt-0.5",
                        "flex items-center justify-center",
                        isSelected
                          ? "border-neutral-900"
                          : "border-neutral-300",
                      )}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full
                          bg-neutral-900" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  {PLACEMENT_DESCRIPTIONS[placement]}
                </p>
                <div className="pt-2 border-t border-neutral-100">
                  <span className="text-xs font-medium text-neutral-900">
                    From {formatKES(PLACEMENT_PRICES[placement])}
                  </span>
                  <span className="text-[10px] text-neutral-400 ml-1">
                    / week
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Request details form */}
        <AnimatePresence>
          {selectedPlacement && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 overflow-hidden border
                border-neutral-100 bg-neutral-50 p-6"
            >
              <p className="text-xs uppercase tracking-widest
                text-neutral-500 font-medium">
                {PLACEMENT_LABELS[selectedPlacement]} — Request Details
              </p>

              {/* Preferred dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase
                    tracking-widest text-neutral-500">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={requestedStart}
                    onChange={(e) => setRequestedStart(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="border border-neutral-300 bg-white px-3 py-2.5
                      text-sm text-neutral-900 focus:border-neutral-900
                      focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase
                    tracking-widest text-neutral-500">
                    Preferred End Date
                  </label>
                  <input
                    type="date"
                    value={requestedEnd}
                    onChange={(e) => setRequestedEnd(e.target.value)}
                    min={
                      requestedStart ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="border border-neutral-300 bg-white px-3 py-2.5
                      text-sm text-neutral-900 focus:border-neutral-900
                      focus:outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase
                  tracking-widest text-neutral-500">
                  Message to Platform Admin (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Any specific requirements or notes..."
                  className="border border-neutral-300 bg-white px-4 py-3
                    text-sm text-neutral-900 placeholder:text-neutral-400
                    focus:border-neutral-900 focus:outline-none resize-none"
                />
              </div>

              <div className="border border-neutral-200 bg-white p-3
                flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest
                  text-neutral-400">
                  How it works
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Submit your request. We review it within 24 hours and
                  send you an email with the confirmed dates and price.
                  Payment is via M-Pesa before your ad goes live.
                </p>
              </div>

              {submitError && (
                <p className="text-xs text-[#E8001D]" role="alert">
                  {submitError}
                </p>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-neutral-900 text-white px-8 py-3 text-xs
                    uppercase tracking-widest hover:bg-neutral-700
                    transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlacement(null)}
                  className="text-xs uppercase tracking-widest
                    text-neutral-400 hover:text-neutral-900
                    transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}