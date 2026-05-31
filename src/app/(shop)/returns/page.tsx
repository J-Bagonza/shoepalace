import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Returns" };

const POLICY = [
  {
    title: "30-Day Returns",
    body: "Return any unworn item within 30 days of delivery for a full refund. Items must be in original condition with tags attached.",
  },
  {
    title: "How to Return",
    body: "Contact us at returns@shoepalace.co.ke with your order number. We will arrange collection from your location in Nairobi within 2 business days.",
  },
  {
    title: "Refund Timeline",
    body: "Refunds are processed within 5 business days of receiving your return. M-Pesa refunds are instant once processed.",
  },
  {
    title: "Exchanges",
    body: "Want a different size or colour? We offer free exchanges within 30 days. Contact us and we will sort it out.",
  },
  {
    title: "Non-Returnable Items",
    body: "Items that have been worn, washed, or damaged are not eligible for return. Custom or sale items are final sale.",
  },
] as const;

export default function ReturnsPage() {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            Returns Policy
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-6 max-w-2xl">
          {POLICY.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 py-6 border-b border-neutral-100
                last:border-0"
            >
              <h2 className="text-sm font-medium uppercase tracking-widest
                text-neutral-900">
                {item.title}
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}