import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AdminProductTable } from "@/components/admin/product-table";
import type { Product } from "@/types/product";

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

async function getProducts(showDeleted: boolean): Promise<Product[]> {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("products")
    .select(`
      id, name, slug, price, category,
      is_featured, deleted_at, created_at, updated_at,
      product_images ( id, url, alt, position ),
      product_variants ( id, size, color, stock )
    `)
    .order("created_at", { ascending: false });

  if (!showDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.returns<Product[]>();
  if (error || !data) return [];
  return data;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const showDeleted = searchParams["show_deleted"] === "true";
  const products = await getProducts(showDeleted);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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

      {/* Toggle */}
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