# Consent Mode follow-up: purchase audit, policies and network checks

Owner message4527 requests Tasks2–4, continuing the exact Task1 replacement on
`codex/instaplaque-consent-v2-20261013`. No deployment is requested. The existing
PR17 remains the review surface. Purchase and Meta code remain unchanged.

## Actual purchase route (not a direct Ads event)

1. `components/SiteExperience.tsx`, `OrderConfirmedPage`, loads the order from
   `/api/orders/:id` with the checkout session. Its effect calls
   `trackGooglePurchase(order)` and retries on the consent-change event.
2. `services/googlePurchase.ts` requires a paid, positive, GBP order on the
   canonical HTTPS `/order-confirmed` return, matching order ID and live Stripe
   session. Sandbox/test-policy, unpaid and malformed returns are excluded.
   The historical `instaplaque-meta-consent=yes` choice is still required.
3. It creates same-origin `/google-purchase.html`, with no query/referrer,
   and uses an origin/source-checked message to pass only amount, currency and
   a digest. It does not pass a raw order ID, Stripe session or customer data.
4. `public/google-purchase.js` rechecks consent, configures `G-FKP17EXNBX` with
   `send_page_view:false`, and sends:

   ```js
   gtag('event', 'purchase', {
     // Safe constant page fields and one generic plaque item are also included.
     send_to: 'G-FKP17EXNBX',
     value: order.totalPence / 100,
     currency: 'GBP',
     transaction_id: 'ip_' + SHA256('instaplaque:ga4:purchase:' + order.id)
   });
   ```

   Here `order`/`SHA256` illustrate the parent helper's calculation, not actual
   variables exposed to Google. The frame uses the received `data` fields.
   Example:7640p becomes GBP76.40. The transaction ID is stable for deduplication.

There is **no** `gtag('event','conversion',...)` call or `AW-18288208905/LABEL`
purchase destination in current runtime source. `AW-18288208905` is configured
by the normal public-page tag only. The October9 record describes a GA4-imported
Purchase action and a separate legacy Website action made Secondary by the
owner. This is historical owner confirmation, not a fresh account read.
Google documents GA4 imports separately from direct Ads conversion events:
https://developers.google.com/tag-platform/devguides/conversions

The frame is same-origin and can use previously consented Google cookies.
However, cookie continuity does not prove Ads attribution, conversion-action
mapping or account receipt. TEST123 is a synthetic click ID, not a real ad click.
Missing/rejected consent still prevents the purchase frame. No denied-consent
purchase modelling, new native Ads action or duplicate conversion is added.

## Wording before and after

Privacy, previous opening/sentence:

> Optional analytics starts after you accept it in Cookie settings.
> We also use Vercel Web Analytics and Google Analytics with your permission.

Privacy, replacement opening:

> PostHog and Vercel Web Analytics start after you accept optional analytics in
> Cookie settings.

New Privacy “Google measurement” section:

> Before you accept, or if you reject optional cookies, Google Analytics and
> Google Ads receive limited cookieless measurement signals on public pages to
> help us understand whether our ads work. Google does not store or read
> analytics or advertising cookies, or build an advertising profile from these
> signals. If you accept, Google can use analytics and advertising cookies to
> measure visits and advertising performance. You can change your choice in
> Cookie settings on the Cookie details page.

Cookies, previous Google-related sentences:

> With your permission, PostHog, Vercel Web Analytics and Google Analytics
> measure visits and how the website is used.
> Google Analytics and Google Ads may use cookies and similar technologies.

Cookies, replacement “Analytics and marketing” section:

> Before you accept, or if you reject optional cookies, Google Analytics and
> Google Ads receive limited cookieless measurement signals on public pages to
> help us understand whether our ads work. Google does not store or read
> analytics or advertising cookies, or build an advertising profile from these
> signals. If you accept, Google can use analytics and advertising cookies to
> measure visits and advertising performance. Your choice is remembered
> separately from your design and order details.

The existing PostHog details move into “Other optional analytics”, with
withdrawal wording distinguishing PostHog/Vercel stopping from Google reverting
to cookieless signals. Existing purchase opt-in wording and Meta wording/code
remain intact. The Privacy update date is13October2026. Essential proof/payment
storage is not misrepresented as absent before consent.

## Testing approach and release status

The VPS account remains over3GiB, so browser/build checks use existing PR CI,
sequentially, without a local browser/build or resource-limit change. Workflow
permissions and disabled Git deployment are unchanged.

`scripts/check-google-consent-network.mjs` uses fresh isolated Chromium contexts,
actual built app/banner, and newly fetched public Google tag JavaScript.
Only allowlisted public script/static GETs leave the runner. Google collection,
Meta/PostHog delivery, APIs, orders and payments are intercepted. A separate
baseline reads current public website assets without modifying production.
This proves client requests/encoding/cookies, not Google's receipt of those
requests. A synthetic paid order never creates an actual order or sale.

## Navigation correction explained before editing

Ordinary anchors work with the exact supplied `url_passthrough` script. However,
`App.tsx` overrides several links/buttons with `history.pushState` using a bare
route, ignoring Google's decorated href. That loses click/linker parameters on
entry to the designer, especially if the visitor then refreshes before accepting.
This was explained to the owner before changing application navigation.

`services/googleClickNavigation.ts` preserves only Google's allowlisted click
and linker parameters for these same-origin public React transitions, without
cookies or local storage. It excludes private source/destination paths and
proof/order/session query references, other query parameters, external hosts,
and malformed/oversized values. Three `App.tsx` pushState sites use it. The
exact head block, purchase helper/frame, Meta service and banner are unchanged.

First real-tag CI38398669068 passed the public live baseline, ordinary-link
passthrough/late acceptance/withdrawal, private documents and compiled purchase
flow. Its navigation test selected an obsolete component and timed out; the
selector was corrected to the real designer link. That is a fixture correction,
not claimed as browser evidence of the navigation defect (the bare pushState
source was the evidence). The subsequent run verifies the actual corrected flow.

Final results are recorded below after CI completes.
