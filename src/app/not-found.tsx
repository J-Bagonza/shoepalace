import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen
      gap-8 px-6 bg-[#F5F0E8]">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-bebas text-[8rem] leading-none text-neutral-900/10
          select-none">
          404
        </p>
        <div className="flex flex-col items-center gap-3 -mt-6">
          <div className="h-px w-8 bg-[#E8001D]" />
          <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
            Page Not Found
          </h1>
          <p className="text-sm text-neutral-500 max-w-sm">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="bg-neutral-900 text-white px-8 py-3 text-xs
            uppercase tracking-widest hover:bg-neutral-700
            transition-colors duration-200"
        >
          Go Home
        </Link>
        <Link
          href="/products"
          className="text-xs uppercase tracking-widest text-neutral-400
            underline underline-offset-4 hover:text-neutral-900
            transition-colors"
        >
          Shop All
        </Link>
      </div>
    </div>
  );
}