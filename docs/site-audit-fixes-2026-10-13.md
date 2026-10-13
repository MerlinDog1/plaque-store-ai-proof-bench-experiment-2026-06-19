# Site and stack audit fixes - 13 October 2026

Owner authorised implementation and release after the checked assessment.
Branch `codex/instaplaque-audit-fixes-20261013` starts at consent branch
`081d977d61a9ad4d231a086d740eb03c46b54fc7`, including independently verified live
source `f7dcff058c885b3566e71b9e6b805f0f2bb6ebd6`. The old Documents checkout
remains untouched. Backend remains Supabase `fygweiynqkglmjwqlouc` and private
R2. No credentials/environment values changed; Git deployment stays disabled.

## Changes

- Revoked PUBLIC/anon/authenticated execution of order-proof claims and PIM
  worker invocation. Service-role and postgres cron access retained. Timestamp
  trigger search path fixed. No paid Auth upgrade.
- Added service-only row-locked Checkout lifecycle RPCs, a Stripe event ledger
  with leases/retries, atomic email recording and provider idempotency. Other
  brands' events are ignored. Repeated completion/expiry cannot regress paid
  orders, dispatch or attached proofs. Unpaid orders cannot newly enter
  production/ready-to-dispatch/dispatch. Historical discrepancies not guessed.
- Handles completed, expired, async_payment_succeeded and async_payment_failed.
  **Live endpoint subscriptions still need verification.** Additional payment
  methods require `STRIPE_DYNAMIC_PAYMENT_METHODS=true` (default false). First
  verify this site's enabled live endpoint subscribes to all four events. Keep
  its existing secret and do not change the other brands' account settings.
- Designer/server/Stripe delivery estimates now follow the catalogue: 5 standard,
  7 aged, 10 A4/A5 wood or 15 custom working days production, plus one transit.
- Optional proof email saves a private 30-day return link and sends one requested
  email, with no marketing subscription or follow-up series. Validation,
  same-origin/trusted-IP checks, honeypot, 4 MiB body cap, durable limits of
  3/IP/hour, 3/recipient/day and 30 globally/day. HMAC identities, request/provider
  idempotency, accepted-result dedupe and proof expiry checks. Ambiguous sends
  cannot retry beyond the provider's 24-hour idempotency window.
- Gemini durable limits supplement the process-local guard: 20 weighted units
  per IP/minute and 1,000 globally/day. Protection failures fail closed.
- Includes the prepared Consent Mode v2 changes. PostHog/Meta and private purchase
  measurement still require consent. GA4 `proof_download_prepared` and
  `begin_checkout` reflect completed browser/API outcomes, exclude QA and contain
  no private parameters. Import as **secondary** Ads actions after verification.
- Existing PostHog dashboard 1017503 / project 303026 action insight 6512440 now
  includes proof-email attempts, acceptance and errors. Site/production/QA/24h
  filters retained; query passed. Existing daily report not duplicated or resent.
  Data Catalog scope unavailable; counts are operational, not approved metrics.
- Direct designer entry starts at A5 / GBP95.50; product/restored presets retained.
  Lazy controls/preview/export/provider SDK and route-specific inscription fonts
  reduce initial JS from about 1,056 KB to 689 KB raw (223 KB gzip). Exports await
  fonts. Hashed assets cache for a year. Removed AI Studio import map and disabled
  production mock-hub routes/client calls.
- Separate sitemap includes all 175 exact products; editorial/image sitemap
  preserved and design-request added. Real components now render the initial
  design-request/legal HTML. Shorter product descriptions, UK/brand titles and
  page-specific social images; concrete bench product links; accurate quote copy.

## Database

Commit `e8324f0` contains migrations `20261013135000`, `20261013141000`,
`20261013143000`. Tested together in a rolled-back transaction before application
using the migrated project's target-psql wrapper. Checks covered payment
session/amount/currency, retry preservation of dispatch/proofs, late expiry,
event leases, email dedupe and rate boundaries. Existing PIM and FlatCut postgres
cron jobs remain active. New functions are service-role only. No customer rows
were changed by migrations/tests.

## Verification

- Typecheck/build, runtime health, consent ordering/acceptance/withdrawal and
  redaction, purchase dedupe, checkout pricing/artifacts/recovery, public-input
  and fail-closed security, exact-size owner test isolation.
- 175 feed products retain prices/images/production times. 360 physical offers
  across 181 pages retain shipping/returns policies. Twenty editorial URLs and
  175 product sitemap entries verified. Browser catalogue hydration passed.
- Mobile/desktop designer, no-JS guidance, actual consent banner and network
  fixture checks passed. Collection intercepted: not Google receipt proof.
- Proof email UI/provider result tested with mocks only. No customer email,
  enquiry, live checkout/payment or real model generation. Acceptance is not
  confirmed delivery.
- Browser-downloaded synthetic proof PDF visually rendered: EB Garamond and
  brushed steel texture preserved. Existing PDF design was not redesigned.
- Live private R2/DB integration passed with named synthetic fixtures and cleanup.
  Existing historical missing test assets were not rewritten. Round/oval fixing
  and typography regressions passed.
- CI adds checkout/email/request-limit, owner-test, security and privacy checks.

## Remaining account/owner work

No browser surfaces are connected to the current tools. Stripe subscriptions,
additional payment eligibility/Google Pay, any failed PIM webhook and Ads imports
or purchase receipt need account access. No reminder marketing was sent without
verified opt-in. Historical order discrepancies need Stripe/dispatch evidence.
Real photos/reviews and a replacement legal business address need owner facts;
do not restore the expressly removed old address. Leaked-password protection is
a paid Supabase Auth feature and does not protect the custom admin; no upgrade.
No new GBP1 live charge was made.

## Release / rollback

Stage production with `vercel deploy --prod --skip-domain`, verify and promote
the same build. Project `prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`, team
`team_ixtKhYUPfpSnMuyaBrzYUQQe`. Previous production is
`dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`. Code rollback may promote that predecessor.
**Keep additive migrations and revoked public grants**; never restore the old
backend or reopen functions. Disable extra payment methods before rollback if
they have subsequently been enabled. Verified release identifiers follow below.
