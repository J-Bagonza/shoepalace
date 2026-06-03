import { ZodSchema } from "zod";
import { ApiResponse } from "@/types/api";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

/**
 * Parses and validates JSON request body.
 * Returns typed data or a 400 Response ready to return from Route Handler.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T>> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    return {
      success: false,
      response: errorResponse("Invalid JSON body", 400),
    };
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return {
      success: false,
      response: errorResponse(message, 422),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parses and validates URL search params.
 */
export function validateQuery<T>(
  req: Request,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());

  const result = schema.safeParse(raw);

  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return {
      success: false,
      response: errorResponse(message, 422),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates route segment params (e.g. [id], [slug]).
 */
export function validateParams<T>(
  params: unknown,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      response: errorResponse("Invalid route parameters", 400),
    };
  }

  return { success: true, data: result.data };
}

function errorResponse(message: string, status: number): Response {
  const body: ApiResponse = {
    data: null,
    error: message,
    status,
  };
  return Response.json(body, { status });
}