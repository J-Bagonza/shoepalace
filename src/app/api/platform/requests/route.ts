import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

// ── Helpers ──────────────────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwam.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "guerrillamail.info",
  "spam4.me", "trashmail.com", "yopmail.com", "maildrop.cc", "dispostable.com",
  "fakeinbox.com", "mailnull.com", "spamgourmet.com", "trashmail.me",
  "discard.email", "spamherr.com", "tempr.email",
];

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_DOMAINS.includes(domain);
}

function looksLikeSpam(text: string): boolean {
  // Catches common spam patterns: excessive URLs, crypto addresses,
  // SEO keyword stuffing, and obvious inject/XSS attempts.
  const urlCount = (text.match(/https?:\/\//gi) ?? []).length;
  if (urlCount > 2) return true;
  if (/<[^>]+>/.test(text)) return true; // HTML tags
  if (/\b(casino|crypto|bitcoin|forex|investment|loan|viagra|cialis)\b/i.test(text)) return true;
  if (/(.)\1{6,}/.test(text)) return true; // 7+ repeated chars e.g. "aaaaaaa"
  return false;
}

// ── Schema ────────────────────────────────────────────────────────
const registerStoreSchema = z.object({
  store_name: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100)
    .trim()
    .refine((v) => /^[\p{L}\p{N}\s'&.,\-]+$/u.test(v), {
      message: "Store name contains invalid characters.",
    }),
  slug: z
    .string()
    .min(2, "URL must be at least 2 characters")
    .max(50)
    .toLowerCase()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "URL can only contain lowercase letters, numbers and hyphens",
    )
    .refine((v) => !["admin", "api", "www", "mail", "shop", "store", "shoepalace", "platform", "static"].includes(v), {
      message: "That store URL is reserved.",
    }),
  owner_name: z
    .string()
    .min(2, "Full name is required")
    .max(255)
    .trim()
    .refine((v) => /^[\p{L}\s'\-]+$/u.test(v), {
      message: "Name contains invalid characters.",
    }),
  owner_email: z
    .string()
    .email("Valid email is required")
    .max(254)
    .toLowerCase()
    .trim()
    .refine((v) => !isDisposableEmail(v), {
      message: "Please use a permanent email address.",
    }),
  phone: z
    .string()
    .max(30)
    .trim()
    .regex(/^[+\d\s()\-]*$/, "Invalid phone number format.")
    .optional(),
  description: z
    .string()
    .max(1000)
    .trim()
    .optional()
    .refine((v) => !v || !looksLikeSpam(v), {
      message: "Description contains disallowed content.",
    }),

  // Honeypot — must be empty. Real users never see or fill this field.
  // Bots filling all fields will populate it and get silently rejected.
  website: z.string().max(0, "").optional(),

  // Timing — form should take at least 3 seconds to fill out legitimately.
  // Bots submitting instantly are caught here.
  form_token: z.string().optional(),
});

// ── Handler ───────────────────────────────────────────────────────
async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const validation = await validateBody(req, registerStoreSchema);
  if (!validation.success) return validation.response;

  const input = validation.data;

  // SECURITY: honeypot check — if the hidden field was filled, it's a bot.
  // Return a fake 201 so bots don't know they were caught and don't adapt.
  if (input.website && input.website.length > 0) {
    log.warn(
      { requestId, event: "platform.request.honeypot_triggered" },
      "Honeypot field populated — bot detected",
    );
    return Response.json(
      {
        data: {
          message:
            "Your request has been submitted. We will review it and get back to you within 24 hours.",
        },
        error: null,
        status: 201,
      },
      { status: 201 },
    );
  }

  // SECURITY: timing check — if form_token encodes a timestamp,
  // reject submissions that arrived suspiciously fast (< 3 seconds).
  if (input.form_token) {
    try {
      const submittedAt = parseInt(
        Buffer.from(input.form_token, "base64").toString("utf8"),
        10,
      );
      const elapsed = Date.now() - submittedAt;
      if (!isNaN(submittedAt) && elapsed < 3000) {
        log.warn(
          { requestId, event: "platform.request.timing_check_failed", elapsed },
          "Form submitted too fast — likely a bot",
        );
        // Again: fake success so bots don't adapt.
        return Response.json(
          {
            data: {
              message:
                "Your request has been submitted. We will review it and get back to you within 24 hours.",
            },
            error: null,
            status: 201,
          },
          { status: 201 },
        );
      }
    } catch {
      // Malformed token — ignore, don't block a real user over it
    }
  }

  const admin = createAdminSupabaseClient();

  const [existingTenant, existingRequest] = await Promise.all([
    admin.from("tenants").select("id").eq("slug", input.slug).single(),
    admin
      .from("tenant_requests")
      .select("id")
      .eq("slug", input.slug)
      .eq("status", "pending")
      .single(),
  ]);

  if (existingTenant.data) {
    return Response.json(
      {
        data: null,
        error: "That store URL is already taken. Please choose another.",
        status: 409,
      },
      { status: 409 },
    );
  }

  if (existingRequest.data) {
    return Response.json(
      {
        data: null,
        error: "A request for that store URL is already pending review.",
        status: 409,
      },
      { status: 409 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (admin as any)
    .from("tenant_requests")
    .insert({
      store_name: input.store_name,
      slug: input.slug,
      owner_name: input.owner_name,
      owner_email: input.owner_email,
      phone: input.phone ?? null,
      description: input.description ?? null,
    }) as { error: { message: string } | null };

  if (insertError) {
    log.error(
      { requestId, event: "platform.request.create.error" },
      insertError.message,
    );
    return Response.json(
      { data: null, error: "Failed to submit request.", status: 500 },
      { status: 500 },
    );
  }

  log.info(
    { requestId, event: "platform.request.created", slug: input.slug },
    "Store request submitted",
  );

  const body: ApiResponse<{ message: string }> = {
    data: {
      message:
        "Your request has been submitted. We will review it and get back to you within 24 hours.",
    },
    error: null,
    status: 201,
  };
  return Response.json(body, { status: 201 });
}

export const POST = withRateLimit("auth", handler);