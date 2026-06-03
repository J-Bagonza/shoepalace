import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { fetchTenantSettings } from "@/lib/tenant/fetch-settings";
import { fetchAllPages } from "@/lib/pages/fetch-page";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { SettingsTabs } from "@/components/admin/settings-tabs";

export default async function AdminSettingsPage() {
  const [user, tenant] = await Promise.all([
    getAuthenticatedUser(),
    getTenantFromHeaders(),
  ]);

  if (!user || user.role !== "admin") redirect("/login");
  if (!tenant) redirect("/login");

  const [settings, pages] = await Promise.all([
    fetchTenantSettings(tenant.id),
    fetchAllPages(tenant.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Store Settings
        </h1>
        <p className="text-sm text-neutral-400">
          Manage your store identity, contact details and content pages.
        </p>
      </div>
      <SettingsTabs
        tenant={tenant}
        settings={settings}
        pages={pages}
      />
    </div>
  );
}