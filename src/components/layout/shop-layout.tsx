import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartDrawerController } from "./cart-drawer-controller";
import { CurrencyProvider } from "@/context/currency-context";
import { getTenantFromHeaders } from "@/lib/tenant/server-tenant";
import { fetchTenantSettings } from "@/lib/tenant/fetch-settings";

export async function ShopLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantFromHeaders();
  const settings = tenant ? await fetchTenantSettings(tenant.id) : null;
  const currency = (settings as { currency?: string } | null)?.currency ?? "GBP";

  return (
    <CurrencyProvider currency={currency}>
      <Navbar />
      <CartDrawerController />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer />
    </CurrencyProvider>
  );
}