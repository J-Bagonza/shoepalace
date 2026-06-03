import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPage } from "@/lib/pages/fetch-page";
import { ContentRenderer } from "@/components/cms/content-renderer";
import { Container } from "@/components/ui/container";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";

interface PageProps {
  params: { pageSlug: string };
}

const ALLOWED_SLUGS = new Set([
  "about",
  "contact",
  "returns",
  "faq",
  "size-guide",
  "careers",
  "privacy",
  "terms",
]);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!ALLOWED_SLUGS.has(params.pageSlug)) return {};
  const page = await fetchPage(params.pageSlug);
  if (!page) return {};
  return { title: page.title };
}

export default async function CmsPage({ params }: PageProps) {
  // SECURITY: only allow known slugs — prevents arbitrary DB slug probing
  if (!ALLOWED_SLUGS.has(params.pageSlug)) notFound();

  const [page, tenant] = await Promise.all([
    fetchPage(params.pageSlug),
    getTenantFromHeaders(),
  ]);

  if (!page) notFound();

  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900
            leading-none">
            {page.title}
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <ContentRenderer blocks={page.content} />
      </Container>
    </div>
  );
}