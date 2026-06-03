import { baseTemplate } from "./base";

interface PasswordResetData {
  storeName: string;
  logoUrl: string | null;
  resetUrl: string;
  email: string;
}

export function passwordResetTemplate(data: PasswordResetData): {
  subject: string;
  html: string;
} {
  const { storeName, logoUrl, resetUrl, email } = data;

  const content = `
    <h1>Reset Your Password</h1>
    <p>
      We received a request to reset the password for
      <strong>${email}</strong>.
      Click the button below to choose a new password.
    </p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="font-size:12px;color:#999;">
      This link expires in 1 hour. If you did not request a password
      reset, you can safely ignore this email — your account is secure.
    </p>
    <div class="divider"></div>
    <p style="font-size:12px;color:#999;">
      If the button above does not work, copy and paste this URL
      into your browser:<br />
      <span style="color:#666;word-break:break-all;">${resetUrl}</span>
    </p>
  `;

  return {
    subject: `Reset your ${storeName} password`,
    html: baseTemplate({
      storeName,
      logoUrl,
      content,
      previewText: `Reset your ${storeName} account password. Link expires in 1 hour.`,
    }),
  };
}