import Link from "next/link";

export const metadata = {
  title: "Terms of Use — ShoePalace",
};

const SECTIONS = [
  {
    id: "acceptance",
    title: "Acceptance of terms",
    body: [
      "By accessing or using ShoePalace, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our platform.",
    ],
  },
  {
    id: "the-platform",
    title: "About the platform",
    body: [
      "ShoePalace is a multi-vendor marketplace that connects customers with independently operated shoe stores. Each store on ShoePalace is responsible for its own inventory, pricing, order fulfilment, and customer service for purchases made through that store.",
      "ShoePalace provides the underlying technology and infrastructure but is not the seller of record for products listed by individual stores.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    body: [
      "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
      "You must be at least 18 years old, or have parental consent, to create an account and make purchases.",
    ],
  },
  {
    id: "orders-and-payment",
    title: "Orders and payment",
    body: [
      "When you place an order, you enter into a purchase agreement directly with the individual store, not with ShoePalace. Prices are set by each store and displayed in the currency the store has selected.",
      "Payments are processed via M-Pesa through our payment partner. By placing an order, you authorize the charge for the total amount shown at checkout.",
      "Orders are subject to acceptance and product availability. A store may cancel an order if an item is out of stock or if fraud is suspected.",
    ],
  },
  {
    id: "store-applications",
    title: "Opening a store",
    body: [
      "Anyone may apply to open a store on ShoePalace. We review applications and reserve the right to approve, reject, or remove any store at our discretion, including for violations of these terms or suspected fraudulent activity.",
      "Store owners are independently responsible for the accuracy of their product listings, compliance with applicable laws, and fulfilment of orders.",
    ],
  },
  {
    id: "prohibited-conduct",
    title: "Prohibited conduct",
    body: [
      "You agree not to use the platform to list or sell counterfeit goods, engage in fraudulent transactions, harass other users, or attempt to interfere with the security or operation of the platform.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: [
      "The ShoePalace name, logo, and platform design are the property of ShoePalace. Store owners retain ownership of their own product images, descriptions, and branding uploaded to their store.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    body: [
      "ShoePalace is provided on an \u201cas is\u201d basis. We do not guarantee uninterrupted or error-free service. To the fullest extent permitted by law, ShoePalace is not liable for disputes between customers and individual stores, including issues with product quality, shipping, or returns.",
    ],
  },
  {
    id: "changes-to-terms",
    title: "Changes to these terms",
    body: [
      "We may update these terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: [
      "Questions about these terms? Contact us at hello@shoepalace.store.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-[#F5F0E8] py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="w-8 h-0.5 bg-[#E8001D] mb-6" />
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide
            text-neutral-900 leading-none mb-3">
            Terms of Use
          </h1>
          <p className="text-sm text-neutral-500">
            Last updated: June 1, 2026
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Table of contents — desktop sticky sidebar */}
            <nav className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-widest
                  text-neutral-400 mb-2">
                  On this page
                </p>
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-xs text-neutral-500 hover:text-neutral-900
                      transition-colors py-1.5 leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-12 min-w-0">
              <p className="text-sm text-neutral-600 leading-relaxed">
                Please read these Terms of Use carefully before using
                ShoePalace. These terms govern your access to and use of
                our marketplace, including browsing, purchasing, and
                operating a store on the platform.
              </p>

              {SECTIONS.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="flex flex-col gap-3 scroll-mt-24"
                >
                  <h2 className="font-bebas text-2xl tracking-wide
                    text-neutral-900">
                    {section.title}
                  </h2>
                  {section.body.map((para, i) => (
                    <p
                      key={i}
                      className="text-sm text-neutral-600 leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ))}

              <div className="border-t border-neutral-100 pt-8 mt-4">
                <p className="text-xs text-neutral-400">
                  Questions about these terms?{" "}
                  <a
                    href="mailto:hello@shoepalace.store"
                    className="text-neutral-900 underline underline-offset-4
                      hover:text-[#E8001D] transition-colors"
                  >
                    hello@shoepalace.store
                  </a>
                </p>
                <Link
                  href="/privacy"
                  className="inline-block mt-4 text-xs uppercase
                    tracking-widest text-neutral-500 hover:text-neutral-900
                    transition-colors underline underline-offset-4"
                >
                  Read our Privacy Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}