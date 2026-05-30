import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

async function handler(req: Request): Promise<Response> {
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
  });

  if (error) {
    log.error(
      { requestId, event: "admin.image.insert.error" },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to save image.", status: 500 },
      { status: 500 },
    );
  }

  log.info({ requestId, event: "admin.image.insert.success" }, "Image saved");

  const responseBody: ApiResponse<{ message: string }> = {
    data: { message: "Image saved." },
    error: null,
    status: 201,
  };

  return Response.json(responseBody, { status: 201 });
}

export const POST = withRateLimit("api", handler);