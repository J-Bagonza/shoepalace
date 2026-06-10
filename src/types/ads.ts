export type AdPlacement =
  | "homepage_hero"
  | "homepage_featured"
  | "directory_top";

export type AdStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "expired"
  | "cancelled";

export type AdPaymentStatus = "unpaid" | "paid" | "waived";

export interface AdListing {
  id: string;
  tenant_id: string;
  placement: AdPlacement;
  message: string | null;
  requested_start: string | null;
  requested_end: string | null;
  status: AdStatus;
  approved_start: string | null;
  approved_end: string | null;
  price_kes: number | null;
  payment_status: AdPaymentStatus;
  rejection_note: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveAd {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_logo: string | null;
  placement: AdPlacement;
  approved_start: string;
  approved_end: string;
}

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  homepage_hero: "Homepage Hero Banner",
  homepage_featured: "Featured Stores Section",
  directory_top: "Directory Top Pin",
};

export const PLACEMENT_DESCRIPTIONS: Record<AdPlacement, string> = {
  homepage_hero:
    "Your store rotates in the hero banner at the top of shoepalace.store. Maximum visibility.",
  homepage_featured:
    "Your store appears in the Featured Stores section with a highlighted card.",
  directory_top:
    "Your store is pinned at the top of the stores directory with a Featured badge.",
};

export const PLACEMENT_PRICES: Record<AdPlacement, number> = {
  homepage_hero: 5000,
  homepage_featured: 2500,
  directory_top: 1500,
};