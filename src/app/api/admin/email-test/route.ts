import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { sendEmail, getTenantEmailContext } from "@/lib/email/send";
import { baseTemplate } from "@/lib/email/templates/base";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const { tenant, appUrl } = await getTenantEmailContext(auth.tenantId);

  const html = baseTemplate({
    storeName: tenant.name,
    logoUrl: tenant.logo_url,
    previewText: "Your email setup is working correctly.",
    content: `
      <h1>Email Setup Working</h1>
      <p>
        This is a test email from your ${tenant.name} store.
        If you are reading this, your transactional emails are
        configured correctly.
      </p>
      <p style="font-size:12px;color:#999;">
        Store URL: ${appUrl}<br />
        Tenant ID: ${auth.tenantId}
      </p>
    `,
  });

  const result = await sendEmail({
    to: "test@" + (process.env.RESEND_FROM_EMAIL?.split("@")[1] ?? "shoepalace.co.ke"),
    subject: `Test email — ${tenant.name}`,
    html,
  });

  log.info(
    { requestId, event: "admin.email.test", success: result.success },
    "Test email sent",
  );

  const body: ApiResponse<{ success: boolean; id?: string; error?: string }> =
    {
      data: result,
      error: result.success ? null : result.error ?? "Send failed.",
      status: result.success ? 200 : 500,
    };

  return Response.json(body, {
    status: result.success ? 200 : 500,
  });
}

export const POST = withRateLimit("api", handler);