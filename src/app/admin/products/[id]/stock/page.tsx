import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIdFromHeaders } from "@/lib/tenant/server-tenant";
import { StockManager } from "@/components/admin/stock-manager";
import type { ProductVariant } from "@/types/product";

interface PageProps {
  params: { id: string };
}

interface RawProduct {
  id: string;
  name: string;
  product_variants: ProductVariant[];
}

async function getProduct(id: string): Promise<RawProduct | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;

  const tenantId = getTenantIdFromHeaders();
  const admin = createAdminSupabaseClient();
  await admin.rpc("set_tenant_context", { p_tenant_id: tenantId });

  const { data, error } = await admin
    .from("products")
    .select("id, name, product_variants(id, size, color, stock)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single<RawProduct>();

  if (error || !data) return null;
  return data;
}

export default async function StockPage({ params }: PageProps) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Manage Stock
        </h1>
        <p className="text-sm text-neutral-400 truncate max-w-md">
          {product.name}
        </p>
      </div>
      <StockManager
        productId={product.id}
        variants={product.product_variants}
      />
    </div>
  );
}