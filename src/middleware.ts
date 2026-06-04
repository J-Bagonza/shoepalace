import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extractSubdomain, resolveTenantBySlug } from "@/lib/tenant/resolve-tenant";
import { SHOEPALACE_SLUG } from "@/types/tenant";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "shoepalace.store";

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const hostname = request.headers.get("host") ?? "localhost";

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