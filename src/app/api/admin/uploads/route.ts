import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateUploadedFile, generateStoragePath } from "@/lib/uploads/validate-file";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { logAuditEvent } from "@/lib/logger/audit-logger";
import type { ApiResponse } from "@/types/api";

const BUCKET_MAP = {
  image: "product-images",
  model: "product-models",
} as const;

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
  const productId = formData.get("productId");
  const uploadType = formData.get("type");

  if (!(file instanceof File)) {
    return Response.json(
      { data: null, error: "No file provided.", status: 400 },
      { status: 400 },
    );
  }

  if (typeof productId !== "string" || typeof uploadType !== "string") {
    return Response.json(
      { data: null, error: "Missing productId or type.", status: 400 },
      { status: 400 },
    );
  }

  if (uploadType !== "image" && uploadType !== "model") {
    return Response.json(
      { data: null, error: "Invalid upload type.", status: 400 },
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

  // Verify product belongs to this tenant
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", auth.tenantId)
    .single<{ id: string }>();

  if (productError || !product) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  const validation = validateUploadedFile(file, uploadType);
  if (!validation.valid) {
    return Response.json(
      { data: null, error: validation.error ?? "Invalid file.", status: 422 },
      { status: 422 },
    );
  }

  const storagePath = generateStoragePath(uploadType, productId, file.name);
  const bucket = BUCKET_MAP[uploadType];
  const fileBuffer = await file.arrayBuffer();

  // Use admin client — bypasses storage RLS, no session context needed
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: uploadType === "model" ? "model/gltf-binary" : file.type,
      upsert: false,
    });

  if (uploadError) {
    log.error(
      { requestId, event: "admin.upload.storage.error" },
      uploadError.message,
    );
    return Response.json(
      { data: null, error: "Upload failed. Please try again.", status: 500 },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = admin.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;

  if (uploadType === "image") {
    const { error: imageInsertError } = await admin
      .from("product_images")
      .insert({
        product_id: productId,
        tenant_id: auth.tenantId,
        url: publicUrl,
        alt: "",
        position: 999,
      });

    if (imageInsertError) {
      log.error(
        { requestId, event: "admin.upload.image_insert.error" },
        imageInsertError.message,
      );
    }
  }

  logAuditEvent({
    adminId: auth.userId,
    adminRole: auth.role,
    action: "product.update",
    targetType: "product",
    targetId: productId,
    metadata: { uploadType, path: storagePath },
  });

  log.info(
    { requestId, event: "admin.upload.success", uploadType },
    "File uploaded",
  );

  return Response.json(
    { data: { url: publicUrl, path: storagePath }, error: null, status: 201 },
    { status: 201 },
  );
}

export const POST = withRateLimit("upload", handler);