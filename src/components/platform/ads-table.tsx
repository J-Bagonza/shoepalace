"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  PLACEMENT_LABELS,
  type AdListing,
  type AdPlacement,
} from "@/types/ads";

type AdWithTenant = AdListing & {
  tenants: { name: string; slug: string };
};

interface PlatformAdsTableProps {
  ads: AdWithTenant[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-yellow-600",
  approved: "text-blue-600",
  active: "text-green-600",
  rejected: "text-red-500",
  expired: "text-neutral-400",
  cancelled: "text-neutral-300",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ReviewPanel({
  ad,
  onClose,
}: {
  ad: AdWithTenant;
  onClose: () => void;
}) {
  const router = useRouter();
  const [approvedStart, setApprovedStart] = useState(
    ad.approved_start ?? "",
  );
  const [approvedEnd, setApprovedEnd] = useState(
    ad.approved_end ?? "",
  );
  const [priceKes, setPriceKes] = useState(
    ad.price_kes?.toString() ?? "",
  );
  const [adminNote, setAdminNote] = useState(ad.admin_note ?? "");
  const [rejectionNote, setRejectionNote] = useState(
    ad.rejection_note ?? "",
  );
  const [loading, setLoading] = useState<"approve" | "reject" | "activate" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(
    action: "approve" | "reject" | "activate",
  ) {
    setError(null);
    setLoading(action);

    try {
      if (action === "activate") {
        const res = await fetch(`/api/platform/ads/${ad.id}`, {
          method: "POST",
        });
        const json = await res.json() as { error: string | null };
        if (!res.ok || json.error) {
          setError(json.error ?? "Failed.");
          return;
        }
      } else {
        const res = await fetch(`/api/platform/ads/${ad.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            approved_start: approvedStart || undefined,
            approved_end: approvedEnd || undefined,
            price_kes: priceKes ? parseFloat(priceKes) : undefined,
            admin_note: adminNote || undefined,
            rejection_note: rejectionNote || undefined,
          }),
        });
        const json = await res.json() as { error: string | null };
        if (!res.ok || json.error) {
          setError(json.error ?? "Failed.");
          return;
        }
      }

      onClose();
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  const inputClass =
    "border border-neutral-200 bg-white px-3 py-2 text-xs " +
    "text-neutral-700 focus:border-neutral-900 focus:outline-none w-full";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-neutral-200 bg-neutral-50 p-5
        flex flex-col gap-4 mt-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-neutral-500
          font-medium">
          Review — {ad.tenants.name} —{" "}
          {PLACEMENT_LABELS[ad.placement as AdPlacement]}
        </p>
        <button
          onClick={onClose}
          className="text-[10px] text-neutral-400 hover:text-neutral-900
            transition-colors uppercase tracking-widest"
        >
          Close
        </button>
      </div>

      {ad.message && (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest
            text-neutral-400">
            Tenant Message
          </span>
          <p className="text-xs text-neutral-600 italic">
            &ldquo;{ad.message}&rdquo;
          </p>
        </div>
      )}

      {(ad.status === "pending" || ad.status === "approved") && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Confirmed Start
            </label>
            <input
              type="date"
              value={approvedStart}
              onChange={(e) => setApprovedStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Confirmed End
            </label>
            <input
              type="date"
              value={approvedEnd}
              onChange={(e) => setApprovedEnd(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Price (KES)
            </label>
            <input
              type="number"
              value={priceKes}
              onChange={(e) => setPriceKes(e.target.value)}
              placeholder="e.g. 5000"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Note to Tenant
            </label>
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Optional"
              maxLength={500}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {ad.status === "pending" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Rejection Reason (if rejecting)
            </label>
            <input
              type="text"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Optional"
              maxLength={500}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction("approve")}
              disabled={!!loading}
              className="bg-neutral-900 text-white px-5 py-2 text-xs
                uppercase tracking-widest hover:bg-neutral-700
                transition-colors disabled:opacity-50"
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={!!loading}
              className="border border-red-200 text-red-600 px-5 py-2
                text-xs uppercase tracking-widest hover:bg-red-50
                transition-colors disabled:opacity-50"
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </>
      )}

      {ad.status === "approved" && (
        <button
          onClick={() => handleAction("activate")}
          disabled={!!loading}
          className="self-start bg-green-700 text-white px-5 py-2
            text-xs uppercase tracking-widest hover:bg-green-800
            transition-colors disabled:opacity-50"
        >
          {loading === "activate"
            ? "Activating..."
            : "Mark as Paid → Activate"}
        </button>
      )}

      {error && (
        <p className="text-xs text-[#E8001D]" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}

export function PlatformAdsTable({ ads }: PlatformAdsTableProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const STATUS_TABS = [
    "all",
    "pending",
    "approved",
    "active",
    "expired",
    "rejected",
  ];

  const filtered =
    activeFilter === "all"
      ? ads
      : ads.filter((ad) => ad.status === activeFilter);

  const pendingCount = ads.filter((ad) => ad.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={clsx(
              "px-4 py-2 text-xs uppercase tracking-widest border",
              "transition-colors relative",
              activeFilter === tab
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-500 hover:border-neutral-900",
            )}
          >
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "pending" && pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4
                bg-[#E8001D] text-white text-[9px] rounded-full
                flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-neutral-100 p-12 text-center">
          <p className="text-sm text-neutral-400 uppercase tracking-widest">
            No {activeFilter === "all" ? "" : activeFilter} ad requests.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ad) => (
            <div key={ad.id} className="flex flex-col">
              <div className="border border-neutral-100 bg-white p-5
                flex items-start justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-neutral-900">
                      {ad.tenants.name}
                    </p>
                    <span className="text-[10px] text-neutral-400">
                      {ad.tenants.slug}.shoepalace.store
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {PLACEMENT_LABELS[ad.placement as AdPlacement]}
                  </p>
                  <div className="flex items-center gap-4 text-[10px]
                    text-neutral-400">
                    <span>
                      Requested{" "}
                      {formatDate(ad.requested_start)} →{" "}
                      {formatDate(ad.requested_end)}
                    </span>
                    {ad.price_kes && (
                      <span>
                        KES {ad.price_kes.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={clsx(
                      "text-[10px] uppercase tracking-widest",
                      STATUS_STYLES[ad.status] ?? "text-neutral-500",
                    )}
                  >
                    {ad.status}
                  </span>
                  {(ad.status === "pending" ||
                    ad.status === "approved") && (
                    <button
                      onClick={() =>
                        setReviewingId(
                          reviewingId === ad.id ? null : ad.id,
                        )
                      }
                      className="text-[10px] uppercase tracking-widest
                        text-neutral-500 hover:text-neutral-900
                        transition-colors border border-neutral-200
                        px-3 py-1.5"
                    >
                      {reviewingId === ad.id ? "Close" : "Review"}
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {reviewingId === ad.id && (
                  <ReviewPanel
                    ad={ad}
                    onClose={() => setReviewingId(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}