import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

const setupSchema = z.object({
  token: z.string().min(64).max(64),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  full_name: z.string().min(2).max(255).trim(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);
  const tenantId = getTenantIdFromHeaders();

  const validation = await validateBody(req, setupSchema);
  if (!validation.success) return validation.response;

  const { token, password, full_name } = validation.data;
  const admin = createAdminSupabaseClient();

  // Validate token
  const { data: invite, error: tokenError } = await admin
    .from("tenant_invite_tokens")
    .select("id, tenant_id, email, used, expires_at")
    .eq("token", token)
    .eq("tenant_id", tenantId)
    .single<{
      id: string;
      tenant_id: string;
      email: string;
      used: boolean;
      expires_at: string;
    }>();

  if (tokenError || !invite) {
    return Response.json(
      { data: null, error: "Invalid or expired invitation link.", status: 400 },
      { status: 400 },
    );
  }

  if (invite.used) {
    return Response.json(
      {
        data: null,
        error: "This invitation has already been used. Please sign in.",
        status: 409,
      },
      { status: 409 },
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return Response.json(
      {
        data: null,
        error: "This invitation has expired. Contact support for a new one.",
        status: 410,
      },
      { status: 410 },
    );
  }

  // Check if this email already has an auth account
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === invite.email,
  );

  let userId: string;

  if (existingUser) {
    // User already signed up — just update their public.users role
    userId = existingUser.id;
  } else {
    // Create auth user
    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          tenant_id: invite.tenant_id,
        },
      });

    if (createError || !newUser.user) {
      log.error(
        { requestId, event: "setup.create_user.error" },
        createError?.message ?? "unknown",
      );
      return Response.json(
        { data: null, error: "Failed to create account.", status: 500 },
        { status: 500 },
      );
    }

    userId = newUser.user.id;

    // Insert into public.users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("users").upsert({
      id: userId,
      email: invite.email,
      role: "admin",
      tenant_id: invite.tenant_id,
    });
  }

  // Update existing public.users row to admin + correct tenant
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("users")
    .update({
      role: "admin",
      tenant_id: invite.tenant_id,
    })
    .eq("id", userId);

  // Mark token as used
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("tenant_invite_tokens")
    .update({ used: true, used_by: userId })
    .eq("id", invite.id);

  log.info(
    {
      requestId,
      event: "setup.complete",
      userId,
      tenantId: invite.tenant_id,
    },
    "Store admin account created",
  );

  return Response.json(
    {
      data: { message: "Account created. You can now sign in." },
      error: null,
      status: 201,
    },
    { status: 201 },
  );
}

export const POST = withRateLimit("auth", handler);