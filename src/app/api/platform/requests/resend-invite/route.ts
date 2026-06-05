import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { sendEmail } from "@/lib/email/send";
import { storeApprovedTemplate } from "@/lib/email/templates/store-approved";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const schema = z.object({
  tenant_id: z.string().uuid(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== "platform_admin") {
    return Response.json(
      { data: null, error: "Platform admin only.", status: 403 },
      { status: 403 },
    );
  }

  const validation = await validateBody(req, schema);
  if (!validation.success) return validation.response;

  const { tenant_id } = validation.data;
  const admin = createAdminSupabaseClient();

  // Get tenant + original request email
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenant_id)
    .single<{ id: string; name: string; slug: string }>();

  if (!tenant) {
    return Response.json(
      { data: null, error: "Tenant not found.", status: 404 },
      { status: 404 },
    );
  }

  const { data: request } = await admin
    .from("tenant_requests")
    .select("owner_email, owner_name")
    .eq("slug", tenant.slug)
    .eq("status", "approved")
    .single<{ owner_email: string; owner_name: string }>();

  if (!request) {
    return Response.json(
      { data: null, error: "No approved request found for this tenant.", status: 404 },
      { status: 404 },
    );
  }

  // Expire old unused tokens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("tenant_invite_tokens")
    .update({ expires_at: new Date().toISOString() })
    .eq("tenant_id", tenant_id)
    .eq("used", false);

  // Create new token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tokenRow } = await (admin as any)
    .from("tenant_invite_tokens")
    .insert({
      tenant_id,
      email: request.owner_email,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("token")
    .single() as { data: { token: string } | null };

  if (!tokenRow?.token) {
    return Response.json(
      { data: null, error: "Failed to create token.", status: 500 },
      { status: 500 },
    );
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const setupUrl = `https://${tenant.slug}.${rootDomain}/setup?token=${tokenRow.token}`;
  const storeUrl = `https://${tenant.slug}.${rootDomain}`;

  const { subject, html } = storeApprovedTemplate({
    storeName: tenant.name,
    ownerName: request.owner_name,
    ownerEmail: request.owner_email,
    storeUrl,
    setupUrl,
    logoUrl: null,
  });

  await sendEmail({ to: request.owner_email, subject, html });

  log.info(
    { requestId, event: "platform.invite.resent", tenant_id },
    "Invite resent",
  );

  return Response.json(
    { data: { message: "Invite resent.", setupUrl }, error: null, status: 200 },
    { status: 200 },
  );
}

export const POST = withRateLimit("api", handler);