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

## Verified release

Application source `f7dcff058c885b3566e71b9e6b805f0f2bb6ebd6` passed
[CI38389208807](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38389208807).
Draft source review:
https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/16

- Full TypeScript and production build/runtime checks.
- 360 physical Offer occurrences across181 generated pages; all three missing
  policy fields, correct UK rate/country/currency, weekdays, production/transit
  separation, exact per-variant estimates and unchanged prices.
- 175 unique purchasable catalogue entries and175 feed items match generated
  page prices/images/production estimates.
- 11 hydrated product/catalogue routes plus returns, delivery and designer;
  initial/client policy and numeric-price equality, no browser errors or writes.
- Existing320/390/820/1440-width, short-landscape and no-JavaScript designer
  checks preserve the fixed workbench, popup, focus, wording and saved-link state.
- Initial CI38388935396 exposed a test-format issue: equivalent prices95.5 and
  95.50 were compared as strings. Fixed the check to compare numeric GBP amounts;
  no price change or assertion removal, then the complete suite passed.

Production candidate `dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b` at
https://instaplaque-o8s9f1cn5-dullaghan31-3959s-projects.vercel.app passed the
Vercel build and static checks. API metadata confirmed exact project and source.
Protected HTTP checks passed before promotion; canonical live predecessor was
independently rechecked immediately before switching the public site.

Promotion succeeded. At **2026-10-13T11:23:30.007Z**,22 public URLs matched
candidate bytes: home catalogue, all five family pages, representatives of every
production-time class plus the legacy15-day brass product, returns, delivery,
designer, feed, JS/CSS, robots, sitemap and read-only backend health/config.
www designer redirects to canonical and matches its bytes. A separate Vercel
canonical inspection confirms the exact READY deployment above.

Artifacts matching exact-source CI:

| Artifact | SHA256 |
| --- | --- |
| index-CpAc9MaU.js | 8dfd205559f492674f869443981d60c419b3c012a848c565ac31424253d188e2 |
| index-Bxw_YNF_.css (unchanged) | 76411f18b7354142b26195d3b7dd0ec571a237c47ea08448cb100acf966e9627 |
| Merchant feed (unchanged) | dc277bf51d216e1edea5ae2d239dc2944af3bc4d055e71e2f8e76d65434d8d6f |

Returns and designer visible bodies match the predecessor exactly after excluding
script elements. No new hosted browser was run: the shared account stayed above
3GiB, so browser evidence is from exact-source CI, backed by hosted identity and
artifact checks. No local heavy build/install, resource-limit changes, customer
actions, Merchant account writes, Ads/payment/DB/PIM/tracking changes or indexing
submission. Evidence is ignored in `output/product-policies-release/`; no tokens
were persisted. Git deployment and existing CI workflow remain unchanged.

### Rollback and Search Console

For a code-only rollback, promote the previous accepted FAQ-popup deployment:

```sh
vercel promote https://instaplaque-o99inec90-dullaghan31-3959s-projects.vercel.app --scope dullaghan31-3959s-projects --timeout 3m --yes
```

That restores `dpl_6o1LFnmir5w6VjKZdgqt5bRAotAu` and missing product-policy
metadata, retaining the requested no-extra-scroll designer. No database rollback
is necessary. Recheck canonical identity after any rollback.

The live missing-field correction is proven; Google warning counts are **not**
proven cleared. Owner can now open each warning and click **Validate fix**.
Search Console will update after Google's validation/recrawl, not immediately.

References:
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/return-policy
