import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { randomUUID } from "crypto";
import type { ApiResponse } from "@/types/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB — logos should be small

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { data: null, error: "Invalid form data.", status: 400 },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { data: null, error: "No file provided.", status: 400 },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { data: null, error: "Invalid file type. JPEG, PNG, WebP or SVG only.", status: 422 },
      { status: 422 },
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { data: null, error: "Logo must be under 1MB.", status: 422 },
      { status: 422 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const storagePath = `logos/${auth.tenantId}/${randomUUID()}.${safeExt}`;
  const fileBuffer = await file.arrayBuffer();

  const admin = createAdminSupabaseClient();

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    log.error(
      { requestId, event: "admin.logo.upload.error" },
      uploadError.message,
    );
    return Response.json(
      { data: null, error: "Logo upload failed.", status: 500 },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = admin.storage
    .from("product-images")
    .getPublicUrl(storagePath);

  const logoUrl = publicUrlData.publicUrl;

  // Update tenant logo_url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (admin as any)
    .from("tenants")
    .update({ logo_url: logoUrl })
    .eq("id", auth.tenantId) as { error: { message: string } | null };

  if (updateError) {
    log.error(
      { requestId, event: "admin.logo.update.error" },
      updateError.message,
    );
    return Response.json(
      { data: null, error: "Failed to save logo.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "admin.logo.success" },
    "Logo uploaded",
  );

  const body: ApiResponse<{ url: string }> = {
    data: { url: logoUrl },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const POST = withRateLimit("upload", handler);