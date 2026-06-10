import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PlatformAdsTable } from "@/components/platform/ads-table";
import type { AdListing } from "@/types/ads";

export default async function PlatformAdsPage() {
  const admin = createAdminSupabaseClient();

  const { data: ads } = await admin
    .from("ad_listings")
    .select(`
      *,
      tenants ( name, slug )
    `)
    .order("created_at", { ascending: false })
    .returns<(AdListing & {
      tenants: { name: string; slug: string };
    })[]>();

  const STATUS_TABS = [
    "all",
    "pending",
    "approved",
    "active",
    "expired",
    "rejected",
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Ad Listings
        </h1>
        <p className="text-sm text-neutral-400">
          Review and manage featured placement requests.
        </p>
      </div>
      <PlatformAdsTable ads={ads ?? []} />
    </div>
  );
}