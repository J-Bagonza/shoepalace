import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody, validateParams } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";
import type { CmsPage, ContentBlock } from "@/types/page";

const pageSlugSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const updatePageSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  content: z
    .array(z.record(z.unknown()))
    .min(1)
    .max(100),
});

function getParams(context?: Record<string, unknown>) {
  return context?.["params"] as Record<string, string> | undefined;
}

async function getHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(
    getParams(context),
    pageSlugSchema,
  );
  if (!paramValidation.success) return paramValidation.response;

  const { slug } = paramValidation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  const { data, error } = await admin
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("tenant_id", auth.tenantId)
    .single<CmsPage>();

  if (error || !data) {
    const body: ApiResponse = {
      data: null,
      error: "Page not found.",
      status: 404,
    };
    return Response.json(body, { status: 404 });
  }

  const body: ApiResponse<CmsPage> = { data, error: null, status: 200 };
  return Response.json(body, { status: 200 });
}

async function updateHandler(
  req: Request,
  context?: Record<string, unknown>,
): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const paramValidation = validateParams(
    getParams(context),
    pageSlugSchema,
  );
  if (!paramValidation.success) return paramValidation.response;

  const { slug } = paramValidation.data;

  const bodyValidation = await validateBody(req, updatePageSchema);
  if (!bodyValidation.success) return bodyValidation.response;

  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("pages")
    .update({
      title: bodyValidation.data.title,
      content: bodyValidation.data.content,
    })
    .eq("slug", slug)
    .eq("tenant_id", auth.tenantId)
    .select()
    .single() as { data: CmsPage | null; error: { message: string } | null };

  if (error || !data) {
    log.error(
      { requestId, event: "admin.page.update.error", slug },
      error?.message ?? "unknown",
    );
    const body: ApiResponse = {
      data: null,
      error: "Failed to update page.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  log.info(
    { requestId, event: "admin.page.update.success", slug },
    "Page updated",
  );

  const body: ApiResponse<CmsPage> = { data, error: null, status: 200 };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", getHandler);
export const PATCH = withRateLimit("api", updateHandler);