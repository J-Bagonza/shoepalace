import { createServerSupabaseClient } from "@/lib/supabase/server";
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

  // SECURITY: admin only
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    const body: ApiResponse = {
      data: null,
      error: "Invalid form data.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  const file = formData.get("file");
  const productId = formData.get("productId");
  const uploadType = formData.get("type");

  // SECURITY: validate all fields present
  if (!(file instanceof File)) {
    const body: ApiResponse = {
      data: null,
      error: "No file provided.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  if (typeof productId !== "string" || typeof uploadType !== "string") {
    const body: ApiResponse = {
      data: null,
      error: "Missing productId or type.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  if (uploadType !== "image" && uploadType !== "model") {
    const body: ApiResponse = {
      data: null,
      error: "Invalid upload type.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  // SECURITY: validate UUID format of productId
  if (!/^[0-9a-f-]{36}$/.test(productId)) {
    const body: ApiResponse = {
      data: null,
      error: "Invalid product ID.",
      status: 400,
    };
    return Response.json(body, { status: 400 });
  }

  // SECURITY: verify product exists before upload
  const adminClient = createAdminSupabaseClient();
  const { data: product, error: productError } = await adminClient
    .from("products")
    .select("id")
    .eq("id", productId)
    .single<{ id: string }>();

  if (productError || !product) {
    const body: ApiResponse = {
      data: null,
      error: "Product not found.",
      status: 404,
    };
    return Response.json(body, { status: 404 });
  }

  // SECURITY: server-side file validation
  const validation = validateUploadedFile(file, uploadType);
  if (!validation.valid) {
    const body: ApiResponse = {
      data: null,
      error: validation.error ?? "Invalid file.",
      status: 422,
    };
    return Response.json(body, { status: 422 });
  }

  // SECURITY: generate randomized path — never use client filename
  const storagePath = generateStoragePath(
    uploadType,
    productId,
    file.name,
  );

  const bucket = BUCKET_MAP[uploadType];
  const fileBuffer = await file.arrayBuffer();

  const supabase = createServerSupabaseClient();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    log.error(
      { requestId, event: "admin.upload.storage.error" },
      uploadError.message,
    );
    const body: ApiResponse = {
      data: null,
      error: "Upload failed. Please try again.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData.publicUrl;

  // If image upload — persist to product_images table
  if (uploadType === "image") {
    const { error: imageInsertError } = await (adminClient as unknown as {
      from: (table: string) => {
        insert: (data: Record<string, unknown>) => Promise<{
          error: { message: string } | null;
        }>;
      };
    })
      .from("product_images")
      .insert({
        product_id: productId,
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
    metadata: {
      uploadType,
      path: storagePath,
    },
  });

  log.info(
    { requestId, event: "admin.upload.success", uploadType },
    "File uploaded",
  );

  const body: ApiResponse<{ url: string; path: string }> = {
    data: { url: publicUrl, path: storagePath },
    error: null,
    status: 201,
  };
  return Response.json(body, { status: 201 });
}

export const POST = withRateLimit("upload", handler);