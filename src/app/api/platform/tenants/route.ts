import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/platform/tenants
 *
 * Internal, WAF-facing endpoint — NOT a public API. Returns the list
 * of currently active tenant slugs so the WAF can distinguish:
 *   - legitimate tenant subdomains (skip further checks)
 *   - subdomains that look like enumeration (never a valid tenant)
 *   - subdomains that WERE valid recently but no longer are
 *     (a stale/dormant subdomain — worth flagging as a takeover
 *     exposure risk per the project brief's multi-tenant attack list)
 *
 * Auth: reuses WAF_SECRET, the same shared secret already used for
 * the X-WAF-Secret header on every WAF-forwarded request. Here the
 * direction is reversed — the WAF is the CLIENT calling this
 * endpoint directly (server-to-server, not through the WAF's own
 * proxy listener) — so it authenticates itself the same way
 * ShoePalace already expects from the WAF elsewhere. No new secret
 * needed.
 *
 * Called by the WAF with Host: shoepalace.store (the root domain),
 * not a tenant subdomain — this resolves to the ShoePalace platform
 * tenant in middleware.ts exactly like any other root-domain request,
 * and carries x-waf-secret the same way every other WAF-forwarded
 * request does, so it passes WAF_ENFORCE the normal way. No
 * middleware exception is needed for this route.
 *
 * Returns ONLY slugs — no tenant IDs, names, or any other data —
 * since it's consumed by an external process (the WAF) and slugs are
 * already public information anyway (they're literally the
 * subdomain).
 *
 * Note on the platform root slug ("shoepalace"): it's deliberately
 * NOT included in this response, since it isn't a row in the tenants
 * table. The WAF already treats "shoepalace" as always-known on its
 * own side (tenantRegistry.js's PLATFORM_SLUG check) — this endpoint
 * only needs to report real, individual tenant slugs.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Auth: WAF shared secret ───────────────────────────────────
  const wafSecret = process.env.WAF_SECRET;
  const incomingSecret = request.headers.get("x-waf-secret");

  if (!wafSecret || incomingSecret !== wafSecret) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // ── Fetch active tenants ──────────────────────────────────────
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("tenants")
    .select("slug")
    .eq("is_active", true);

  if (error) {
    console.error("[platform/tenants] Failed to fetch tenants:", error.message);
    return NextResponse.json(
      { error: "Failed to load tenant list." },
      { status: 500 },
    );
  }

  const slugs = (data ?? []).map((row: { slug: string }) => row.slug);

  return NextResponse.json({
    slugs,
    generated_at: new Date().toISOString(),
  });
}