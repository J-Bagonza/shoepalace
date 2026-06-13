import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { sendPasswordResetEmail } from "@/lib/email/auth-emails";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);
  const tenantId = getTenantIdFromHeaders();

  const validation = await validateBody(req, resetSchema);
  if (!validation.success) return validation.response;

  const { email } = validation.data;
  const supabase = createServerSupabaseClient();

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const resetPasswordUrl = `https://${
    process.env.NODE_ENV === "development"
      ? "localhost:3000"
      : `${tenantId}.${rootDomain}`
  }/auth/callback?type=recovery`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetPasswordUrl,
  });

  // SECURITY: always return success — never reveal if email exists
  if (error) {
    log.warn(
      { requestId, event: "auth.reset.supabase_error" },
      error.message,
    );
  } else {
    // Send branded reset email via Resend instead of Supabase default
    // Note: Supabase still sends its own email unless SMTP is configured
    // This supplements it with a branded version
    sendPasswordResetEmail({
      email,
      resetUrl: resetPasswordUrl,
      tenantId,
    }).catch((err) =>
      log.error(
        { requestId, event: "auth.reset.email.error" },
        String(err),
      ),
    );
  }

  const body: ApiResponse<{ message: string }> = {
    data: {
      message:
        "If an account exists for that email, a reset link has been sent.",
    },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const POST = withRateLimit("auth", handler);