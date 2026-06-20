import { getResendClient, getFromEmail } from "./resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { checkRateLimitByKey } from "@/lib/security/rate-limit";
import type { Tenant } from "@/types/tenant";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function logError(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const recipient = options.to.toLowerCase().trim();

  // SECURITY: per-recipient cap — prevents email bombing a single
  // address regardless of attacker IP or how the send was triggered.
  // Fails OPEN on Redis errors — an email-provider outage on our side
  // should not silently block legitimate transactional email.
  try {
    const { success } = await checkRateLimitByKey("emailTarget", recipient);
    if (!success) {
      logError("[email] Rate limit hit for recipient:", recipient);
      return {
        success: false,
        error: "Rate limit exceeded for this recipient.",
      };
    }
  } catch (err) {
    logError("[email] emailTarget rate limit check failed — failing open:", err);
  }

  // SECURITY: global circuit breaker — caps total app-wide sends per
  // hour, protecting against a distributed attack using many different
  // recipient addresses each individually under the per-recipient cap.
  try {
    const { success } = await checkRateLimitByKey("emailGlobal", "global");
    if (!success) {
      logError("[email] Global send cap reached — refusing send.");
      return {
        success: false,
        error: "Global email send limit reached. Try again shortly.",
      };
    }
  } catch (err) {
    logError("[email] emailGlobal rate limit check failed — failing open:", err);
  }

  try {
    const resend = getResendClient();
    const from = getFromEmail();

    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (error) {
      logError("[email] Send failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logError("[email] Send exception:", message);
    return { success: false, error: message };
  }
}

export async function getTenantEmailContext(tenantId: string): Promise<{
  tenant: Tenant;
  appUrl: string;
}> {
  const admin = createAdminSupabaseClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, slug, logo_url, is_active, created_at, updated_at")
    .eq("id", tenantId)
    .single<Tenant>();

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const appUrl = tenant?.slug
    ? `https://${tenant.slug}.${rootDomain}`
    : `https://${rootDomain}`;

  return {
    tenant: tenant ?? {
      id: tenantId,
      name: "ShoePalace",
      slug: "shoepalace",
      logo_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    appUrl,
  };
}