import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  fetchOnboardingState,
  getOnboardingProgress,
} from "@/lib/onboarding/fetch-onboarding";
import { AdminShell } from "@/components/admin/admin-shell";
import { CurrencyProvider } from "@/context/currency-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== "admin" && user.role !== "platform_admin")) {
    redirect("/login");
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single<{ tenant_id: string }>();

  const { data: settings } = profile
    ? await admin
        .from("tenant_settings")
        .select("currency")
        .eq("tenant_id", profile.tenant_id)
        .single<{ currency: string }>()
    : { data: null };

  const currency = settings?.currency ?? "GBP";

  const headersList = headers();
  const pathname = headersList.get("x-invoke-path") ?? "";

  if (!pathname.includes("/onboarding")) {
    const onboarding = await fetchOnboardingState();
    if (onboarding && !onboarding.completed_at) {
      const { allDone, nextStep } = getOnboardingProgress(onboarding);
      if (!allDone && nextStep) {
        redirect(nextStep);
      }
    }
  }

  return (
    <CurrencyProvider currency={currency}>
      <AdminShell email={user.email}>
        {children}
      </AdminShell>
    </CurrencyProvider>
  );
}