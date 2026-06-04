import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";

export interface OnboardingState {
  id: string;
  tenant_id: string;
  step_identity: boolean;
  step_contact: boolean;
  step_first_product: boolean;
  step_payment: boolean;
  completed_at: string | null;
}

export async function fetchOnboardingState(): Promise<OnboardingState | null> {
  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("tenant_onboarding")
    .select("*")
    .eq("tenant_id", tenantId)
    .single<OnboardingState>();

  if (error || !data) return null;
  return data;
}

export function getOnboardingProgress(state: OnboardingState): {
  completed: number;
  total: number;
  allDone: boolean;
  nextStep: string | null;
} {
  const steps = [
    { key: "step_identity", path: "/admin/onboarding/identity" },
    { key: "step_contact", path: "/admin/onboarding/contact" },
    { key: "step_first_product", path: "/admin/onboarding/product" },
    { key: "step_payment", path: "/admin/onboarding/payment" },
  ] as const;

  const completed = steps.filter(
    (s) => state[s.key as keyof OnboardingState] === true,
  ).length;

  const total = steps.length;
  const allDone = completed === total;
  const nextStep = allDone
    ? null
    : (steps.find((s) => !state[s.key as keyof OnboardingState])
        ?.path ?? null);

  return { completed, total, allDone, nextStep };
}