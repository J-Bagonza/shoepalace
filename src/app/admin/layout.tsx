import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  fetchOnboardingState,
  getOnboardingProgress,
} from "@/lib/onboarding/fetch-onboarding";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user || (user.role !== "admin" && user.role !== "platform_admin")) {
    redirect("/login");
  }

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
    <AdminShell email={user.email}>
      {children}
    </AdminShell>
  );
}