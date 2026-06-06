import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { fetchTenantSettings } from "@/lib/tenant/fetch-settings";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import type { TenantSettings } from "@/types/tenant";

const updateSettingsSchema = z.object({
  tagline: z.string().max(255).trim().optional(),
  contact_email: z.string().email().max(254).optional(),
  currency: z.enum(["GBP", "KES", "USD"]).optional(),
  contact_phone: z.string().max(30).trim().optional(),
  contact_address: z.string().max(255).trim().optional(),
  instagram_url: z.string().url().max(2048).optional().nullable(),
  whatsapp_number: z.string().max(30).trim().optional(),
  shipping_info: z.string().max(500).trim().optional(),
  returns_info: z.string().max(500).trim().optional(),
});

async function getHandler(req: Request): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const settings = await fetchTenantSettings(auth.tenantId);

  const body: ApiResponse<TenantSettings | null> = {
    data: settings,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

async function updateHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, updateSettingsSchema);
  if (!validation.success) return validation.response;

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("tenant_settings")
    .upsert({
      tenant_id: auth.tenantId,
      ...validation.data,
    })
    .select()
    .single() as {
    data: TenantSettings | null;
    error: { message: string } | null;
  };

  if (error || !data) {
    log.error(
      { requestId, event: "admin.settings.update.error" },
      error?.message ?? "unknown",
    );
    const body: ApiResponse = {
      data: null,
      error: "Failed to update settings.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  log.info(
    { requestId, event: "admin.settings.update.success" },
    "Settings updated",
  );

  const body: ApiResponse<TenantSettings> = {
    data,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", getHandler);
export const PATCH = withRateLimit("api", updateHandler);