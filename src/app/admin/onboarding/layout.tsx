import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { fetchOnboardingState } from "@/lib/onboarding/fetch-onboarding";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, tenant, onboarding] = await Promise.all([
    getAuthenticatedUser(),
    getTenantFromHeaders(),
    fetchOnboardingState(),
  ]);

  if (!user || user.role !== "admin") redirect("/login");
  if (!tenant) redirect("/login");

  // If onboarding already complete skip to dashboard
  if (onboarding?.completed_at) redirect("/admin");

  const STEPS = [
    { key: "step_identity", label: "Identity" },
    { key: "step_contact", label: "Contact" },
    { key: "step_first_product", label: "First Product" },
    { key: "step_payment", label: "Payment" },
  ];

  const completed = onboarding
    ? STEPS.filter(
        (s) =>
          onboarding[s.key as keyof typeof onboarding] === true,
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Onboarding header */}
      <header className="bg-white border-b border-neutral-100">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center
          justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-bebas text-xl tracking-widest
              text-neutral-900">
              {tenant.name}
            </span>
            <span className="text-[10px] uppercase tracking-widest
              text-neutral-400">
              Store Setup
            </span>
          </div>
          <span className="text-xs text-neutral-400 uppercase tracking-widest">
            {completed}/{STEPS.length} steps complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-500"
            style={{ width: `${(completed / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center gap-0">
          {STEPS.map((step, i) => {
            const done =
              onboarding?.[step.key as keyof typeof onboarding] === true;
            return (
              <div
                key={step.key}
                className="flex items-center gap-2 flex-1 last:flex-none"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      done ? "bg-neutral-900" : "bg-neutral-200"
                    }`}
                  />
                  <span
                    className={`text-[10px] uppercase tracking-widest
                      hidden sm:block ${
                        done ? "text-neutral-700" : "text-neutral-300"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-neutral-100 mx-3" />
                )}
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {children}
      </main>
    </div>
  );
}