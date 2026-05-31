import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Contact" };

const CONTACTS = [
  { label: "Email", value: "hello@shoepalace.co.ke", href: "mailto:hello@shoepalace.co.ke" },
  { label: "WhatsApp", value: "+254 700 000 000", href: "https://wa.me/254700000000" },
  { label: "Instagram", value: "@shoepalaceke", href: "https://instagram.com/shoepalaceke" },
  { label: "Location", value: "Nairobi, Kenya", href: null },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            Contact
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-12 max-w-2xl">
          <div className="flex flex-col gap-2">
            <p className="text-base text-neutral-600 leading-relaxed">
              We are here to help. Reach out through any of the channels below
              and we will get back to you within 24 hours.
            </p>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-neutral-100">
            {CONTACTS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-5"
              >
                <span className="text-xs uppercase tracking-widest text-neutral-400">
                  {item.label}
                </span>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="text-sm text-neutral-900 hover:text-[#E8001D] transition-colors underline underline-offset-4"
                  >
                    {item.value}
                  </a>
                ) : (
                  <span className="text-sm text-neutral-900">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          <div className="border border-neutral-100 p-6 flex flex-col gap-2 bg-[#F5F0E8]">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Response Time
            </p>
            <p className="text-sm text-neutral-600">
              Monday – Friday, 9am – 6pm EAT. We aim to respond within
              2 hours during business hours.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}