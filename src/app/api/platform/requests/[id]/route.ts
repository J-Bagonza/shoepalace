import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { sendEmail } from "@/lib/email/send";
import { storeApprovedTemplate } from "@/lib/email/templates/store-approved";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const paramsSchema = z.object({ id: z.string().uuid() });

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
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

  if ((auth.role as string) !== "platform_admin") {
    return Response.json(
      { data: null, error: "Platform admin access required.", status: 403 },
      { status: 403 },
    );
  }

  const paramValidation = validateParams(getParams(context), paramsSchema);
  if (!paramValidation.success) return paramValidation.response;

  const { id } = paramValidation.data;

  const bodyValidation = await validateBody(req, reviewSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const { action, rejection_note } = bodyValidation.data;
  const admin = createAdminSupabaseClient();

  if (action === "approve") {
    // Fetch request details before approving so we have them for the email
    const { data: request } = await admin
      .from("tenant_requests")
      .select("store_name, owner_email, owner_name, slug")
      .eq("id", id)
      .single<{
        store_name: string;
        owner_email: string;
        owner_name: string;
        slug: string;
      }>();

    if (!request) {
      return Response.json(
        { data: null, error: "Request not found.", status: 404 },
        { status: 404 },
      );
    }

    const { data: tenantId, error } = await admin.rpc(
      "approve_tenant_request",
      {
        p_request_id: id,
        p_reviewer_id: auth.userId,
      },
    );

    if (error) {
      log.error(
        { requestId, event: "platform.request.approve.error", id },
        error.message,
      );
      return Response.json(
        {
          data: null,
          error: error.message.includes("already taken")
            ? "That slug is already in use. Edit the request before approving."
            : "Failed to approve request.",
          status: 500,
        },
        { status: 500 },
      );
    }

    // Create invite token and send approval email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokenRow } = await (admin as any)
      .from("tenant_invite_tokens")
      .insert({
        tenant_id: tenantId as string,
        email: request.owner_email,
      })
      .select("token")
      .single() as { data: { token: string } | null };

    if (tokenRow?.token) {
      const rootDomain =
        process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
      const setupUrl = `https://${request.slug}.${rootDomain}/setup?token=${tokenRow.token}`;
      const storeUrl = `https://${request.slug}.${rootDomain}`;

      const { subject, html } = storeApprovedTemplate({
        storeName: request.store_name,
        ownerName: request.owner_name,
        ownerEmail: request.owner_email,
        storeUrl,
        setupUrl,
        logoUrl: null,
      });

      sendEmail({
        to: request.owner_email,
        subject,
        html,
      }).catch((err) =>
        log.error(
          { requestId, event: "platform.approval.email.error" },
          String(err),
        ),
      );
    }

    log.info(
      { requestId, event: "platform.request.approved", id, tenantId },
      "Tenant request approved + invite sent",
    );

    const body: ApiResponse<{ tenantId: string }> = {
      data: { tenantId: tenantId as string },
      error: null,
      status: 200,
    };
    return Response.json(body, { status: 200 });
  }

  // Reject
  const { error } = await admin.rpc("reject_tenant_request", {
    p_request_id: id,
    p_reviewer_id: auth.userId,
    p_rejection_note: rejection_note ?? undefined,
  });

  if (error) {
    log.error(
      { requestId, event: "platform.request.reject.error", id },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to reject request.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "platform.request.rejected", id },
    "Tenant request rejected",
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Request rejected." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const PATCH = withRateLimit("api", handler);