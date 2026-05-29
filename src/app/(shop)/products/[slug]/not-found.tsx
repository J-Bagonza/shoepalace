import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen
      gap-6 px-6">
      <h1 className="font-bebas text-display-md text-neutral-900">
        Product Not Found
      </h1>
      <p className="text-sm text-neutral-400 text-center max-w-sm">
        The product you are looking for may have been removed or does not exist.
      </p>
      <Link
        href="/products"
        className="text-xs uppercase tracking-widest text-neutral-900
          underline underline-offset-4 hover:text-[#E8001D] transition-colors"
      >
        Back to Shop
      </Link>
    </div>
  );
}