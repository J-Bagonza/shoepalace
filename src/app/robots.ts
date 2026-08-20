import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/platform",
          "/platform/*",
          "/api/*",
          "/setup",
          "/update-password",
          "/auth/*",
          "/onboarding",
          "/onboarding/*",
          "/cart",
          "/checkout",
          "/orders",
        ],
      },
      {
        // Block AI training crawlers — protects your content
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
          "FacebookBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `https://${rootDomain}/sitemap.xml`,
  };
}