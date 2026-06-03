import { sendEmail, getTenantEmailContext } from "./send";
import { passwordResetTemplate } from "./templates/password-reset";

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
      console.error(
        "[email] Password reset email failed:",
        result.error,
        { email },
      );
    }
  } catch (err) {
    console.error("[email] sendPasswordResetEmail exception:", err);
  }
}