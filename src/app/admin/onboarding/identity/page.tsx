import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { OnboardingIdentityStep } from "@/components/admin/onboarding/identity-step";

export default async function OnboardingIdentityPage() {
  const tenant = await getTenantFromHeaders();

  return (
    <OnboardingIdentityStep
      storeName={tenant?.name ?? ""}
      logoUrl={tenant?.logo_url ?? null}
    />
  );
}