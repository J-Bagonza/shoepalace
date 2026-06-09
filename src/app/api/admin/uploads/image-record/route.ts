import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

async function postHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  let body: { productId: string; url: string; alt?: string; position?: number };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { data: null, error: "Invalid JSON.", status: 400 },
      { status: 400 },
    );
  }

  const { productId, url, alt = "", position = 999 } = body;

  if (!productId || !url) {
    return Response.json(
      { data: null, error: "Missing productId or url.", status: 400 },
      { status: 400 },
    );
  }

  if (!/^[0-9a-f-]{36}$/.test(productId)) {
    return Response.json(
      { data: null, error: "Invalid product ID.", status: 400 },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  const { error } = await admin.from("product_images").insert({
    product_id: productId,
    url,
    alt,
    position,
    tenant_id: auth.tenantId,
  });

  if (error) {
    log.error({ requestId, event: "admin.image.insert.error" }, error.message);
    return Response.json(
      { data: null, error: "Failed to save image.", status: 500 },
      { status: 500 },
    );
  }

  return Response.json(
    { data: { message: "Image saved." }, error: null, status: 201 },
    { status: 201 },
  );
}

async function deleteHandler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  let body: { imageUrl: string; productId: string };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { data: null, error: "Invalid JSON.", status: 400 },
      { status: 400 },
    );
  }

  const { imageUrl, productId } = body;

  if (!imageUrl || !productId) {
    return Response.json(
      { data: null, error: "Missing imageUrl or productId.", status: 400 },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();

  // Verify image belongs to this tenant's product — IDOR prevention
  const { data: existing } = await admin
    .from("product_images")
    .select("id")
    .eq("url", imageUrl)
    .eq("product_id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (!existing) {
    return Response.json(
      { data: null, error: "Image not found.", status: 404 },
      { status: 404 },
    );
  }

  // Delete from DB
  const { error: dbError } = await admin
    .from("product_images")
    .delete()
    .eq("id", existing.id)
    .eq("tenant_id", auth.tenantId);

  if (dbError) {
    log.error({ requestId, event: "admin.image.delete.error" }, dbError.message);
    return Response.json(
      { data: null, error: "Failed to delete image.", status: 500 },
      { status: 500 },
    );
  }

  // Delete from storage — extract path from public URL
  try {
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split("/product-images/");
    if (pathParts[1]) {
      await admin.storage.from("product-images").remove([pathParts[1]]);
    }
  } catch {
    // Storage delete failure is non-fatal — DB record is already gone
    log.error({ requestId, event: "admin.image.storage.delete.error" }, "Storage delete failed");
  }

  log.info({ requestId, event: "admin.image.delete.success" }, "Image deleted");

  return Response.json(
    { data: { message: "Image deleted." }, error: null, status: 200 },
    { status: 200 },
  );
}

export const POST = withRateLimit("api", postHandler);
export const DELETE = withRateLimit("api", deleteHandler);