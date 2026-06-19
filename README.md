# ShoePalace

A multi-tenant e-commerce marketplace for Kenya's footwear market. Independent stores run on their own subdomain (`storename.shoepalace.store`); the bare domain (`shoepalace.store`) is a directory that lists and links to every active store. One platform admin reviews and approves new stores; each store's own admin manages only their own products, orders, and settings.

## Stack

| Layer | Tool | Role |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Pages, API routes, middleware |
| Database & Auth | Supabase (Postgres + RLS) | Data storage, row-level tenant isolation, authentication |
| Hosting | Vercel | Deployment, wildcard subdomain routing |
| Cache & Rate Limiting | Upstash Redis | Product cache, per-tenant rate limits |
| Email | Resend | Order confirmations, status updates, store approval, password reset |
| Payments | PayHero (M-Pesa) | STK push, payment confirmation webhook |
| Error Tracking | Sentry | Production error capture and alerting |

See `ARCHITECTURE.md` for why each of these was chosen and how they fit together.

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=shoepalace.store
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
PAYMENT_ENCRYPTION_KEY=        
```

### Local subdomains

Add to your hosts file to test tenant subdomains locally:

```
127.0.0.1  shoepalace.localhost
127.0.0.1  teststore.localhost
```

Then visit `http://shoepalace.localhost:3000`.

## Documentation

- **`ARCHITECTURE.md`** — system design, the mall analogy, request lifecycle, middleware, why Supabase over raw AWS, what's deliberately not built yet
