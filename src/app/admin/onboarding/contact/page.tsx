import { fetchTenantSettings } from "@/lib/tenant/fetch-settings";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { OnboardingContactStep } from "@/components/admin/onboarding/contact-step";

export default async function OnboardingContactPage() {
  const tenantId = getTenantIdFromHeaders();
  const settings = await fetchTenantSettings(tenantId);

  return <OnboardingContactStep settings={settings} />;
}