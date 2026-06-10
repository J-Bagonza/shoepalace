import { requirePlatformAdmin } from "@/lib/platform/require-platform-admin";
import { PlatformShell } from "@/components/platform/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return <PlatformShell>{children}</PlatformShell>;
}