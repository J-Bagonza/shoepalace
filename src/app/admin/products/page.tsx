export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminProductTable } from "@/components/admin/product-table";
import { redirect } from "next/navigation";
import { PRODUCT_SELECT } from "@/lib/products/queries";
import type { Product } from "@/types/product";

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

async function getTenantId(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single<{ tenant_id: string; role: string }>();

  if (!profile) redirect("/login");

  return profile.tenant_id;
}

async function getProducts(
  tenantId: string,
  showDeleted: boolean,
): Promise<Product[]> {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (showDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.returns<Product[]>();
  if (error || !data) return [];
  return data;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const tenantId = await getTenantId();
  const showDeleted = searchParams["show_deleted"] === "true";
  const products = await getProducts(tenantId, showDeleted);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
            Products
          </h1>
          <p className="text-sm text-neutral-400">
            {products.length} {showDeleted ? "archived" : "active"} products
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-neutral-900 text-white px-5 py-2.5 text-xs
            uppercase tracking-widest hover:bg-neutral-700
            transition-colors duration-200"
        >
          + Add Product
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className={`text-xs uppercase tracking-widest transition-colors
            ${!showDeleted
              ? "text-neutral-900 underline underline-offset-4"
              : "text-neutral-400 hover:text-neutral-900"
            }`}
        >
          Active
        </Link>
        <Link
          href="/admin/products?show_deleted=true"
          className={`text-xs uppercase tracking-widest transition-colors
            ${showDeleted
              ? "text-neutral-900 underline underline-offset-4"
              : "text-neutral-400 hover:text-neutral-900"
            }`}
        >
          Archived
        </Link>
      </div>

      <AdminProductTable products={products} showDeleted={showDeleted} />
    </div>
  );
}