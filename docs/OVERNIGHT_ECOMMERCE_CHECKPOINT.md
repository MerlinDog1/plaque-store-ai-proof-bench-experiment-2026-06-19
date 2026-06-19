# Overnight Ecommerce Checkpoint

## Objective

Build as much of the next-stage ecommerce experience as possible without real
Supabase, Stripe, Resend, DNS, or production deployment access.

## Working Prototype

The app now has a proof-first ecommerce shell around the existing proof bench:

- Home page built around `Your proof in minutes. Your plaque in days.`
- Product launcher pages for bench, wall, tree/stake, business, and bespoke
  plaques.
- Product presets that open the proof bench with relevant material, size,
  fixing, border, wood, and typography defaults.
- Material guide using the existing app material assets.
- How-it-works and FAQ pages.
- Mock checkout that captures customer details, proof approval wording, price
  breakdown, quote/check flags, and a generated mock order ID.
- Mock admin dashboard showing created order packages and statuses.

## Current Philosophy

Customers should be able to edit freely until they choose **Approve proof &
order**. At that moment the order captures a locked proof snapshot. Manual
proofing is not the default customer flow; human/artwork review is a fallback
for flagged jobs.

## External Services

External services are deliberately mocked for this checkpoint:

- Supabase: represented by local data model/docs and in-memory order state.
- Stripe: represented by the mock checkout screen.
- Resend: represented by email template docs.
- Gemini: existing proof generation remains available through the current
  server proxy path.
- Hosting: local/Vite preview only.

## Verification

- `npm run build`
- Playwright walkthrough:
  - Home page headline renders.
  - Product details page opens.
  - Product launches the proof bench.
  - Checkout screen opens.
  - Approval checkbox creates a mock order.
  - Mock admin dashboard shows the order.
  - Mobile home view renders with the commerce header.

Screenshots are saved under `output/` locally and ignored by Git.
