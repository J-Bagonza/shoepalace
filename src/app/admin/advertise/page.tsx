import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdRequestDashboard } from "@/components/admin/ad-request-dashboard";
import type { AdListing } from "@/types/ads";

export default async function AdvertisePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single<{ tenant_id: string; role: string }>();

  if (!profile || !["admin", "platform_admin"].includes(profile.role)) {
    redirect("/login");
  }

  const { data: ads } = await admin
    .from("ad_listings")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .returns<AdListing[]>();

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Advertise on ShoePalace
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed max-w-lg">
          Get your store in front of more customers by applying for a
          featured placement on shoepalace.store. Each placement is
          reviewed and priced individually.
        </p>
      </div>
      <AdRequestDashboard existingAds={ads ?? []} />
    </div>
  );
}