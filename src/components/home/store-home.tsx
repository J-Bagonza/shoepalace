import { Hero } from "@/components/home/hero";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Categories } from "@/components/home/categories";
import { BrandStatement } from "@/components/home/brand-statement";
import { Newsletter } from "@/components/home/newsletter";
import type { Product } from "@/types/product";
import type { Tenant } from "@/types/tenant";

interface StoreHomeProps {
  featuredProducts: Product[];
  tenant: Tenant;
}

export function StoreHomePage({ featuredProducts, tenant }: StoreHomeProps) {
  return (
    <>
      <Hero />
      <FeaturedProducts products={featuredProducts} />
      <Categories />
      <BrandStatement />
      <Newsletter />
    </>
  );
}