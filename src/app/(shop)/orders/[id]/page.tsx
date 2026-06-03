import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchOrderById } from "@/lib/orders/fetch-order";
import { OrderTracking } from "@/components/orders/order-tracking";
import { MpesaPayment } from "@/components/checkout/mpesa-payment";
import { getTenantPaymentConfig } from "@/lib/payments/get-payment-config";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: "Order Tracking" };

export default async function OrderPage({ params }: PageProps) {
  if (!/^[0-9a-f-]{36}$/.test(params.id)) notFound();

  const [order, { mpesa_enabled }] = await Promise.all([
    fetchOrderById(params.id),
    getTenantPaymentConfig(),
  ]);

  if (!order) notFound();

  const showMpesaPrompt =
    mpesa_enabled &&
    order.payment_method === "mpesa" &&
    order.payment_status === "unpaid" &&
    order.status === "pending";

  return (
    <div className="min-h-screen pt-[72px] bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-12 md:py-20">
        {showMpesaPrompt ? (
          <div className="flex flex-col gap-12">
            <MpesaPayment
              orderId={order.id}
              total={order.total}
              defaultPhone={order.customer_phone ?? ""}
            />
            <div className="border-t border-neutral-100 pt-8">
              <OrderTracking order={order} />
            </div>
          </div>
        ) : (
          <OrderTracking order={order} />
        )}
      </div>
    </div>
  );
}