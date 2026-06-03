export function baseTemplate({
  storeName,
  logoUrl,
  content,
  previewText,
}: {
  storeName: string;
  logoUrl: string | null;
  content: string;
  previewText: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${storeName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #F5F0E8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #0A0A0A;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #FFFFFF;
    }
    .header {
      padding: 32px 40px;
      border-bottom: 1px solid #F0F0F0;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #0A0A0A;
      text-decoration: none;
    }
    .body {
      padding: 40px;
    }
    .footer {
      padding: 24px 40px;
      border-top: 1px solid #F0F0F0;
      background: #FAFAFA;
    }
    .footer p {
      font-size: 11px;
      color: #999;
      line-height: 1.6;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      color: #0A0A0A;
    }
    h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666;
      margin-bottom: 16px;
      margin-top: 32px;
    }
    p {
      font-size: 14px;
      line-height: 1.7;
      color: #444;
      margin-bottom: 16px;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #999;
    }
    .value {
      font-size: 14px;
      color: #0A0A0A;
      font-weight: 500;
    }
    .btn {
      display: inline-block;
      background: #0A0A0A;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 8px 0 24px;
    }
    .divider {
      height: 1px;
      background: #F0F0F0;
      margin: 24px 0;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #F5F5F5;
      font-size: 13px;
    }
    .item-name { color: #0A0A0A; font-weight: 500; }
    .item-meta { color: #888; font-size: 12px; margin-top: 2px; }
    .item-price { color: #0A0A0A; white-space: nowrap; }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
      color: #666;
    }
    .total-row.final {
      font-weight: 700;
      font-size: 15px;
      color: #0A0A0A;
      border-top: 1px solid #F0F0F0;
      padding-top: 14px;
      margin-top: 6px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .status-confirmed { background: #EFF6FF; color: #1D4ED8; }
    .status-processing { background: #F5F3FF; color: #7C3AED; }
    .status-shipped { background: #EEF2FF; color: #4338CA; }
    .status-delivered { background: #F0FDF4; color: #16A34A; }
    .status-cancelled { background: #FEF2F2; color: #DC2626; }
    .status-pending { background: #FEFCE8; color: #CA8A04; }
    .info-block {
      background: #F9F9F9;
      border: 1px solid #F0F0F0;
      padding: 16px 20px;
      margin-bottom: 16px;
    }
    @media (max-width: 600px) {
      .wrapper { margin: 0; }
      .body, .header, .footer { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#F5F0E8;">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>
  <div class="wrapper">
    <div class="header">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="${storeName}" height="40" style="height:40px;width:auto;" />`
        : `<span class="logo-text">${storeName}</span>`
      }
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        You received this email because you placed an order with ${storeName}.<br />
        If you have questions, reply to this email or contact us directly.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function formatEmailPrice(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}