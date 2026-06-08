import { notFound, redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import type { Product } from "@/types/product";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

async function getTenantData(): Promise<{ tenantId: string; currency: string }> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single<{ tenant_id: string }>();

  if (!profile) redirect("/login");

  const { data: settings } = await admin
    .from("tenant_settings")
    .select("currency")
    .eq("tenant_id", profile.tenant_id)
    .single<{ currency: string }>();

  return {
    tenantId: profile.tenant_id,
    currency: settings?.currency ?? "GBP",
  };
}

async function getProduct(id: string, tenantId: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single<Product>();

  if (error || !data) return null;
  return data;
}

export default async function EditProductPage({ params }: PageProps) {
  const { tenantId } = await getTenantData();
  const product = await getProduct(params.id, tenantId);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Edit Product
        </h1>
        <p className="text-sm text-neutral-400 truncate max-w-md">
          {product.name}
        </p>
      </div>

      <ProductForm product={product} mode="edit" />

      <div className="max-w-2xl border border-neutral-100 px-5 py-4
        flex items-center justify-between gap-4">
        <p className="text-xs text-neutral-500 uppercase tracking-widest">
          To manage variants and stock quantities for this product, visit
          the stock page.
        </p>
        <Link
          href={`/admin/products/${product.id}/stock`}
          className="shrink-0 text-xs uppercase tracking-widest
            text-neutral-900 border border-neutral-900 px-4 py-2
            hover:bg-neutral-900 hover:text-white transition-colors"
        >
          Manage Stock →
        </Link>
      </div>
    </div>
  );
}