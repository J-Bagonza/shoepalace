import { notFound, redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import type { Product } from "@/types/product";

interface PageProps {
  params: { id: string };
}

async function getTenantId(): Promise<string> {
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
  return profile.tenant_id;
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
  const tenantId = await getTenantId();
  const product = await getProduct(params.id, tenantId);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Edit Product
        </h1>
        <p className="text-sm text-neutral-400 truncate max-w-md">
          {product.name}
        </p>
      </div>
      <ProductForm product={product} mode="edit" />
    </div>
  );
}