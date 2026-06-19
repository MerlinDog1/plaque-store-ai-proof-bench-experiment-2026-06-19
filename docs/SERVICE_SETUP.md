# Service Setup

This document describes the practical service architecture for the ecommerce
MVP. The current prototype may mock all external services locally. Do not commit
real credentials, Stripe price ids, Resend domains, Supabase service keys, or
Gemini keys.

## Target Architecture

- Frontend: current React/Vite proof bench.
- Server/API: Node server routes beside `server.mjs`, or the hosting platform's
  serverless functions later.
- Database: Supabase Postgres.
- Storage: Supabase Storage.
- Payments: Stripe Checkout and Stripe webhooks.
- Email: Resend transactional templates.
- AI: Gemini through same-origin server routes only.
- Hosting later: Vercel, Netlify, Render, Fly.io, Supabase Edge Functions, or a
  small VPS. Cloudflare quick tunnels are prototype review only.

The browser should never receive secret keys. The browser talks to same-origin
routes such as `/api/proofs`, `/api/checkout`, `/api/gemini/*`, and the server
talks to Supabase, Stripe, Resend, and Gemini.

## Environment Variables

Use names like these in `.env.local` for development and in the host's secret
store for production. Values below are intentionally blank examples.

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MODE=dynamic

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=

# Gemini
GEMINI_API_KEY=

# App
APP_BASE_URL=http://127.0.0.1:4179
MAGIC_LINK_SECRET=
MOCK_SERVICES=true
```

Only `SUPABASE_ANON_KEY` is safe for browser use, and even that should be used
with row-level security. Prefer server routes for MVP writes.

## Supabase Setup

1. Create a Supabase project for staging.
2. Add the tables from `docs/DATA_MODEL.md`.
3. Enable required extensions:
   - `pgcrypto` for UUID/token helpers if needed.
   - `citext` for case-insensitive email columns.
4. Create storage buckets:
   - `proof-artifacts`
   - `production-artifacts`
   - `customer-uploads`
   - `material-assets`
   - `email-assets`
5. Keep `production-artifacts` and `customer-uploads` private.
6. Use API routes with the service-role key for webhook and artifact writes.
7. Add RLS policies only after the token routes are working and tested.

Recommended first server routes:

| Route | Purpose |
| --- | --- |
| `POST /api/proofs` | Create/update anonymous proof session. |
| `GET /api/proofs/:token` | Reopen a magic-link proof. |
| `POST /api/proofs/:token/email` | Send proof link via Resend. |
| `POST /api/carts` | Convert proof into basket/cart. |
| `POST /api/checkout` | Create Stripe Checkout Session or mock checkout. |
| `POST /api/webhooks/stripe` | Verify and process Stripe events. |
| `POST /api/webhooks/resend` | Optional email delivery/open/click events. |

## Stripe Setup

Use Stripe Checkout for the MVP. Start with dynamic `price_data` line items
based on the frozen cart totals instead of maintaining a Stripe price for every
material/size combination.

Checkout Session metadata should include:

```json
{
  "cart_id": "uuid",
  "order_id": "uuid",
  "proof_session_id": "uuid",
  "public_token": "opaque-token",
  "order_number": "PSA-2026-000123"
}
```

Stripe flow:

1. Customer approves proof and chooses checkout.
2. Server freezes the cart and creates an `orders` row with
   `status=awaiting_payment`.
3. Server creates Stripe Checkout Session with frozen item description, amount,
   shipping address collection, and metadata above.
4. Browser redirects to Stripe.
5. Stripe redirects to `/order/success?session_id=...`, but this page only shows
   a pending/confirmed message.
6. `checkout.session.completed` webhook marks the order paid.
7. `payment_intent.payment_failed` or `checkout.session.expired` updates failure
   states.

Minimum webhooks to handle:

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Webhook handling must be idempotent by storing Stripe event ids in
`stripe_events` before mutating order state.

## Resend Setup

Use Resend only from the server. Suggested template keys:

- `magic_link`: reopen proof/session.
- `proof_ready`: proof link plus thumbnail.
- `checkout_started`: optional abandoned-checkout recovery.
- `payment_received`: receipt/order confirmation.
- `manual_quote_received`: quote request acknowledgement.
- `production_ready`: optional internal/admin notification.
- `dispatched`: shipping confirmation later.

Each send should create an `email_events` row with `status=queued`, then update
to `sent` or `failed` after the Resend API call. If Resend webhooks are enabled,
append provider delivery statuses to the same row or create child events.

## Gemini Setup

The current prototype already routes Gemini through the same-origin Node server.
Keep that pattern.

Gemini should be used for:

- AI-authored text layout/proof composition.
- Optional proof explanation/reasoning for internal review.
- Optional realistic preview imagery.
- Future copy cleanup suggestions, with the exact wording rule controlled by the
  product decision for that flow.

Gemini should not be used to:

- Calculate payment totals.
- Decide whether Stripe payment succeeded.
- Write directly to Supabase from the browser.
- Replace deterministic production checks for size, borders, fixings, and quote
  flags.

For local mocks, return deterministic proof SVG/layout responses so checkout and
email flows can be tested without spending model calls.

## Hosting Later

Good first production shape:

- Host the React build and server/API together on Vercel or Render.
- Use Supabase for Postgres and Storage.
- Use Stripe hosted checkout.
- Use Resend for transactional email.
- Keep `APP_BASE_URL` stable, e.g. `https://plaquestore.ai` or staging domain.

If using Vercel:

- Move server routes into `/api/*` functions or keep an Express-compatible
  adapter.
- Configure Stripe webhook endpoint as `/api/webhooks/stripe`.
- Set all secrets in Vercel environment variables.

If using Render/Fly/VPS:

- Keep `server.mjs` as the app server.
- Serve `dist/` statically from the same process.
- Put the service behind HTTPS and configure webhook URLs there.

## What Can Be Mocked Locally

All external services can be mocked for the overnight MVP:

| Service | Local mock |
| --- | --- |
| Supabase DB | JSON files, in-memory store, or browser localStorage for proof/cart data. |
| Supabase Storage | `output/` or `tmp/` files with generated local paths. |
| Stripe | Mock checkout route that marks an order `paid` when clicked. |
| Stripe webhook | Local test route that accepts fixture events. |
| Resend | Console/file email outbox with generated magic links. |
| Gemini | Existing local deterministic typesetter or fixture SVG response. |
| Hosting | Local `npm run dev` / `node server.mjs`; Cloudflare quick tunnel for review. |

Mock payloads should match the future service contracts, especially IDs,
metadata, statuses, and email event rows. That keeps the app code swappable when
real integrations are enabled.

## Local Mock Mode Contract

When `MOCK_SERVICES=true`:

- `/api/proofs` stores proof sessions locally and returns a `public_token`.
- `/api/proofs/:token/email` writes an email event to a local outbox and returns
  the magic link.
- `/api/checkout` creates a fake order and fake Stripe session id like
  `cs_test_mock_...`.
- `/api/mock/pay/:orderToken` simulates `checkout.session.completed`.
- Gemini calls may use the existing deterministic/local composition path.
- No network calls are made to Stripe, Resend, Supabase, or Gemini unless a
  specific mock override is disabled.

## Credential Rules

- Never commit `.env.local` or any file containing real secrets.
- Keep `.env.example` to variable names only.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, or `GEMINI_API_KEY` to the browser.
- Stripe webhooks must verify signatures before trusting payloads.
- Magic-link tokens must be long, random, and non-sequential.
