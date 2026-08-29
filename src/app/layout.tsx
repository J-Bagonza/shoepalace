import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans, Kablammo, Kranky, Lavishly_Yours } from "next/font/google";
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

const kablammo = Kablammo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kablammo",
  display: "swap",
});

const kranky = Kranky({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kranky",
  display: "swap",
});

const lavishlyYours = Lavishly_Yours({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lavish",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shoepalace.store",
  ),
  title: {
    template: "%s | ShoePalace",
    default: "ShoePalace — Kenya's Premier Footwear Marketplace",
  },
  description:
    "Browse verified shoe stores across Kenya. Shop running, lifestyle, hiking and casual footwear from independent vendors. Pay via M-Pesa.",
  keywords: [
    "shoes Kenya",
    "footwear Kenya",
    "buy shoes online Kenya",
    "M-Pesa shoe store",
    "running shoes Nairobi",
    "sneakers Kenya",
    "Jordan Kenya",
    "Nike Kenya",
  ],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://shoepalace.store",
    siteName: "ShoePalace",
    title: "ShoePalace — Kenya's Premier Footwear Marketplace",
    description:
      "Browse verified shoe stores across Kenya. Shop running, lifestyle and hiking footwear. Pay via M-Pesa.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShoePalace — Kenya's Footwear Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShoePalace — Kenya's Premier Footwear Marketplace",
    description:
      "Browse verified shoe stores across Kenya. Pay via M-Pesa.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    <html
      lang="en"
      className={`${bebasNeue.variable} ${dmSans.variable} ${kablammo.variable} ${kranky.variable} ${lavishlyYours.variable}`}
    >
      <body className="font-dm bg-white text-neutral-900 antialiased">
        <TenantProvider tenant={tenant}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
