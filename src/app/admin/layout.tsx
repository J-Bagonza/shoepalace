import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  fetchOnboardingState,
  getOnboardingProgress,
} from "@/lib/onboarding/fetch-onboarding";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // SECURITY: server-side role check — middleware is defense in depth only
  if (!user || (user.role !== "admin" && user.role !== "platform_admin")) {
    redirect("/login");
  }

  // Check onboarding — only redirect if not already on onboarding route
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
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <span className="font-bebas text-xl tracking-wider text-neutral-900">
            ShoePalace Admin
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/settings"
              className="text-xs uppercase tracking-widest text-neutral-400
                hover:text-neutral-900 transition-colors"
            >
              Settings
            </Link>
            <Link
               href="/admin/advertise"
               className="text-xs uppercase tracking-widest text-neutral-400
             hover:text-neutral-900 transition-colors"
             >
              Advertise
            </Link>
            <span className="text-xs text-neutral-400 uppercase tracking-widest">
              {user.email}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}