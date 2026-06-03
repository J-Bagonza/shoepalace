import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
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

    log.info(
      { requestId, event: "platform.request.approved", id, tenantId },
      "Tenant request approved",
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