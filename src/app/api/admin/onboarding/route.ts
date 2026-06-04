import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { validateBody } from "@/lib/validations/request";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse } from "@/types/api";

const onboardingStepSchema = z.object({
  step: z.enum([
    "step_identity",
    "step_contact",
    "step_first_product",
    "step_payment",
  ]),
  complete: z.boolean(),
});

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = await validateBody(req, onboardingStepSchema);
  if (!validation.success) return validation.response;

  const { step, complete } = validation.data;
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: auth.tenantId });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("tenant_onboarding")
    .update({ [step]: complete })
    .eq("tenant_id", auth.tenantId) as { error: { message: string } | null };

  if (error) {
    log.error(
      { requestId, event: "admin.onboarding.update.error", step },
      error.message,
    );
    return Response.json(
      { data: null, error: "Failed to update onboarding.", status: 500 },
      { status: 500 },
    );
  }

  // Check if all steps complete — mark tenant onboarding_complete
  const { data: state } = await admin
    .from("tenant_onboarding")
    .select(
      "step_identity, step_contact, step_first_product, step_payment",
    )
    .eq("tenant_id", auth.tenantId)
    .single<{
      step_identity: boolean;
      step_contact: boolean;
      step_first_product: boolean;
      step_payment: boolean;
    }>();

  if (
    state?.step_identity &&
    state?.step_contact &&
    state?.step_first_product &&
    state?.step_payment
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("tenants")
      .update({ onboarding_complete: true })
      .eq("id", auth.tenantId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("tenant_onboarding")
      .update({ completed_at: new Date().toISOString() })
      .eq("tenant_id", auth.tenantId);
  }

  log.info(
    { requestId, event: "admin.onboarding.step.updated", step, complete },
    "Onboarding step updated",
  );

  const body: ApiResponse<{ message: string }> = {
    data: { message: "Step updated." },
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const PATCH = withRateLimit("api", handler);