import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — ShoePalace",
};

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: [
      "We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment details when you create an account, place an order, or contact support.",
      "We also automatically collect certain information when you use our platform, including your IP address, browser type, device information, and pages visited, through cookies and similar technologies.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How we use your information",
    body: [
      "We use the information we collect to process orders, communicate with you about your purchases, provide customer support, and improve our platform.",
      "We may also use your information to send you marketing communications, which you can opt out of at any time.",
    ],
  },
  {
    id: "sharing-your-information",
    title: "Sharing your information",
    body: [
      "We share your order information with the individual store you purchase from, as each store on ShoePalace is independently responsible for fulfilling its own orders.",
      "We use third-party service providers for payment processing (M-Pesa via PayHero), email delivery, and hosting. These providers only receive the information necessary to perform their services.",
      "We do not sell your personal information to third parties.",
    ],
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: [
      "We retain your account and order information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.",
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: [
      "You can access, update, or request deletion of your personal information at any time by contacting us or through your account settings.",
      "You may opt out of marketing communications by following the unsubscribe link in any email we send.",
    ],
  },
  {
    id: "security",
    title: "Security",
    body: [
      "We implement industry-standard security measures to protect your personal information, including encryption of sensitive data and secure authentication. No method of transmission over the internet is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    body: [
      "We use cookies to keep you signed in, remember your cart, and understand how you use our platform. You can control cookies through your browser settings, though disabling them may affect platform functionality.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: [
      "We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated revision date.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    body: [
      "If you have questions about this privacy policy, contact us at hello@shoepalace.store.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-[#F5F0E8] py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="w-8 h-0.5 bg-[#E8001D] mb-6" />
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide
            text-neutral-900 leading-none mb-3">
            Privacy Policy
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
                ShoePalace (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                &ldquo;our&rdquo;) operates a multi-vendor footwear
                marketplace connecting customers with independent shoe
                stores across Kenya. This policy explains how we collect,
                use, and protect your information when you use our
                platform.
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
                  Questions about this policy?{" "}
                  <a
                    href="mailto:hello@shoepalace.store"
                    className="text-neutral-900 underline underline-offset-4
                      hover:text-[#E8001D] transition-colors"
                  >
                    hello@shoepalace.store
                  </a>
                </p>
                <Link
                  href="/terms"
                  className="inline-block mt-4 text-xs uppercase
                    tracking-widest text-neutral-500 hover:text-neutral-900
                    transition-colors underline underline-offset-4"
                >
                  Read our Terms of Use →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}