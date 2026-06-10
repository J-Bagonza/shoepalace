import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import type { AdListing } from "@/types/ads";

const createAdSchema = z.object({
  placement: z.enum([
    "homepage_hero",
    "homepage_featured",
    "directory_top",
  ]),
  message: z.string().max(500).trim().optional(),
  requested_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  requested_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function getHandler(req: Request): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("ad_listings")
    .select("*")
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false })
    .returns<AdListing[]>();

  if (error) {
    return Response.json(
      { data: null, error: "Failed to fetch ads.", status: 500 },
      { status: 500 },
    );
  }

  const body: ApiResponse<AdListing[]> = {
    data: data ?? [],
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

async function createHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, createAdSchema);
  if (!validation.success) return validation.response;

  const admin = createAdminSupabaseClient();

  // Check no pending/active ad for same placement
  const { data: existing } = await admin
    .from("ad_listings")
    .select("id, status")
    .eq("tenant_id", auth.tenantId)
    .eq("placement", validation.data.placement)
    .in("status", ["pending", "approved", "active"])
    .maybeSingle<{ id: string; status: string }>();

  if (existing) {
    return Response.json(
      {
        data: null,
        error: `You already have a ${existing.status} request for this placement.`,
        status: 409,
      },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("ad_listings")
    .insert({
      tenant_id: auth.tenantId,
      placement: validation.data.placement,
      message: validation.data.message ?? null,
      requested_start: validation.data.requested_start ?? null,
      requested_end: validation.data.requested_end ?? null,
    })
    .select()
    .single() as { data: AdListing | null; error: { message: string } | null };

  if (error || !data) {
    log.error(
      { requestId, event: "admin.ads.create.error" },
      error?.message ?? "unknown",
    );
    return Response.json(
      { data: null, error: "Failed to submit ad request.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "admin.ads.created", placement: data.placement },
    "Ad request submitted",
  );

  const body: ApiResponse<AdListing> = { data, error: null, status: 201 };
  return Response.json(body, { status: 201 });
}

async function cancelHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const adId = url.searchParams.get("id");

  if (!adId || !/^[0-9a-f-]{36}$/.test(adId)) {
    return Response.json(
      { data: null, error: "Invalid ad ID.", status: 400 },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("ad_listings")
    .update({ status: "cancelled" })
    .eq("id", adId)
    .eq("tenant_id", auth.tenantId)
    .in("status", ["pending"]) as { error: { message: string } | null };

  if (error) {
    log.error(
      { requestId, event: "admin.ads.cancel.error" },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to cancel request.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: { message: "Request cancelled." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const GET = withRateLimit("api", getHandler);
export const POST = withRateLimit("api", createHandler);
export const DELETE = withRateLimit("api", cancelHandler);