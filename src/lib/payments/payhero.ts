import { decrypt } from "@/lib/security/encrypt";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface PayHeroCredentials {
  apiKey: string;
  channelId: string;
}

interface STKPushPayload {
  amount: number;
  phone_number: string;
  channel_id: string;
  provider: "m-pesa";
  external_reference: string;
  callback_url: string;
  description?: string;
}

interface STKPushResponse {
  success: boolean;
  reference?: string;
  error?: string;
}

interface PayHeroWebhookPayload {
  status: "SUCCESS" | "FAILED";
  reference: string;
  external_reference: string;
  amount: number;
  phone_number: string;
  provider: string;
}

export async function getPayHeroCredentials(
  tenantId: string,
): Promise<PayHeroCredentials | null> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("tenant_payment_settings")
    .select(
      "payhero_api_key_encrypted, payhero_channel_id, is_active",
    )
    .eq("tenant_id", tenantId)
    .single<{
      payhero_api_key_encrypted: string | null;
      payhero_channel_id: string | null;
      is_active: boolean;
    }>();

  if (
    error ||
    !data ||
    !data.is_active ||
    !data.payhero_api_key_encrypted ||
    !data.payhero_channel_id
  ) {
    return null;
  }

  try {
    const apiKey = decrypt(data.payhero_api_key_encrypted);
    return { apiKey, channelId: data.payhero_channel_id };
  } catch {
    return null;
  }
}

export async function initiateSTKPush({
  credentials,
  amount,
  phone,
  orderId,
  tenantId,
}: {
  credentials: PayHeroCredentials;
  amount: number;
  phone: string;
  orderId: string;
  tenantId: string;
}): Promise<STKPushResponse> {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?tenant=${tenantId}`;

  const payload: STKPushPayload = {
    amount: Math.round(amount),
    phone_number: normalisePhone(phone),
    channel_id: credentials.channelId,
    provider: "m-pesa",
    external_reference: orderId,
    callback_url: callbackUrl,
    description: "ShoePalace Order Payment",
  };

  const response = await fetch(
    "https://backend.payhero.co.ke/api/v2/payments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(credentials.apiKey).toString("base64")}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      success: false,
      error: `PayHero error ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  const json = await response.json() as {
    reference?: string;
    success?: boolean;
    CheckoutRequestID?: string;
  };

  return {
    success: true,
    reference: json.reference ?? json.CheckoutRequestID,
  };
}

export async function getPaymentStatus(
  credentials: PayHeroCredentials,
  reference: string,
): Promise<"pending" | "paid" | "failed"> {
  const response = await fetch(
    `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(credentials.apiKey).toString("base64")}`,
      },
    },
  );

  if (!response.ok) return "pending";

  const json = await response.json() as {
    status?: "SUCCESS" | "FAILED" | "PENDING";
  };

  if (json.status === "SUCCESS") return "paid";
  if (json.status === "FAILED") return "failed";
  return "pending";
}

export function validateWebhookPayload(
  payload: unknown,
): payload is PayHeroWebhookPayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p["status"] === "string" &&
    typeof p["external_reference"] === "string" &&
    typeof p["amount"] === "number"
  );
}

/**
 * Normalise Kenyan phone numbers to 2547XXXXXXXX format.
 */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0") && digits.length === 10) {
    return "254" + digits.slice(1);
  }
  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("7") && digits.length === 9) {
    return "254" + digits;
  }
  return digits;
}