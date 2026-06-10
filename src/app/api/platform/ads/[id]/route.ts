import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { sendEmail } from "@/lib/email/send";
import { getTenantEmailContext } from "@/lib/email/send";
import { baseTemplate, formatEmailPrice } from "@/lib/email/templates/base";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import type { AdListing } from "@/types/ads";
import { PLACEMENT_LABELS } from "@/types/ads";

const paramsSchema = z.object({ id: z.string().uuid() });

const reviewAdSchema = z.object({
  action: z.enum(["approve", "reject"]),
  approved_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  approved_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  price_kes: z.number().min(0).optional(),
  admin_note: z.string().max(500).trim().optional(),
  rejection_note: z.string().max(500).trim().optional(),
});

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

async function handler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  if (auth.role !== "platform_admin") {
    return Response.json(
      { data: null, error: "Platform admin only.", status: 403 },
      { status: 403 },
    );
  }

  const paramValidation = validateParams(getParams(context), paramsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;

  const bodyValidation = await validateBody(req, reviewAdSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const {
    action,
    approved_start,
    approved_end,
    price_kes,
    admin_note,
    rejection_note,
  } = bodyValidation.data;

  const admin = createAdminSupabaseClient();

  // Fetch the ad to get tenant info for email
  const { data: ad } = await admin
    .from("ad_listings")
    .select("*, tenants(name, slug, logo_url)")
    .eq("id", id)
    .single<AdListing & {
      tenants: { name: string; slug: string; logo_url: string | null };
    }>();

  if (!ad) {
    return Response.json(
      { data: null, error: "Ad not found.", status: 404 },
      { status: 404 },
    );
  }

  const updatePayload =
    action === "approve"
      ? {
          status: "approved",
          approved_start: approved_start ?? null,
          approved_end: approved_end ?? null,
          price_kes: price_kes ?? null,
          admin_note: admin_note ?? null,
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
        }
      : {
          status: "rejected",
          rejection_note: rejection_note ?? null,
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
        };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("ad_listings")
    .update(updatePayload)
    .eq("id", id) as { error: { message: string } | null };

  if (updateError) {
    log.error(
      { requestId, event: "platform.ads.review.error", id },
      updateError.message,
    );
    return Response.json(
      { data: null, error: "Failed to update ad.", status: 500 },
      { status: 500 },
    );
  }

  // Send notification email to tenant
  const { tenant, appUrl } = await getTenantEmailContext(ad.tenant_id);

  const placementLabel =
    PLACEMENT_LABELS[ad.placement as keyof typeof PLACEMENT_LABELS] ??
    ad.placement;

  let emailContent: string;
  let emailSubject: string;

  if (action === "approve") {
    emailSubject = `Your ad request for "${placementLabel}" has been approved`;
    emailContent = `
      <h1>Ad Request Approved</h1>
      <p>
        Your request for a <strong>${placementLabel}</strong> placement
        on ShoePalace has been approved.
      </p>
      <div class="info-block">
        ${approved_start && approved_end ? `
          <div class="label">Ad Dates</div>
          <div class="value" style="margin-bottom:8px;">
            ${new Date(approved_start).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            →
            ${new Date(approved_end).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
        ` : ""}
        ${price_kes ? `
          <div class="label">Price</div>
          <div class="value" style="margin-bottom:8px;">
            KES ${price_kes.toLocaleString()}
          </div>
        ` : ""}
        ${admin_note ? `
          <div class="label">Note from ShoePalace</div>
          <div class="value">${admin_note}</div>
        ` : ""}
      </div>
      <p>
        To activate your ad, complete payment via M-Pesa to
        <strong>hello@shoepalace.store</strong> with reference
        <strong>AD-${id.slice(0, 8).toUpperCase()}</strong>.
      </p>
      <p style="font-size:12px;color:#999;">
        Once payment is confirmed your ad will go live on the agreed start date.
      </p>
    `;
  } else {
    emailSubject = `Your ad request for "${placementLabel}" was not approved`;
    emailContent = `
      <h1>Ad Request Not Approved</h1>
      <p>
        Unfortunately your request for a <strong>${placementLabel}</strong>
        placement could not be approved at this time.
      </p>
      ${rejection_note ? `
        <div class="info-block">
          <div class="label">Reason</div>
          <div class="value">${rejection_note}</div>
        </div>
      ` : ""}
      <p>
        You are welcome to submit a new request with different dates or
        a different placement. Contact us at
        <a href="mailto:hello@shoepalace.store">hello@shoepalace.store</a>
        if you have questions.
      </p>
    `;
  }

  // Get tenant owner email
  const { data: tenantUser } = await admin
    .from("users")
    .select("email")
    .eq("tenant_id", ad.tenant_id)
    .eq("role", "admin")
    .single<{ email: string }>();

  if (tenantUser?.email) {
    const html = baseTemplate({
      storeName: "ShoePalace",
      logoUrl: null,
      content: emailContent,
      previewText: emailSubject,
    });

    sendEmail({
      to: tenantUser.email,
      subject: emailSubject,
      html,
    }).catch((err) =>
      log.error(
        { requestId, event: "platform.ads.email.error" },
        String(err),
      ),
    );
  }

  log.info(
    { requestId, event: `platform.ads.${action}`, id },
    `Ad ${action}d`,
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: `Ad ${action}d.` },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

// Mark ad as active (after payment confirmed)
async function activateHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== "platform_admin") {
    return Response.json(
      { data: null, error: "Platform admin only.", status: 403 },
      { status: 403 },
    );
  }

  const paramValidation = validateParams(getParams(context), paramsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;
  const admin = createAdminSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("ad_listings")
    .update({ status: "active", payment_status: "paid" })
    .eq("id", id)
    .eq("status", "approved") as { error: { message: string } | null };

  if (error) {
    log.error(
      { requestId, event: "platform.ads.activate.error", id },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to activate ad.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "platform.ads.activated", id },
    "Ad activated",
  );

  return Response.json(
    { data: { message: "Ad activated." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const PATCH = withRateLimit("api", handler);
export const POST = withRateLimit("api", activateHandler);