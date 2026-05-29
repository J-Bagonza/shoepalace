import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },

  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",

              // Next.js + React hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com",

              // Tailwind / Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",

              // Images
              "img-src 'self' data: blob: https://*.supabase.co",

              // API / Auth / Sentry
              "connect-src 'self' https://*.supabase.co https://*.ingest.de.sentry.io",

              // Security hardening
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  experimental: {
    outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "shoepalace",
  project: "shoepalace",

  silent: !process.env.CI,

  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: false,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
