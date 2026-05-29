const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const ALLOWED_MODEL_TYPES = [
  "model/gltf-binary",
  "application/octet-stream",
] as const;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50MB

export type UploadType = "image" | "model";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadedFile(
  file: File,
  type: UploadType,
): FileValidationResult {
  const allowedTypes =
    type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_MODEL_TYPES;
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_MODEL_SIZE;

  // SECURITY: validate MIME type server-side
  if (!allowedTypes.includes(file.type as never)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Max size: ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty." };
  }

  return { valid: true };
}

/**
 * Generates a randomized storage path.
 * SECURITY: never trusts client-provided filename.
 */
export function generateStoragePath(
  type: UploadType,
  productId: string,
  originalName: string,
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const random = crypto.randomUUID();
  const folder = type === "image" ? "product-images" : "product-models";
  return `${folder}/${productId}/${random}.${safeExt}`;
}