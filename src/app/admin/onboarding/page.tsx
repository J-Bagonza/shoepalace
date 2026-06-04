import { redirect } from "next/navigation";
import {
  fetchOnboardingState,
  getOnboardingProgress,
} from "@/lib/onboarding/fetch-onboarding";
import Link from "next/link";

export default async function OnboardingIndexPage() {
  const state = await fetchOnboardingState();

  if (!state) redirect("/admin");

  const { allDone, nextStep } = getOnboardingProgress(state);

  if (allDone) redirect("/admin");
  if (nextStep) redirect(nextStep);

  redirect("/admin/onboarding/identity");
}