import { baseTemplate } from "./base";

interface StoreApprovedData {
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  storeUrl: string;
  setupUrl: string;
  logoUrl: string | null;
}

export function storeApprovedTemplate(data: StoreApprovedData): {
  subject: string;
  html: string;
} {
  const { storeName, ownerName, storeUrl, setupUrl } = data;

  const content = `
    <h1>Your Store is Approved</h1>
    <p>
      Hi ${ownerName}, great news — your application to open
      <strong>${storeName}</strong> on ShoePalace has been approved.
      Your store is live at:
    </p>

    <div style="background:#F5F0E8;padding:16px 20px;margin:16px 0;
      font-family:monospace;font-size:14px;color:#0A0A0A;
      border:1px solid #E8E0D5;">
      ${storeUrl}
    </div>

    <p>
      Click the button below to create your store admin account.
      This link is personal to you and expires in 7 days.
    </p>

    <a href="${setupUrl}" class="btn"
      style="background:#0A0A0A;color:#fff;display:inline-block;
      padding:14px 32px;font-size:11px;font-weight:600;
      text-transform:uppercase;letter-spacing:0.12em;
      text-decoration:none;margin:8px 0 24px;">
      Create Your Admin Account
    </a>

    <div class="divider"></div>

    <h2>What Happens Next</h2>
    <div class="info-block">
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${[
          "Click the button above to create your account",
          "Complete your store setup — logo, contact details, first product",
          "Share your store link with customers",
          "Manage orders and products from your dashboard",
        ].map((step, i) => `
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <span style="background:#0A0A0A;color:#fff;min-width:20px;
              height:20px;display:flex;align-items:center;
              justify-content:center;font-size:10px;font-weight:700;
              flex-shrink:0;">${i + 1}</span>
            <p style="margin:0;font-size:13px;color:#444;">${step}</p>
          </div>
        `).join("")}
      </div>
    </div>

    <p style="font-size:12px;color:#999;margin-top:24px;">
      If the button above does not work, copy and paste this URL:<br/>
      <span style="color:#666;word-break:break-all;">${setupUrl}</span>
    </p>

    <p style="font-size:12px;color:#999;">
      This link expires in 7 days. If it expires, contact support
      to get a new one.
    </p>
  `;

  return {
    subject: `Your ShoePalace store "${storeName}" is approved — set up your account`,
    html: baseTemplate({
      storeName: "ShoePalace",
      logoUrl: null,
      content,
      previewText: `Your store ${storeName} is approved. Click to create your admin account.`,
    }),
  };
}