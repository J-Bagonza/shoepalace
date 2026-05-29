import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ImageUpload } from "@/components/admin/image-upload";
import { ModelUpload } from "@/components/admin/model-upload";
import type { Product } from "@/types/product";

interface PageProps {
  params: { id: string };
}

async function getProduct(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("products")
    .select(`
      id, name, slug, model_url,
      product_images ( id, url, alt, position )
    `)
    .eq("id", id)
    .single<Product>();

  if (error || !data) return null;
  return data;
}

export default async function ProductUploadsPage({ params }: PageProps) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const existingImages = (product.images ?? [])
    .sort((a, b) => a.position - b.position)
    .map((img, i) => ({
      url: img.url,
      path: img.url,
      alt: img.alt,
      position: i,
    }));

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Uploads
        </h1>
        <p className="text-sm text-neutral-400 truncate max-w-md">
          {product.name}
        </p>
      </div>

      {/* Images */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            Product Images
          </h2>
          <p className="text-[10px] text-neutral-300 uppercase
            tracking-widest">
            First image is used as the primary display image.
          </p>
        </div>
        <ImageUpload
          productId={product.id}
          existingImages={existingImages}
        />
      </div>

      <div className="h-px bg-neutral-100" />

      {/* 3D Model */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs uppercase tracking-widest text-neutral-500">
            3D Model
          </h2>
          <p className="text-[10px] text-neutral-300 uppercase
            tracking-widest">
            Upload a .glb file to enable the 3D viewer on the product page.
          </p>
        </div>
        <ModelUpload
          productId={product.id}
          existingUrl={product.model_url}
        />
      </div>
    </div>
  );
}