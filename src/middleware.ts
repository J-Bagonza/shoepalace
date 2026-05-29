import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  response.headers.set("x-request-id", requestId);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.headers.set("x-request-id", requestId);

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

  // Get authenticated user once
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  // Redirect unauthenticated users away from admin routes
  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
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