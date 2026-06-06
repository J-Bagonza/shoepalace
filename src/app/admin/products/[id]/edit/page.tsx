import { notFound, redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import type { Product } from "@/types/product";

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
  const { tenantId, currency } = await getTenantData();
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

      {/* Product details + price */}
      <ProductForm product={product} mode="edit" />

      {/* Variants + stock — inline on same page */}
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="h-px bg-neutral-100" />
        <div className="flex flex-col gap-1">
          <h2 className="font-bebas text-2xl tracking-wide text-neutral-900">
            Variants & Stock
          </h2>
          <p className="text-sm text-neutral-400">
            Manage sizes, colors and stock quantities.
          </p>
        </div>
        <VariantManager
          productId={product.id}
          variants={product.variants ?? []}
          currency={currency}
        />
      </div>
    </div>
  );
}