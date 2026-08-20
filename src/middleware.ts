import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extractSubdomain, resolveTenantBySlug } from "@/lib/tenant/resolve-tenant";
import { SHOEPALACE_SLUG } from "@/types/tenant";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const hostname = request.headers.get("host") ?? "localhost";

  // ── WAF SECRET CHECK ──────────────────────────────────────────
  // Once the WAF is live, every legitimate request arrives with
  // this header set by the WAF proxy. Requests missing it are
  // hitting Vercel's origin directly, bypassing the WAF entirely.
  //
  // IMPORTANT: only enforce this in production AND only after the
  // WAF DNS cutover is complete — enforcing it before the WAF is
  // live will lock everyone out including you.
  //
  // Set WAF_ENFORCE=true in Vercel env vars AFTER the WAF is live.
  // ─────────────────────────────────────────────────────────────
  const wafSecret = process.env.WAF_SECRET;
  const enforceWaf = process.env.WAF_ENFORCE === "true";

  if (enforceWaf && wafSecret) {
    const incomingSecret = request.headers.get("x-waf-secret");

    if (incomingSecret !== wafSecret) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
  // ─────────────────────────────────────────────────────────────

  // =============================================
  // TENANT RESOLUTION
  // - vercel.app preview URLs → default to ShoePalace
  // - localhost → default to ShoePalace
  // - shoepalace.store or www.shoepalace.store → ShoePalace
  // - *.shoepalace.store → resolve subdomain as tenant slug
  // =============================================
  const isVercelApp = hostname.endsWith(".vercel.app");
  const isLocalhost =
    hostname === "localhost" || hostname.startsWith("localhost:");
  const isRootDomain =
    hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;
  const subdomain =
    isVercelApp || isLocalhost || isRootDomain
      ? SHOEPALACE_SLUG
      : extractSubdomain(hostname);

  const tenant = await resolveTenantBySlug(subdomain);

  if (!tenant) {
    return new NextResponse(
      JSON.stringify({ error: "Store not found." }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-tenant-id", tenant.id);
  response.headers.set("x-tenant-slug", tenant.slug);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.headers.set("x-request-id", requestId);
          response.headers.set("x-tenant-id", tenant.id);
          response.headers.set("x-tenant-slug", tenant.slug);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};