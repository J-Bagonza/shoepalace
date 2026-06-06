import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const categorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z.string()
    .min(1).max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  position: z.number().int().min(0).optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  position: number;
  created_at: string;
}

async function getHandler(req: Request): Promise<Response> {
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("tenant_categories")
    .select("id, tenant_id, name, slug, position, created_at")
    .eq("tenant_id", auth.tenantId)
    .order("position")
    .order("name");

  if (error) {
    return Response.json(
      { data: null, error: "Failed to fetch categories.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: data ?? [], error: null, status: 200 },
    { status: 200 },
  );
}

async function postHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, categorySchema);
  if (!validation.success) return validation.response;

  const admin = createAdminSupabaseClient();

  // Check slug uniqueness within tenant
  const { data: existing } = await admin
    .from("tenant_categories")
    .select("id")
    .eq("tenant_id", auth.tenantId)
    .eq("slug", validation.data.slug)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return Response.json(
      { data: null, error: "Category slug already exists.", status: 409 },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("tenant_categories")
    .insert({
      tenant_id: auth.tenantId,
      name: validation.data.name,
      slug: validation.data.slug,
      position: validation.data.position ?? 999,
    })
    .select("id, tenant_id, name, slug, position, created_at")
    .single<Category>();

  if (error || !data) {
    log.error({ requestId }, error?.message ?? "unknown");
    return Response.json(
      { data: null, error: "Failed to create category.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json({ data, error: null, status: 201 }, { status: 201 });
}

async function deleteHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, deleteSchema);
  if (!validation.success) return validation.response;

  const admin = createAdminSupabaseClient();

  const { data: existing } = await admin
    .from("tenant_categories")
    .select("id")
    .eq("id", validation.data.id)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Category not found.", status: 404 },
      { status: 404 },
    );
  }

  const { error } = await admin
    .from("tenant_categories")
    .delete()
    .eq("id", validation.data.id)
    .eq("tenant_id", auth.tenantId);

  if (error) {
    log.error({ requestId }, error.message);
    return Response.json(
      { data: null, error: "Failed to delete category.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: { message: "Category deleted." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const GET = withRateLimit("api", getHandler);
export const POST = withRateLimit("api", postHandler);
export const DELETE = withRateLimit("api", deleteHandler);