import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "@/lib/tenant/context";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import type { Tenant } from "@/types/tenant";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | ShoePalace",
    default: "ShoePalace — Premium Footwear",
  },
  description: "Precision-crafted footwear for those who move with purpose.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

// Fallback tenant for local dev / direct Vercel URL access
const FALLBACK_TENANT: Tenant = {
  id: "00000000-0000-0000-0000-000000000010",
  name: "ShoePalace",
  slug: "shoepalace",
  logo_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantFromHeaders() ?? FALLBACK_TENANT;

  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body className="font-dm bg-white text-neutral-900 antialiased">
        <TenantProvider tenant={tenant}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}