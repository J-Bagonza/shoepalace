import { sendEmail, getTenantEmailContext } from "./send";
import { passwordResetTemplate } from "./templates/password-reset";

function logError(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  tenantId,
}: {
  email: string;
  resetUrl: string;
  tenantId: string;
}): Promise<void> {
  try {
    const { tenant } = await getTenantEmailContext(tenantId);

    const { subject, html } = passwordResetTemplate({
      storeName: tenant.name,
      logoUrl: tenant.logo_url,
      resetUrl,
      email,
    });

    const result = await sendEmail({ to: email, subject, html });

    if (!result.success) {
      logError("[email] Password reset email failed:", result.error, { email });
    }
  } catch (err) {
    logError("[email] sendPasswordResetEmail exception:", err);
  }
}