"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { TenantRequest } from "@/types/tenant";

interface RequestsTableProps {
  requests: TenantRequest[];
  status: "pending" | "approved" | "rejected";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RequestRow({ request }: { request: TenantRequest }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setError(null);
    setLoading(action);

    try {
      const res = await fetch(`/api/platform/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_note: action === "reject" ? rejectionNote : undefined,
        }),
      });

      const json = await res.json() as { error: string | null };

      if (!res.ok || json.error) {
        setError(json.error ?? "Action failed.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border border-neutral-100 bg-white p-5
      flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-900">
            {request.store_name}
          </p>
          <p className="text-xs text-neutral-400 font-mono">
            {request.slug}.shoepalace.com
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-neutral-400">
          {formatDate(request.created_at)}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-widest
            text-neutral-400">
            Owner
          </span>
          <span className="text-xs text-neutral-700">{request.owner_name}</span>
          <span className="text-xs text-neutral-500">{request.owner_email}</span>
          {request.phone && (
            <span className="text-xs text-neutral-500">{request.phone}</span>
          )}
        </div>
        {request.description && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Description
            </span>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {request.description}
            </p>
          </div>
        )}
      </div>

      {request.status === "pending" && (
        <div className="flex flex-col gap-3 pt-2 border-t border-neutral-100">
          {error && (
            <p className="text-xs text-[#E8001D]" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAction("approve")}
              disabled={!!loading}
              className="bg-neutral-900 text-white px-5 py-2.5 text-xs
                uppercase tracking-widest hover:bg-neutral-700
                transition-colors disabled:opacity-50"
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={() => setShowReject((v) => !v)}
              disabled={!!loading}
              className="border border-red-200 text-red-600 px-5 py-2.5
                text-xs uppercase tracking-widest hover:bg-red-50
                transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>

          <AnimatePresence>
            {showReject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <input
                  type="text"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Reason for rejection (optional)"
                  maxLength={500}
                  className="border border-neutral-200 bg-white px-3 py-2
                    text-xs text-neutral-700 focus:border-neutral-900
                    focus:outline-none"
                />
                <button
                  onClick={() => handleAction("reject")}
                  disabled={!!loading}
                  className="self-start bg-red-600 text-white px-5 py-2 text-xs
                    uppercase tracking-widest hover:bg-red-700
                    transition-colors disabled:opacity-50"
                >
                  {loading === "reject" ? "Rejecting..." : "Confirm Reject"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {request.status === "approved" && (
        <div className="pt-2 border-t border-neutral-100">
          <p className="text-[10px] text-green-600 uppercase tracking-widest">
            Approved {request.reviewed_at
              ? formatDate(request.reviewed_at)
              : ""}
          </p>
        </div>
      )}

      {request.status === "rejected" && (
        <div className="pt-2 border-t border-neutral-100 flex flex-col gap-1">
          <p className="text-[10px] text-red-500 uppercase tracking-widest">
            Rejected {request.reviewed_at
              ? formatDate(request.reviewed_at)
              : ""}
          </p>
          {request.rejection_note && (
            <p className="text-xs text-neutral-400">{request.rejection_note}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RequestsTable({
  requests,
  status,
}: RequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="border border-neutral-100 bg-white p-16 text-center">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">
          No {status} requests.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <RequestRow key={request.id} request={request} />
      ))}
    </div>
  );
}