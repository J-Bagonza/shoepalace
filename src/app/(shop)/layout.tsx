import type { Metadata } from "next";
import { ShopLayout } from "@/components/layout/shop-layout";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();

  if (!tenant) {
    return {
      title: "ShoePalace Store",
      description: "Shop footwear on ShoePalace.",
    };
  }

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const storeUrl = `https://${tenant.slug}.${rootDomain}`;

  return {
    metadataBase: new URL(storeUrl),
    title: {
      default: tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description: `Shop ${tenant.name} on ShoePalace. Browse our collection of shoes and pay via M-Pesa.`,
    openGraph: {
      type: "website",
      url: storeUrl,
      siteName: tenant.name,
      title: tenant.name,
      description: `Shop ${tenant.name} on ShoePalace. Browse our collection of shoes and pay via M-Pesa.`,
      images: tenant.logo_url
        ? [{ url: tenant.logo_url, alt: tenant.name }]
        : [{ url: "/og-image.jpg", width: 1200, height: 630, alt: tenant.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: tenant.name,
      description: `Shop ${tenant.name} on ShoePalace.`,
      images: tenant.logo_url ? [tenant.logo_url] : ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShopLayout>{children}</ShopLayout>;
}