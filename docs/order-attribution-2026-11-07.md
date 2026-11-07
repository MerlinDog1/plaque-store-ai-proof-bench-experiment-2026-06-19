# First-arrival order attribution

Part B only. Capture runs once at application-module load, before React navigation,
independent of consent. It reads the current URL and `document.referrer` into memory.
It never reads/writes cookies, localStorage, sessionStorage, IndexedDB or other device
storage, makes no requests, and does not start analytics. Existing consent controls
and their storage are unchanged. Reloads, full-page links and new tabs start a new
arrival; normal client navigation keeps the first one. No cross-tab/device matching.

## Data contract

`POST /api/stripe/checkout-session` accepts an optional top-level `attribution`.
The server canonicalizes it into `storefront_orders.metadata.attribution` through
the existing order metadata persistence path. No migration is needed. Old clients
without attribution remain unknown, not falsely direct. Admin single-order details
show **Arrival source** on phone and desktop; the existing order-origin Source
column is unchanged. Existing orders show **Not recorded**.

Whitelist: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
(up to 200 characters each); `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`
(up to 512, restricted characters); `referrer_host` (hostname only, at most 253);
`landing_path` (path only, at most 300). Controls/angle brackets are removed. Private
proof/order/admin/checkout path suffixes, URL queries and fragments are excluded.
Unknown keys, arrays and non-string values are discarded. The server recomputes
`label`, ignoring supplied labels. These are untrusted attribution hints, never
pricing, fulfilment, authentication or verified conversion evidence.

Stripe Checkout session metadata gets only `attribution_label` and, when present,
`attribution_campaign`. Click IDs, full attribution, referrer and landing path are
not added to Stripe metadata. This does not upload offline advertising conversions.

## Labels and reference suffixes

| Evidence | Label | Contact suffix |
|---|---|---|
| Google click ID, or Google + paid UTM medium | `google_ads` | G |
| As above with explicit `utm_medium=shopping/pla` or `utm_source=google_shopping` | `google_shopping` | G |
| Meta click ID, or Facebook/Instagram/Meta + paid UTM medium | `facebook_instagram_ads` | F |
| Google source/referrer without paid evidence | `google_organic` | O |
| Bing source/referrer without paid evidence | `bing` | O |
| Microsoft click ID, or Bing + paid medium | `bing` | **B** |
| Other external referring hostname | `other_referral:<host>` | R |
| No usable external source/referrer, or same-site referrer | `direct` | D |

**B is an additional code for Bing/Microsoft ads**, to avoid labelling those organic
or Google. Google wins when a URL contains competing click IDs, then Meta, then Bing.
Shopping is only distinguished by explicit tags, not a guess from a campaign name.
`fbclid` can also accompany an unpaid Facebook link: F/the Meta-ads label is a source
hint, not proof of paid traffic. Stripped click IDs, blocked referrers and untagged
campaigns can appear as organic/direct. No source means “direct/unknown”, not proof
that someone typed the URL. Avoid placing personal information in campaign tags.

WhatsApp and mailto links use the existing random `IP-XXXXXXXXXX` reference with
`-G/-F/-O/-D/-R/-B` appended at activation. The same reference reaches the desktop
WhatsApp QR code and email alternative. No raw campaign or click IDs are included
in those messages. Consent-gated analytics accepts both old and suffixed references;
its consent/redaction rules are unchanged.

The free human-proof form already had an `IP-DESIGN-…` reference. It now sends only
the source code (not attribution/click IDs), validates the enum server-side, and
appends the code to its receipt and existing plain-text email. Retries include that
code in the existing idempotent payload digest. Old clients preserve their original
reference/digest. Saved-proof email has no comparable short reference and is unchanged.

## Offline verification

- `npm run check:attribution`: labels/codes, hostile input, caps, no-device-storage
  capture, first-arrival stability, public/private navigation, canonical order and
  Stripe parameters, free-proof reference and mocked-mail retry behavior.
- `npx vite build --outDir output/attribution-dist`
- `npm run check:attribution-browser`: local built assets with all browser traffic
  intercepted/aborted, no server. Phone Google CPC (including the exact `?utm_source=google&utm_medium=cpc&gclid=TEST` case), Google Shopping and desktop Instagram
  product-page arrivals reject optional cookies, activate contact references, navigate to the
  real designer, generate a mocked proof, approve it and submit real UI checkout.
  The intercepted checkout payload passes through real pure server canonicalization
  and Stripe parameter builders. Only a fixture checkout page is shown; the admin
  single-order label is then verified against mocked authenticated read responses.
- `npm run typecheck`, `check:server-checkout`, `check:design-requests`,
  `check:posthog`, `check:analytics-redaction`, `check:admin-orders`.

No live API, checkout session, database write, email, deployment or push is needed
for these checks. Public legal text was deliberately not edited; the release report
contains proposed disclosure wording for the owner to review.
