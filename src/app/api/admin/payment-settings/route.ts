import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { encrypt } from "@/lib/security/encrypt";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const updatePaymentSettingsSchema = z.object({
  payhero_api_key: z.string().min(10).max(500).trim().optional(),
  payhero_channel_id: z.union([
    z.string().max(100).trim(),
    z.literal(""),
    z.null(),
  ]).optional().transform((v) => (v === "" ? null : v)),
  is_active: z.boolean().optional(),
});

async function getHandler(req: Request): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  const { data } = await admin
    .from("tenant_payment_settings")
    .select(
      "id, tenant_id, payhero_channel_id, is_active, updated_at",
      // NOTE: deliberately omit payhero_api_key_encrypted — never expose
    )
    .eq("tenant_id", auth.tenantId)
    .single<{
      id: string;
      tenant_id: string;
      payhero_channel_id: string | null;
      is_active: boolean;
      updated_at: string;
    }>();

  const body: ApiResponse<{
    has_api_key: boolean;
    payhero_channel_id: string | null;
    is_active: boolean;
  } | null> = {
    data: data
      ? {
          has_api_key: false, // we fetch separately
          payhero_channel_id: data.payhero_channel_id,
          is_active: data.is_active,
        }
      : null,
    error: null,
    status: 200,
  };

  // Check if API key exists without exposing it
  const { data: keyCheck } = await admin
    .from("tenant_payment_settings")
    .select("payhero_api_key_encrypted")
    .eq("tenant_id", auth.tenantId)
    .single<{ payhero_api_key_encrypted: string | null }>();

  if (body.data) {
    body.data.has_api_key = !!keyCheck?.payhero_api_key_encrypted;
  }

  return Response.json(body, { status: 200 });
}

async function updateHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, updatePaymentSettingsSchema);
  if (!validation.success) return validation.response;

  const { payhero_api_key, payhero_channel_id, is_active } = validation.data;

  const updatePayload: Record<string, unknown> = {
    tenant_id: auth.tenantId,
  };

  if (payhero_api_key !== undefined) {
    updatePayload["payhero_api_key_encrypted"] = encrypt(payhero_api_key);
  }
  if (payhero_channel_id !== undefined) {
    updatePayload["payhero_channel_id"] = payhero_channel_id;
  }
  if (is_active !== undefined) {
    updatePayload["is_active"] = is_active;
  }

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await admin
  .from("tenant_payment_settings")
  .upsert(updatePayload, { onConflict: "tenant_id" }) as { error: { message: string } | null };
  if (error) {
    log.error(
      { requestId, event: "admin.payment_settings.update.error" },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to save payment settings.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "admin.payment_settings.update.success" },
    "Payment settings updated",
  );

  return Response.json(
    { data: { message: "Payment settings saved." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const GET = withRateLimit("api", getHandler);
export const PATCH = withRateLimit("api", updateHandler);