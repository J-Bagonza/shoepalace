import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";

const BUCKET_MAP = {
  image: "product-images",
  model: "product-models",
} as const;

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  let body: { productId: string; type: "image" | "model"; filename: string };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json(
      { data: null, error: "Invalid JSON.", status: 400 },
      { status: 400 },
    );
  }

  const { productId, type, filename } = body;

  if (!productId || !type || !filename) {
    return Response.json(
      { data: null, error: "Missing required fields.", status: 400 },
      { status: 400 },
    );
  }

  if (type !== "image" && type !== "model") {
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

  // Verify product exists
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .single<{ id: string }>();

  if (productError || !product) {
    return Response.json(
      { data: null, error: "Product not found.", status: 404 },
      { status: 404 },
    );
  }

  // Generate a safe randomized storage path
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const storagePath = `${type}s/${productId}/${safeName}`;
  const bucket = BUCKET_MAP[type];

  const { data: signedData, error: signedError } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);

  if (signedError || !signedData) {
    log.error(
      { requestId, event: "admin.upload.signed_url.error" },
      signedError?.message ?? "unknown",
    );
    return Response.json(
      { data: null, error: "Failed to create upload URL.", status: 500 },
      { status: 500 },
    );
  }

  // Get the public URL that will be valid after upload
  const { data: publicUrlData } = admin.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  log.info({ requestId, event: "admin.upload.signed_url.created", type }, "Signed URL created");

  const responseBody: ApiResponse<{
    signedUrl: string;
    token: string;
    path: string;
    publicUrl: string;
  }> = {
    data: {
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: storagePath,
      publicUrl: publicUrlData.publicUrl,
    },
    error: null,
    status: 201,
  };

  return Response.json(responseBody, { status: 201 });
}

export const POST = withRateLimit("upload", handler);