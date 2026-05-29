import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          New Product
        </h1>
        <p className="text-sm text-neutral-400">
          Fill in the details below to create a new product.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}