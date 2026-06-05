import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";

  const safeNext = next.startsWith("/") ? next : "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", req.url),
    );
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_code", req.url),
    );
  }

  // Recovery flow — send to update password page
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/update-password", req.url));
  }

  return NextResponse.redirect(new URL(safeNext, req.url));
}