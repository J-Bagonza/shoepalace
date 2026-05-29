import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import { getAuthenticatedUser } from "@/lib/auth/session";
import type { ApiResponse } from "@/types/api";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const user = await getAuthenticatedUser();

  if (user) {
    logAuditEvent({
      adminId: user.id,
      adminRole: user.role,
      action: "auth.logout",
      targetType: "user",
      targetId: user.id,
      metadata: {},
    });
  }

  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();

  log.info({ requestId, event: "signout.success" }, "User signed out");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Signed out successfully." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const POST = withRateLimit("auth", handler);