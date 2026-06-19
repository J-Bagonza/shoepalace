# Architecture

## The Model, in One Paragraph

ShoePalace is a mall, not a single shop. `shoepalace.store` is the directory at the entrance — it lists every active store and links out to them. Each store (`helenas.shoepalace.store`, `james-shoes.shoepalace.store`, ...) is an independently managed tenant: its own products, its own orders, its own admin user, its own payment configuration. They share one codebase and one database, but no tenant can read or write another tenant's data — that boundary is enforced by Postgres Row Level Security, not just by application code remembering to filter correctly (see `DATABASE.md` for the mechanism).

## Request Lifecycle

Every request, to any page on any subdomain, passes through `src/middleware.ts` first:

1. **Resolve the tenant from the hostname.** `extractSubdomain()` parses `helenas.shoepalace.store` → `helenas`, looks it up against `tenants`, confirms it's active. Unknown subdomain → 404 immediately, before any page logic runs. `www.shoepalace.store` is special-cased to redirect to the bare domain at the Vercel domain-configuration level, so the app itself never has to reason about `www` as a tenant.
2. **Stamp the request.** `x-tenant-id` and `x-tenant-slug` headers are attached for the rest of the request pipeline to read. These headers are useful for public, unauthenticated routes (e.g. "which store's products am I browsing"), but are **never** trusted for authorization decisions — see the `requireAuth` note below and `SECURITY.md`.
3. **Refresh the session.** The Supabase SSR client's cookie-handling logic runs here, silently renewing the auth session if needed so users don't get logged out mid-browse.
4. **Enforce route-level redirects.** Unauthenticated visit to `/admin` → `/login`. Authenticated visit to `/login` → home. Everything else passes through.

## Tenant Resolution: Two Different Trust Levels

This is worth being explicit about because it's the source of the most serious bug class in this kind of app (see `SECURITY.md`, 2026-06-04 entries):

- **Public routes** (browsing products, viewing a store's pages) resolve tenant from the `x-tenant-id` header set by middleware. This is fine — there's nothing sensitive being decided here, just "which store's catalog am I looking at."
- **Authenticated/admin routes** resolve tenant by looking up the *session's own user row* in `public.users` and reading that row's `tenant_id`. The header is never consulted for this. An admin's permissions are always derived from who they actually are, never from what subdomain the request happened to arrive on.

## Why Supabase, Not Raw AWS

Supabase runs on AWS underneath — Postgres, S3-compatible storage, the works. The question isn't "AWS vs. not-AWS," it's "configure AWS yourself vs. let Supabase configure it for you."

| | Supabase | Raw AWS |
|---|---|---|
| Time to working auth + RLS + storage | Hours | Weeks, and ongoing maintenance |
| Team required | One developer | Specialists for IAM, RDS, S3, Cognito or custom auth |
| Cost at current scale (handful of tenants) | ~$25/mo | Comparable infra cost + engineer time, which is the real cost |
| Cost at very large scale | Gets expensive | Wins, eventually |

The crossover point is real but it's measured in tens of thousands of daily active users generating sustained database load — not where this project is. Migrating off Supabase later, if that day comes, is a known and well-trodden path (it's Postgres underneath); migrating *to* a fully custom AWS stack now, before there's revenue or traffic to justify it, would be solving tomorrow's problem at the cost of building anything for today.

## Job Orchestration — What Exists and What Doesn't

Honest accounting, because pretending this is more automated than it is would cause real confusion later:

**What's actually in place:**
- **Fire-and-forget async tasks.** Order confirmation emails, status update emails, and usage-metric increments are all dispatched without blocking the API response. If one fails, the customer-facing request still succeeds; the failure is only visible in Sentry/Resend logs.
- **Database triggers** doing the work that would otherwise need a job queue: stock decrements on order confirmation, stock restoration on cancellation, automatic `order_events` rows on every status change, `updated_at` timestamps, and `expire_ad_listings()`/`get_active_ads()` opportunistically expiring stale ad listings on every read rather than needing a scheduled sweep.
- **Redis TTLs** for cache expiry — no cleanup job needed, Upstash deletes expired keys itself.

**What's deliberately not built yet:**
- No dedicated job queue (Inngest, Trigger.dev, Bull, etc.)
- No cron-scheduled jobs (e.g., a daily sales digest)
- No automatic retry-with-backoff for failed emails — a failed send is logged, not retried
- No background reconciliation job for stock drift (though `stock_movements` as the source of truth means drift, if it ever occurred, would at least be auditable)

This is a deliberate, current-scale-appropriate choice, not an oversight. The honest threshold for revisiting it: when a failed email or a missed scheduled task starts actually costing money or trust, not before. At that point the natural next step is Vercel Cron for anything that just needs to run on a schedule, reaching for Inngest only if step-functions-with-retries become genuinely necessary — see the open questions logged for that future phase rather than assuming the answer now.

## Logging and Audit, Four Layers

1. **Structured request logs (Pino)** — every API call gets a `requestId`, an event name, and timing, visible in Vercel's log dashboard. PII is redacted before logging.
2. **`audit_logs` (database, permanent)** — every admin mutation: who, what, when, on what. No `DELETE` policy exists for any role.
3. **`order_events` (database, permanent)** — the full status timeline for every order, including who/what triggered each change.
4. **Sentry** — full error context (stack trace, request details, user, browser) with alerting, for the failures nobody planned for.

Full detail and the actual fix history that shaped these choices: `SECURITY.md`.

## What's Deliberately Not Built Yet

Recorded here so it's a documented decision, not a silent gap someone has to rediscover:

- Background job queue / cron (see above)
- Automated dependency vulnerability scanning
- A formal penetration test
- Multi-currency settlement (currency *display* per store exists; actual multi-currency payment processing does not)
- Distributed-rate-limit-bypass mitigation beyond Upstash's sliding window (i.e., no botnet-specific defense)

None of these are wrong to be missing at this stage — they're the right next investments once the traffic or revenue exists to justify the engineering time, and listing them here means that's a decision someone made on purpose, not a thing that got forgotten.