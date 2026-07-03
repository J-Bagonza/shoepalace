import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchSingleProduct,
  fetchRelatedProducts,
} from "@/lib/products/fetch-single-product";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { ProductDetail } from "@/components/product/product-detail";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [product, tenant] = await Promise.all([
    fetchSingleProduct(params.slug),
    getTenantFromHeaders(),
  ]);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";
  const storeUrl = tenant
    ? `https://${tenant.slug}.${rootDomain}`
    : `https://${rootDomain}`;
  const productUrl = `${storeUrl}/products/${product.slug}`;
  const primaryImage = product.images?.[0];
  const storeName = tenant?.name ?? "ShoePalace";

  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      type: "website",
      url: productUrl,
      siteName: storeName,
      title: `${product.name} | ${storeName}`,
      description: product.description.slice(0, 155),
      images: primaryImage
        ? [
            {
              url: primaryImage.url,
              alt: primaryImage.alt || product.name,
              width: 800,
              height: 800,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${storeName}`,
      description: product.description.slice(0, 155),
      images: primaryImage ? [primaryImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const [product, related] = await Promise.all([
    fetchSingleProduct(params.slug),
    fetchSingleProduct(params.slug).then((p) =>
      p ? fetchRelatedProducts(p) : [],
    ),
  ]);

  if (!product) notFound();

  return <ProductDetail product={product} relatedProducts={related} />;
}