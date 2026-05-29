import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateBody } from "@/lib/validations/request";
import { signupSchema } from "@/lib/validations/auth";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import type { ApiResponse } from "@/types/api";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const validation = await validateBody(req, signupSchema);
  if (!validation.success) return validation.response;

  const { email, password } = validation.data;
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    log.warn({ requestId, event: "signup.failed" }, "Signup failed");

    // SECURITY: Generic error — never reveal whether email exists
    const body: ApiResponse = {
      data: null,
      error: "Unable to create account. Please try again.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  if (data.user) {
    logAuditEvent({
      adminId: data.user.id,
      adminRole: "customer",
      action: "auth.signup",
      targetType: "user",
      targetId: data.user.id,
      metadata: {},
    });
  }

  log.info({ requestId, event: "signup.success" }, "User signed up");

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Account created. Please check your email to confirm." },
    error: null,
    status: 201,
  };
  return Response.json(body, { status: 201 });
}

export const POST = withRateLimit("auth", handler);