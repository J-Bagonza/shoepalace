import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateBody } from "@/lib/validations/request";
import { signinSchema } from "@/lib/validations/auth";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import type { ApiResponse } from "@/types/api";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const validation = await validateBody(req, signinSchema);
  if (!validation.success) return validation.response;

  const { email, password } = validation.data;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    log.warn({ requestId, event: "signin.failed" }, "Signin failed");

    // SECURITY: Identical error for wrong email or wrong password
    const body: ApiResponse = {
      data: null,
      error: "Invalid credentials.",
      status: 401,
    };
    return Response.json(body, { status: 401 });
  }

  logAuditEvent({
    adminId: data.user.id,
    adminRole: "customer",
    action: "auth.login",
    targetType: "user",
    targetId: data.user.id,
    metadata: {},
  });

  log.info({ requestId, event: "signin.success" }, "User signed in");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Signed in successfully." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const POST = withRateLimit("auth", handler);