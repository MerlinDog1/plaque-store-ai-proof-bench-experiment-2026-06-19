# £1 owner test from the designer — 10 October 2026

Owner message 3874 reported the ordinary oversized-plaque warning while trying
the already-authorised real £1 checkout for 123 × 456 mm. The previous private
checkout worked independently, but the ordinary designer still attempted a
normal quote. This correction supplies a clear route to that private checkout.

## Scope

- Exact 123 × 456 mm rectangle, no wood or artwork: the designer's final order
  panel and `/checkout` show a £1 test card linking to `/checkout-test.html`.
- The card clearly describes a fixed, non-fulfillable owner test, requires the
  existing admin sign-in on the destination, and offers `/quote` for a real plaque.
- Other sizes, reversed dimensions, wood and artwork retain ordinary pricing and
  quote checks. The shared eligibility helper does not grant a price override.
- Existing server owner authentication, explicit live-payment confirmation,
  exact 100p GBP price, payment validation, manufacture/email holds and purchase
  privacy/consent/deduplication remain unchanged.
- No Stripe payment, order write, generation, customer email or Ads activation is
  performed by the checks or release. PIM remains untouched.

## Verification before release

- Existing `check-one-pound-test.mjs` and `check-server-checkout.mjs`: passed.
- TypeScript and production build: passed; main bundle `index-BU8PILNh.js`.
- New `check-one-pound-designer.mjs`: passed at mobile 390px with all networking
  intercepted. Exact-size designer and checkout route reach the private login;
  adjacent/reversed/wood/artwork/normal cases retain existing forms and quote
  behavior. No API writes or JavaScript errors. Mobile card screenshot inspected.
- Existing `check-one-pound-test-browser.mjs`: passed unchanged private-page and
  consented/rejected payment-return fixtures. No collection request reaches Google.
- `git diff --check`: passed.

The first build failed with ENOSPC. Only verified ignored/untracked, rebuildable
`dist` folders for this task and the three preceding checkout/tracking worktrees
were cleared, then the build passed. Source, customer assets, evidence, credentials
and databases were not removed. VPS storage remains tight; do not run extra builds
or delete private artifacts indiscriminately.

## Preparation checkpoint

Prepared on `codex/instaplaque-test-designer-20261010`, based on
`862096bbb023352ac26d1cc23a976c2ed26eb8c1`. Not yet deployed at this checkpoint.
The current prior live deployment is `dpl_C2T7RfDVjnCyqNKituKMQxzXDx7X`.
After release record the source, candidate inspection, promotion and both public
aliases below. This prior deployment is compatible for code rollback because it
already retains both live and sandbox verification-order guards.

## Published release

- Application source `d13eaf630c2fb6df879bf34281f2407c16dd5fdf`, reviewed and pushed
  on the named task branch; Git auto-deployment remains disabled.
- Vercel production build passed at READY `dpl_6XcsgpUTxk5AG5uE9sG6xQg4Pf2H`,
  `https://instaplaque-5ndex3jy5-dullaghan31-3959s-projects.vercel.app`.
- Candidate root HTML, main JavaScript and private test HTML exactly matched the
  local tested build/source; private configuration returned application HTTP401.
  Public site's prior bundle was checked immediately before promotion; no
  competing release was found. Promotion completed successfully.
- Separate canonical inspection resolves to the same READY deployment. Both
  canonical and www serve the new entry bundle. Hosted main JS, test HTML/JS and
  purchase-frame HTML/JS match the checked local bytes. Private HTML retains
  noindex, no-referrer and no-store headers.
- Public unauthenticated test configuration and live-test checkout creation both
  reject HTTP401, before any order/payment is created. Existing live Stripe
  configuration/webhook presence and Supabase/Gemini health passed.
- Hosted mobile check used actual public static assets, synthetic proof/session
  API responses and blocked all external requests. Exact-size designer and
  `/checkout` both navigate to the private owner sign-in without the oversized
  error; adjacent/reversed/wood/artwork/normal configurations preserve existing
  forms and quote behavior. No API writes or browser errors; screenshot reviewed.
- No payment was made; owner card entry/actual Google receipt/import verification
  still remains. No manufacturing, customer email or Ads enabling occurred.

Nonsecret evidence is retained locally in ignored `output`: candidate/public
verification JSON and hosted mobile screenshot. Previous deployment
`dpl_C2T7RfDVjnCyqNKituKMQxzXDx7X` remains compatible for code-only rollback, with
the same caveat that rollback restores the old designer quote obstacle.
