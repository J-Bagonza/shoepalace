import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchTenantSettings } from "@/lib/tenant/fetch-settings";
import { fetchAllPages } from "@/lib/pages/fetch-page";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import type { Tenant } from "@/types/tenant";

async function getSessionTenant(): Promise<{
  tenant: Tenant;
  tenantId: string;
}> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single<{ tenant_id: string; role: string }>();

  if (!profile || !["admin", "platform_admin"].includes(profile.role)) {
    redirect("/login");
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, is_active, onboarding_complete, created_at, updated_at")
    .eq("id", profile.tenant_id)
    .single<Tenant>();

  if (!tenant) redirect("/login");

  return { tenant, tenantId: profile.tenant_id };
}

export default async function AdminSettingsPage() {
  const { tenant, tenantId } = await getSessionTenant();

  const [settings, pages] = await Promise.all([
    fetchTenantSettings(tenantId),
    fetchAllPages(tenantId),
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