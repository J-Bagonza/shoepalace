import { ShopLayout } from "@/components/layout/shop-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShopLayout>{children}</ShopLayout>;
}