import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartDrawerController } from "./cart-drawer-controller";

export function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <CartDrawerController />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer />
    </>
  );
}