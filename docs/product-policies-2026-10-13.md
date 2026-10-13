# Shipping and returns structured data — 13 October 2026

Owner message4516 requests correction of Search Console's yellow warnings:
missing return policies186, shipping details182, delivery time4. Counts overlap
and are Google's last-crawled structured-data items, not failed orders.
This continues the owner-approved live SEO correction; retain the accepted
fixed designer/FAQ popup. No Merchant account or actual business-policy change.

## Source and authority

- Branch `codex/instaplaque-product-policies-20261013`, existing task checkout
  `projects/instaplaque-design-seo-20261013` (no active service uses it).
- Base `7bd601f4210adcfa9a16d8b506310580a014275a`; deployed application588afdb
  independently verified at `dpl_6o1LFnmir5w6VjKZdgqt5bRAotAu` before editing.
- Live Merchant account5859684800 read at11:07UTC using Cody's own keyless
  identity: free GB shipping, production/handling5–15 weekdays, transit1 weekday,
  Monday–Friday handling/transit, existing14:00Europe/London cutoff.
- Return policy9335430350: NO_RETURNS, GB, existing public returns URL,
  processRefundDays2, no exchanges. No physical return is required for defective
  plaques; public wording retains statutory remedies and photo-based assessment.
- Exact variants retain catalogue production estimates5/7/10/15, including the
  existing legacy polished-brass200x100 offer's15 days. No prices/presets changed.

## Change

One shared module supplies shipping and returns for every physical Product Offer
in initial HTML and client-generated data, including the homepage's catalogue.
Generic families retain the5–15 handling range; variants use their exact
advertised production time. Separate1-day transit avoids advertising plaques as
made/delivered in a day. Weekdays, GB/GBP and zero shipping price are explicit.
The standard return policy is also attached to Organization on the existing
returns page; Offer data is self-contained, with a link to that full policy.
No invented return window, new return fee or lost faulty-goods protection.

The existing delivery guide now states the already-approved next-working-day
carrier service as an estimate, not an arrival guarantee. No designer layout,
FAQ popup, checkout, tracking, pricing, production logic or feed changes.
The free WebApplication Offer deliberately has no physical shipping/returns.

## Verification/release status

Syntax and whitespace checks pass. Full typecheck/build/catalogue/feed/HTML and
intercepted browser checks are being run on the unchanged GitHub CI workflow.
VPS account remains above3GiB, so no local heavy build/browser/install is started.
Static checks cover every generated HTML file, not just the19-URL sitemap;
browser checks compare initial/client policies and advertised prices across
all production-time classes, homepage, category pages and policy pages.
Existing five-viewport/no-JavaScript designer regression remains enabled.

No production change yet at this checkpoint. Record final CI, deployment,
canonical identity and hosted verification below before claiming completion.
Rollback target is the existing accepted popup deployment above.
Search Console counts cannot be declared cleared until Google recrawls; owner
can use Validate fix after the corrected website has been verified live.

References:
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
