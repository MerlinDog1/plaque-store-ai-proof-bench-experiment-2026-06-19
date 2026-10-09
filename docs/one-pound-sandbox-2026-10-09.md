# Private 123 × 456 mm / £1 sandbox checkout

Owner request, Telegram 3860, 9 October 2026: set up a 123 × 456 mm plaque at £1 for the test, replying to the proposed Stripe sandbox rehearsal. This is **not a live £1 promotion** or permission to charge a real card or enable Ads.

## Scope and access

- `/checkout-test.html` uses the existing InstaPlaque admin passcode/session. The page is unlinked, noindex/no-referrer/no-store, and loads no analytics.
- Its approve/start button sends a fixed rectangular 123 mm wide × 456 mm high, brushed-brass, no-wood/no-artwork fixture through the normal `/api/stripe/checkout-session` route.
- The server requires owner authentication for `sandboxTest: true` before any order write. It passes an internal pricing context (never trusts client metadata).
- Exactly 100 pence GBP, revalidated before Stripe. Adjacent dimensions, reversed dimensions, other shapes, wood and artwork are rejected. The normal quote rule for this large size remains unchanged outside the sandbox.
- The old global `ONE_POUND_TEST_PLAQUE_ENABLED` / `VITE_ONE_POUND_TEST_PLAQUE_ENABLED` switch is **not enabled or changed**. It would discount all sizes and is inappropriate for this task.

## Required configuration — currently missing

Add **`STRIPE_TEST_SECRET_KEY`** in the InstaPlaque Vercel project's **Production** environment, marked Sensitive, with this business's Stripe **sandbox/test** secret (`sk_test_…`). Do not put it in Git, chat or a VITE variable. Leave `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` unchanged.

Then redeploy this branch. This hosted Checkout flow needs only the separate test secret; it never exposes that key and does not require a test publishable key. If the key is absent or a live key, the UI is disabled and the API returns 503 **before creating an order**. No fallback to live payment keys is permitted.

The existing live webhook is unchanged. Sandbox confirmation is fetched from Stripe using the stored order's test policy on the normal `/order-confirmed` return. This deliberately tests the return path, not sandbox webhook delivery. An abandoned browser return is not an end-to-end pass.

## Isolation

Server-owned marker: `metadata.checkoutTestPolicy = 123x456-sandbox-v1`. Returned sessions must explicitly have `livemode: false` and a `cs_test_` ID. Finalisation still checks stored session ID, order ID, GBP, exact amount and paid/completed state.

Test orders are held in `issue` fulfilment/status (existing schema values), cannot be moved into production/dispatch, produce no proof pack, and send no confirmation, production, proof-copy, resend or review emails. The usual paid order is persisted with the test marker for return-flow testing. No schema migration is required. Admin paid/revenue metrics exclude the marker, including the legacy order-list storage path.

The shared confirmation page shows explicit test/no-charge/no-production copy. Live Google purchase tracking rejects the test marker **and** already excludes `cs_test_` sessions. No live Google sale is generated.

**There is no isolated GA4 test property connected by this change.** A `debug_mode` flag alone would not keep fake purchases out of production reports. Actual GA4 receipt / Analytics→Ads linkage remains a separate unverified step. Ads remain paused.

## Verification

- `node scripts/check-one-pound-test.mjs`: exact-price validation, adjacent/rotated/extra options rejected, client metadata cannot enable test pricing; real HTTP handler owner checks and missing/wrong-key 503 before storage; mocked Stripe key selection and session creation/retrieval; regular checkout retains original price/live-key selection; wrong mode/amount/currency/order rejected; repeated return yields one payment event and zero emails; no production proof generation. All external fetches intercepted.
- Existing server-checkout, Google purchase and analytics redaction checks passed. Google suite additionally checks rejection of a test marker even on an otherwise valid live-session fixture.
- TypeScript and production build passed. The runtime check inside build passed API boot, SVG sanitisation and three health endpoints.
- `node scripts/check-one-pound-test-browser.mjs`: built assets at production-shaped URLs, 390 px mobile viewport, synthetic APIs and all external network intercepted. Verified login, missing-key disabled state, correct £1 request, live-session redirect refusal, test confirmation/reload, no proof upload, no Google event/loader and no JavaScript errors. Screenshots inspected locally in ignored `output/`.
- The default pricing browser command initially could not find its bundled Playwright Chromium. System Chrome is available; the unchanged suite is run using a temporary ignored launcher and local server, with external requests blocked. The unchanged pricing suite then passed, including supplier pricing, wood, custom sizes and shape uplifts.
- **No real Stripe sandbox session/payment, Google receipt, customer/order/database write or email has been performed for these checks.**

## Deployment and rollback

Base: current verified production `dpl_D4AADmY5ReLfHXXNvYYKAdTt1y7Z`, app source `3a39b2c` plus docs-only `189f0ae`. Project `instaplaque`, `prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`. Preserve current Supabase/R2 and existing environment. New source is on `codex/instaplaque-pound-test-20261009`; Git auto-deployment stays disabled.

Do not claim the sandbox is connected until an actual Stripe session succeeds. Publish the guarded page, verify hosted assets/401/health, then obtain the separate sandbox key through Vercel settings. A key addition requires redeployment to take effect.

Before any test orders exist, rollback can promote the prior compatible deployment. **After test orders exist, do not roll back to code without the test-order email/production guards.** Disable the test key and redeploy guarded code instead, preserving records and isolation.

## Deployment checkpoint — 9 October, 22:42–22:44 UTC

Published source `740c388a7a95aad4c7e6a53b50f67eb3f64e4fb7` as Vercel **`dpl_4JT7pZiR1Whe55C6aW7mEhE9E2N8`**, URL `https://instaplaque-kq6u69v23-dullaghan31-3959s-projects.vercel.app`. Remote Node 22 build/runtime checks passed; deployment READY. Candidate files matched local bytes through authenticated Vercel curl and its app API returned 401. Verified the public site still had the expected preceding bundle before promotion; `vercel promote` succeeded. Independent canonical-domain inspect confirmed the new deployment.

Hosted canonical/www checks passed:

- `/checkout-test.html` 200, SHA256 `e2fa02fe25e7b189a3ebdc6303345f86109f4c758cd0d4da20f9d1cd67ef061b`, matching source. `noindex, nofollow`, `no-referrer`, `no-store` headers verified.
- `/checkout-test.js` 200, SHA256 `0bcb9e8566f77161d041398267d19b694249b4d8699ee6aea570c64fe068315f`, matching source.
- Main `index-CcFzqSZP.js` SHA256 `61cadd623fd0ddae8757e4cc55ea33d2c83d39c7c63098d99371ee339bacd3d3`, matching local built asset.
- `/api/admin/checkout-test` 401 `ADMIN_AUTH_REQUIRED` without app credentials.
- Stripe configuration 200: regular secret/publishable mode still **live**, webhook configured. Supabase health configured and Gemini health enabled. No existing environment value was edited.
- `www.instaplaque.co.uk/checkout-test.html` redirects to the canonical test page.
- Original pricing browser suite passed using system Chrome/local server with all nonlocal requests blocked; temporary server closed.

**Activation remains blocked only on the separate Stripe sandbox secret.** Actual owner-authenticated hosted checkout and a real Stripe sandbox completion remain unverified. No production order/database write, Stripe session/payment, email, fake Google conversion, Ads launch or PIM change occurred in this task. Do not confuse a deployed guarded page with a connected sandbox. GA4 test property/import verification is also still outstanding, not silently supplied by this deployment.
