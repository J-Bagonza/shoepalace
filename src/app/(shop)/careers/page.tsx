import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            Careers
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-8 max-w-2xl">
          <p className="text-base text-neutral-600 leading-relaxed">
            We are always looking for passionate people who care about great
            products and exceptional customer experiences.
          </p>
          <div className="border border-neutral-100 p-8 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              Current Openings
            </p>
            <p className="text-sm text-neutral-500">
              No open positions at this time. Check back soon or send your CV to{" "}
              <a
                href="mailto:careers@shoepalace.co.ke"
                className="text-neutral-900 underline underline-offset-4 hover:text-[#E8001D] transition-colors"
              >
                careers@shoepalace.co.ke
              </a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}