import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            About ShoePalace
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-8 max-w-2xl">
          <p className="text-base text-neutral-600 leading-relaxed">
            ShoePalace is a premium footwear destination built for those who
            move with purpose. Every pair in our collection is precision-selected
            for quality, design, and durability.
          </p>
          <p className="text-base text-neutral-600 leading-relaxed">
            Founded in Nairobi, we ship across Kenya and deliver the world&apos;s
            finest footwear directly to your door. We believe great shoes are not
            a luxury — they are a foundation.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
            {[
              { value: "2024", label: "Founded" },
              { value: "Nairobi", label: "Headquarters" },
              { value: "Kenya", label: "Market" },
              { value: "100%", label: "Premium Materials" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="font-bebas text-3xl text-neutral-900 tracking-wide">
                  {item.value}
                </span>
                <span className="text-xs uppercase tracking-widest text-neutral-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}