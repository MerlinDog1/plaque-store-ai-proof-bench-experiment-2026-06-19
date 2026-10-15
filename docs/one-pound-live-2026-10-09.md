# Owner-only £1 live checkout — 9 October 2026

## Authorised correction

The owner clarified in Telegram message 3870: “No I'll just pay an actual pound live”.
This supersedes the earlier sandbox proposal and its missing-test-key instructions.
The owner will enter their own card details on Stripe; Cody does not charge a card.

Entry point: `https://instaplaque.co.uk/checkout-test.html`, using the existing
InstaPlaque admin passcode/session. The unlinked page is noindex, no-referrer and
no-store. No new keys, database schema or payment-account settings are required.

## Contract

- Only an authenticated owner request with `liveTest: true` and
  `confirmLivePayment: true` enables the internal price policy.
- Exact fixture: 123 × 456 mm, rectangular, no wood or artwork; exactly 100 pence
  GBP. Normal shop pricing and the existing quote rule stay unchanged.
- The server derives its own order, price and `liveVerificationPolicy` marker;
  client metadata cannot enable the discount. Live and sandbox flags are mutually
  exclusive. Availability and invalid-size checks happen before order creation.
- Existing live Stripe keys must both be live. Hosted Checkout must return a
  `cs_live_` session with `livemode: true`, amount 100 and currency `gbp`.
  Finalisation also checks order/session identity and completed paid status.
- Stored marker: `metadata.liveVerificationPolicy = 123x456-live-v1` with
  `noFulfilment: true`. There is deliberately no sandbox `checkoutTestPolicy` on
  the live verification order. The existing sandbox path remains fail-closed for
  compatibility with old records/pages; no test key is requested by the new UI.
- A real paid order records real payment/revenue, but remains in fulfilment
  `issue`/hold. Server guards block production/dispatch status changes, production
  proof packs, order emails and review follow-ups. Stripe may independently send
  a payment receipt according to its existing account settings.

## Purchase measurement

The owner can explicitly allow optional analytics/advertising cookies on the
private page. An existing choice is remembered; new visitors are not opted in.
The private entry page itself loads no analytics. After payment, the normal
`/order-confirmed` flow verifies payment and uses the existing privacy-preserving
GA4 purchase frame: £1 GBP, stable digest transaction ID, consent gate and local
deduplication. No customer/order URLs, raw lookup IDs or Stripe sessions are sent
to Google. Rejected consent prevents purchase measurement.

This can establish GA4 purchase receipt after the owner pays and checks their
property. It does not prove Ads attribution or the GA4→Ads import/link. Ads stay
paused. No synthetic Google sale is sent by the development checks.

## Checks and release

- `node scripts/check-one-pound-test.mjs`: passed sandbox compatibility plus
  owner-only live selection, explicit payment intent, £1 price enforcement,
  public spoof rejection, wrong mode/amount/currency/order rejection, repeated
  paid finalisation and no production proof/application email. Stripe/storage
  dependencies were mocked; no real order or payment was created.
- `node scripts/check-server-checkout.mjs`: passed normal canonical pricing,
  checkout identity, origin and paid-session checks.
- `node scripts/check-google-purchase.cjs`: passed normal privacy/consent/dedup
  coverage plus a consented real-mode verification fixture reporting £1 GBP once.
- `npm run typecheck` and `npm run build`: passed. Built main bundle:
  `index-BCMhDUUS.js`; existing chunk-size warning only.
- `node scripts/check-one-pound-test-browser.mjs`: passed with the built app at
  production-shaped URLs, mobile 390 px viewport, synthetic APIs and a mocked
  Google tag. Login, unavailable-live state, explicit remembered cookie choice,
  exact live checkout request, sandbox redirect refusal, paid return, rejected
  consent zero purchases, accepted consent £1 GBP once, reload deduplication,
  private-field exclusion and no production proof/JS errors passed. Screenshots
  were visually inspected. All external traffic was intercepted.

## Published release

- App source `5c84d666220c945d520d767ef6765732f416f231` on
  `codex/instaplaque-live-pound-20261009`, reviewed and pushed to the private repo.
- Vercel `instaplaque` / `prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`:
  READY `dpl_C2T7RfDVjnCyqNKituKMQxzXDx7X`,
  `https://instaplaque-6u5q36l49-dullaghan31-3959s-projects.vercel.app`.
- Built with production environment and `--skip-domain`; candidate HTML/JS
  matched source and the owner API returned application 401. The preceding
  canonical bundle was rechecked before promotion; no competing release found.
- Promoted successfully. A separate canonical deployment inspection returned the
  same READY deployment. Canonical and www serve `index-BCMhDUUS.js`; the hosted
  main bundle, test HTML/JS and unchanged Google purchase frame files exactly
  match the local tested build/source.
- Both private HTML documents retain noindex, no-referrer and no-store headers.
  Unauthenticated GET configuration and POST live-test creation both return 401.
  Existing live Stripe modes/webhook presence and Supabase/Gemini health checks
  passed. The health probe was corrected to use Gemini's existing `ok`/`hasKey`
  response, rather than assuming the Supabase `configured` field.

**No actual Stripe session, card charge, Google receipt, database/order write,
application email, Ads activation or PIM change was made by this release task.**
The owner's authenticated payment remains the next end-to-end check. No new
Stripe key or environment change is needed. Google/Ads account-side receipt and
the import/link remain unverified.

## Rollback

After any verification order exists, do not deploy a revision lacking both live
and sandbox production/email guards. Prefer disabling the private entry point
while retaining its server marker handling. The earlier sandbox-only deployment
does not understand the new live marker and is not a safe unchanged rollback
after a live verification record has been created.
