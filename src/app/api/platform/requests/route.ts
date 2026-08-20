import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const registerStoreSchema = z.object({
  store_name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100)
    .trim(),
  slug: z
    .string()
    .min(2, "URL must be at least 2 characters")
    .max(50)
    .toLowerCase()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "URL can only contain lowercase letters, numbers and hyphens",
    ),
  owner_name: z
    .string()
    .min(2, "Full name is required")
    .max(255)
    .trim(),
  owner_email: z
    .string()
    .email("Valid email is required")
    .max(254)
    .toLowerCase()
    .trim(),
  phone: z.string().max(30).trim().optional(),
  description: z.string().max(1000).trim().optional(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const validation = await validateBody(req, registerStoreSchema);
  if (!validation.success) return validation.response;

  const input = validation.data;
  const admin = createAdminSupabaseClient();

  // Check slug not already in use by a tenant or pending request
  const [existingTenant, existingRequest] = await Promise.all([
    admin
      .from("tenants")
      .select("id")
      .eq("slug", input.slug)
      .single(),
    admin
      .from("tenant_requests")
      .select("id")
      .eq("slug", input.slug)
      .eq("status", "pending")
      .single(),
  ]);

  if (existingTenant.data) {
    return Response.json(
      {
        data: null,
        error: "That store URL is already taken. Please choose another.",
        status: 409,
      },
      { status: 409 },
    );
  }

  if (existingRequest.data) {
    return Response.json(
      {
        data: null,
        error:
          "A request for that store URL is already pending review.",
        status: 409,
      },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin as any)
    .from("tenant_requests")
    .insert({
      store_name: input.store_name,
      slug: input.slug,
      owner_name: input.owner_name,
      owner_email: input.owner_email,
      phone: input.phone ?? null,
      description: input.description ?? null,
    }) as { error: { message: string } | null };

  if (insertError) {
    log.error(
      { requestId, event: "platform.request.create.error" },
      insertError.message,
    );
    return Response.json(
      { data: null, error: "Failed to submit request.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "platform.request.created", slug: input.slug },
    "Store request submitted",
  );

  const body: ApiResponse<{ message: string }> = {
    data: {
      message:
        "Your request has been submitted. We will review it and get back to you within 24 hours.",
    },
    error: null,
    status: 201,
  };
  return Response.json(body, { status: 201 });
}

export const POST = withRateLimit("auth", handler);