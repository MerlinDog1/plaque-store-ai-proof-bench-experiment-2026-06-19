# Supabase Setup

This repo now has a Supabase-first business data foundation. Supabase owns
customers, proof sessions, carts, orders, artifacts, email logs, Stripe webhook
idempotency, and admin notes. Stripe, Resend, and Gemini should reference these
rows rather than becoming the source of truth.

## 1. Create Project

Create a Supabase project and copy these values into `.env.local`:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not add it to Vercel/Cloudflare
as a public client variable and do not prefix it with `VITE_`.

## 2. Apply Schema

Use the Supabase SQL editor or the Supabase CLI to apply:

```text
supabase/migrations/20260619182000_initial_business_schema.sql
```

The migration creates:

- `customers`
- `proof_sessions`
- `proof_artifacts`
- `carts` and `cart_items`
- `orders` and `order_items`
- `addresses`
- `email_events`
- `stripe_events`
- `admin_notes`

It also creates these storage buckets:

- `proof-artifacts`
- `production-artifacts`
- `customer-uploads`
- `material-assets`
- `email-assets`

## 3. Security Shape

All business tables have row-level security enabled and no broad public policies.
The current app writes through `server.mjs` using the service role key.

Public proof links should use opaque `public_token` values through server routes,
not numeric database IDs. Admin access should later use Supabase Auth plus a
staff allowlist.

## 4. Current Server Endpoints

```text
GET  /api/supabase/health
POST /api/proof-sessions
GET  /api/proof-sessions/:publicToken
```

`POST /api/proof-sessions` accepts the current proof snapshot shape:

```json
{
  "email": "customer@example.com",
  "wording": "In loving memory...",
  "plaqueState": {},
  "generatedSvg": "<svg>...</svg>",
  "aiReasoning": "Optional internal notes",
  "priceEstimatePence": 12900,
  "currency": "gbp",
  "quoteFlags": {},
  "metadata": {}
}
```

The response returns the internal id, public token, status, expiry, and creation
time. The frontend should store the public token for magic-link resume and proof
approval.

## 5. Next Practical Steps

1. Wire the current proof approval/save button to `POST /api/proof-sessions`.
2. Upload proof SVG/PNG exports into the `proof-artifacts` bucket.
3. Create carts from approved proof sessions.
4. Add Stripe Checkout session creation with `cart_id` and `proof_session_id`
   metadata.
5. Process Stripe webhooks into `stripe_events`, then create/finalize `orders`.
