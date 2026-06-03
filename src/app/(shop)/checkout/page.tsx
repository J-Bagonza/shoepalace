import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getTenantPaymentConfig } from "@/lib/payments/get-payment-config";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { mpesa_enabled } = await getTenantPaymentConfig();

  return (
    <div className="min-h-screen pt-[72px] bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-20">
        <h1 className="font-bebas text-display-md text-neutral-900
          leading-none mb-12">
          Checkout
        </h1>
        <CheckoutForm mpesaEnabled={mpesa_enabled} />
      </div>
    </div>
  );
}