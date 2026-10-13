# Google Consent Mode v2 — 13 October 2026

## Scope and source

Owner message4526 supplies an exact replacement for the public Google tag block
and asks for an audit of remaining React consent gates. Only that application
block changes; Meta, PostHog, the banner and purchase measurement stay unchanged.
Branch: `codex/instaplaque-consent-v2-20261013`, reusing the idle
`projects/instaplaque-design-seo-20261013` checkout without copying dependencies.
Base: `2c5cd37`, the documentation checkpoint for live application
`f7dcff058c885b3566e71b9e6b805f0f2bb6ebd6`.
Independent pre-edit canonical inspection confirmed READY deployment
`dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`. Remote fetch found no newer source.

Status: prepared for review; production build/browser CI pending. **Not deployed.**
This task's code-edit instruction does not itself explicitly request publication;
the repository requires an explicit deployment request. No production state,
Ads settings, database, customer data or payment is changed by these checks.

## Exact requested change

- The supplied script is byte-for-byte identical, and is the first script in
  `<head>`, before the import map, structured data and application/tracking code.
  The UTF-8 charset declaration remains first for correct HTML encoding.
- All four consent types default to denied with `wait_for_update: 500` before
  either Google destination is configured. Ads data redaction and URL
  passthrough are enabled.
- Public canonical/www pages load the Ads Google script independently of
  cookie acceptance and configure `AW-18288208905` and `G-FKP17EXNBX` once.
- Saved consent and subsequent custom/storage events update the four states
  through the unchanged `instaplaque-analytics-consent-v1` key and
  `instaplaque:optional-ad-consent-changed` event.
- Private proof/order/admin/checkout URLs still do not load/configure Google;
  preview/local hosts stay excluded. GA4 keeps the supplied allowlisted URL
  parameters, strips fragments and reduces the referrer to its origin. The
  actual browser URL, including any click ID, is not rewritten.

This is advanced public-page consent configuration, not proof of Google receiving
or crediting purchases. Google describes denied-state measurements without
cookies and separate modelling eligibility requirements:
https://developers.google.com/tag-platform/security/concepts/consent-mode

## Remaining gates found in the application

Repository-wide runtime search covered the React components and services, entry
HTML and public scripts (not just index.html).

1. The only `window['ga-disable-G-FKP17EXNBX']` assignment was in the replaced
   index block. No React/service assignment or second public-page Google loader
   was found. Tests refer to the name only to assert it is absent at runtime.
2. `services/googlePurchase.ts`, `validCheckoutReturn()`, still requires
   `metaConsent() === 'yes'` before creating the event-only purchase iframe.
   The helper reads the historical `instaplaque-meta-consent` choice, not the
   newer analytics key. `components/SiteExperience.tsx` calls it for a confirmed
   order and retries on the shared consent-change event.
3. `public/google-purchase.js` separately reads `instaplaque-meta-consent`, refuses
   a message without acceptance, and loads GA4 only after that check. It checks
   again on script load before sending `purchase`. That frame has its own
   consent defaults: storage/user-data granted, personalisation denied.
4. `components/MetaConsent.tsx` already writes analytics consent first, then Meta
   consent; `services/metaPixel.ts` emits the shared change event. This supplies
   the new Google listener with the updated analytics value. All are unchanged.

Consequently, missing/rejected consent still blocks the purchase event itself.
This exact Task1 replacement does **not** convert that separate purchase path
to advanced mode or verify the Ads Purchase action. No gates were silently
removed. Meta remains opt-in only, and PostHog/Vercel analytics remain unchanged.

## Verification

- Focused Node checks passed for initial default/update/config ordering; saved,
  missing and rejected consent; late acceptance and withdrawal; storage events
  and failures; single loading; private/preview exclusions; URL redaction.
- Existing Google purchase, Meta, PostHog and analytics-redaction regressions
  passed. The old assertions expecting no public loader before consent and an
  empty private-page queue now reflect the requested advanced mode: one denied
  public loader, and private consent settings without destination/event setup.
- The exact source block was compared directly with the owner's supplied text.
- CI will check typecheck/build, source and generated-page script order, existing
  catalogue/designer regressions and the actual built React banner. Google and
  Meta requests in the browser fixture are intercepted with local stubs; no
  analytics delivery, synthetic conversion or real purchase is involved.
- No local heavy build/browser is started: account use is above 3 GiB. Existing
  read-only CI is reused without changing workflows or Git deployment guards.

## Next step / rollback

Finish CI and record its exact application SHA and run. If publication is later
requested, recheck the live baseline, create/inspect a protected Vercel candidate
and independently verify canonical after promotion. Immediate compatible rollback
is `dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`; no backend rollback is necessary.
