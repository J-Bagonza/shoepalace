import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchSingleProduct,
  fetchRelatedProducts,
} from "@/lib/products/fetch-single-product";
import { ProductDetail } from "@/components/product/product-detail";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await fetchSingleProduct(params.slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images?.[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt }]
        : [],
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