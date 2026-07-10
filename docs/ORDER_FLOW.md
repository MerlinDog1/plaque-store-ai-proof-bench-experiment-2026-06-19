# Order Flow

The MVP should feel like no-login ecommerce: design the plaque, see the proof,
approve it, pay, and receive confirmation. External services can be mocked
locally, but the flow should already match the future Supabase, Stripe, Resend,
and Gemini contracts.

## Customer Journey

1. Customer opens the proof bench.
2. Customer chooses material, size/shape, colour, fixings and border, wood,
   wording, and proof options.
3. App generates a live proof locally or through Gemini via the server proxy.
4. App saves a `proof_sessions` row or local mock record.
5. Customer enters email only when they want to save, send, request quote, or
   checkout.
6. Server sends a magic link by Resend or writes a mock email event locally.
7. Customer approves proof and adds it to basket.
8. Server freezes design, price, wording, quote flags, and artifact references.
9. If no manual quote is required, server creates Stripe Checkout Session.
10. Stripe webhook confirms payment and moves the order into production intake.

## Magic-Link No-Login Flow

No password account is needed for the MVP.

Magic links should use `proof_sessions.public_token` or `carts.public_token`:

```text
https://example.com/proof/{public_token}
https://example.com/cart/{public_token}
https://example.com/order/{order_public_token}
```

Rules:

- Token must be random, opaque, and unguessable.
- Token grants access only to that proof/cart/order summary.
- Email capture attaches or creates a `customers` row.
- The app can keep a local browser draft before email capture.
- Expired anonymous proof links can remain read-only or ask for email recovery.

Recommended proof session statuses:

- `draft`: customer is still editing.
- `proof_ready`: a proof has been generated.
- `emailed`: magic proof link sent.
- `approved`: customer clicked approve/add to basket.
- `abandoned`: no activity after retention period.
- `converted`: cart/order created from the proof.

## Quote vs Checkout Decision

Before checkout, run deterministic quote checks on the frozen design.

Proceed to Stripe when:

- price is known;
- plaque fits production assumptions;
- delivery is UK standard;
- quantity is within fixed pricing;
- no unsupported material/fixing/artwork path is present.

Switch to quote request when `quote_flags.requires_manual_quote=true`.

Customer-facing copy should say the proof has been saved and the team will
confirm price/production details. The quote request should still create a cart
or order-like record with `status=quoted`, so it does not vanish from operations.

## Cart and Approval Flow

1. Customer clicks approve/add to basket.
2. Server creates or updates `carts` with `status=active`.
3. Server creates `cart_items` from the current `proof_session`.
4. Server freezes:
   - full plaque state JSON;
   - wording;
   - generated proof artifact ids;
   - customer price in pence;
   - quote flags;
   - product type/category;
   - quantity.
5. If customer edits the plaque after this, create a new proof revision or update
   cart item only before checkout starts.

Once Stripe checkout starts, do not mutate the paid design in place. Create a
revision/admin note if changes are needed.

## Stripe Checkout Flow

Server action `POST /api/checkout`:

1. Validate cart token.
2. Ensure email is present.
3. Recalculate/freeze total from server-side pricing rules.
4. If quote required, create quote request and do not call Stripe.
5. Create `orders` row:
   - `status=awaiting_payment`
   - `payment_status=unpaid`
   - `fulfilment_status=not_started`
6. Create Stripe Checkout Session with dynamic `price_data`.
7. Store `stripe_checkout_session_id`.
8. Return Checkout URL to browser.

Stripe metadata:

```json
{
  "cart_id": "uuid",
  "order_id": "uuid",
  "proof_session_id": "uuid",
  "order_number": "PSA-2026-000123",
  "public_token": "opaque-proof-or-cart-token"
}
```

Success/cancel URLs:

```text
/order/success?session_id={CHECKOUT_SESSION_ID}
/cart/{public_token}?checkout=cancelled
```

The success page may poll the server, but it must not mark the order paid. Only
the verified webhook can do that.

## Stripe Webhook Flow

`POST /api/webhooks/stripe`:

1. Read raw request body.
2. Verify any valid `v1` signature with `STRIPE_WEBHOOK_SECRET` and reject
   timestamps outside a five-minute tolerance.
3. Insert event id into `stripe_events`; if it already exists, return success.
4. Handle event by type.
5. Update `stripe_events.processed_at` or store error.

Event handling:

- `checkout.session.completed`:
  - find order by metadata or Checkout Session id;
  - set `payment_status=paid`;
  - set `status=paid` or `proof_review` if quote/manual review flags apply;
  - set `paid_at`;
  - copy shipping/billing details;
  - queue `payment_received` email.
- `checkout.session.expired`:
  - set order `status=payment_failed` or cart back to `active`;
  - queue optional recovery email.
- `payment_intent.payment_failed`:
  - set `payment_status=failed`;
  - keep proof/cart recoverable.
- `charge.refunded`:
  - set `payment_status=refunded`;
  - set order `status=refunded` if fully refunded.

## Order Status Lifecycle

```text
draft
  -> awaiting_payment
  -> payment_failed
  -> paid
  -> proof_review
  -> production_ready
  -> in_production
  -> quality_check
  -> dispatched
  -> complete
```

Alternate paths:

```text
draft -> quoted -> production_ready
awaiting_payment -> cancelled
paid -> refunded
proof_review -> cancelled
```

Operational meaning:

- `paid`: money is confirmed, but production files may not be checked.
- `proof_review`: paid/quote accepted but needs manual review.
- `production_ready`: production SVG/PDF exists and checks passed.
- `in_production`: order has been sent to supplier or made internally.
- `quality_check`: made item is being checked before dispatch.
- `dispatched`: shipment has left.
- `complete`: done/closed.

## Email Events

Recommended Resend event types:

- `magic_link_requested`
- `proof_ready_sent`
- `proof_approved`
- `quote_request_received`
- `checkout_started`
- `checkout_abandoned`
- `payment_received`
- `production_review_needed`
- `dispatched`
- `refund_issued`

Each email send should create an `email_events` row with:

- recipient;
- related proof/order ids;
- template key;
- provider id if sent through Resend;
- status;
- non-secret payload.

In mock mode, write the email payload to a local outbox and return the generated
link in the API response for easy testing.

## Gemini Proof Flow

The proof generator remains a server-mediated service.

1. Browser sends wording and plaque state to `/api/gemini/generate-content` or a
   future `/api/proofs/:token/generate` route.
2. Server calls Gemini or local mock.
3. Server validates/sanitizes generated SVG content.
4. Server stores proof state/artifact.
5. Browser renders the saved proof.

Gemini output is advisory/artistic. Deterministic code remains responsible for:

- price;
- dimensions;
- quote flags;
- production bed checks;
- payment status;
- order status;
- final production export validation.

## Local Overnight MVP Mock Flow

Minimum useful prototype without real services:

1. `localStorage` or a JSON file stores proof sessions and carts.
2. A mock proof email writes to `mock-outbox.json` with the magic link.
3. Mock checkout creates:
   - `order_number`;
   - `stripe_checkout_session_id=cs_test_mock_*`;
   - `status=awaiting_payment`.
4. Mock pay button simulates `checkout.session.completed`.
5. Order moves to `paid` or `proof_review`.
6. Mock payment confirmation email is added to the outbox.
7. Admin/dev can inspect saved JSON and generated artifacts.

Even in mock mode, keep field names close to the real Supabase/Stripe/Resend
contracts so the later integration is a service swap, not a product rewrite.

## Production Intake Checklist

Before an order can move from `paid` to `production_ready`:

- Approved proof artifact exists.
- Production SVG/PDF artifact exists or can be regenerated.
- Plaque dimensions are valid.
- Material and fixing are supported.
- Border/fixing combination passes the current geometry rules.
- Text/wording matches the approved proof.
- Quote flags are clear or manually acknowledged.
- Shipping address is present.

If any check fails, set `status=proof_review` and add an `admin_notes` entry.
