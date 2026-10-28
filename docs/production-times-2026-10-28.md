# Production times by size, and fixings in the order emails (28 October 2026)

## Live

- Promoted at 06:48 UTC on 28 Oct, as the owner instructed (msg 6947): instaplaque-qxw1hjk89
  (dpl_2tbktHyiKAX62KXH3DZ9AGxZ2fse, `index-DEaUd31m.js`). Both domains checked with `vercel inspect`.
- Live checks:
  - `verify_live.py` with `BUNDLE=index-DEaUd31m.js` passed: 175 product pages, 633 linked assets identical to `public/`,
    the feed and the sitemaps.
  - The live feed against the 25 Oct copy: the same 175 ids; 25 handling times changed (15→10: 12, 15→5: 11, 15→7: 2);
    no price or title changed; the 24 changed descriptions all go with a days change.
  - Product pages: the stainless 250 × 150 oval and 200 × 200 circle say 5 working days; the 200 × 150 on dark wood
    says 10. `/design` and `/terms` serve the new bundle, and the terms say "28 October 2026".
  - The browser check didn't run on the live site: the account was at 3.9 GiB, over the 3 GiB rule for heavy jobs.
    Instead, the live `Controls-B9KPpPX9.js` matches the locally tested `Controls-CFTQ4jyP.js` byte for byte once
    chunk names are normalised, and the live main bundle carries the new rule's notes.
- Rollback: `vercel promote https://instaplaque-b8vdvugof-dullaghan31-3959s-projects.vercel.app --yes --scope
  dullaghan31-3959s-projects`, with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` set. That is the designer wording release,
  dpl_F6osRRkzwag6cRMa3FooGwL1r9XQ.
- Orders already paid keep the days saved at checkout. The 100 × 50 order above stays due 17 Nov; the owner will send it
  out earlier.

## Why

A £59 order for a brushed brass 100 × 50 mm plaque (paid 27 Oct, 23:12 UTC) was due 15 working days later, on 17 Nov,
because every size off the standard list counted as "custom" and got 15 days. The owner (Telegram msg 6947): "Add fixings
line. If shape fits in 600x400mm regardless of shape it's 5 days, if aged it's 7. If wood Say 10 days for A4 and below
15 days above that. I they don't stack so most is 15 days yeah". The fixings line answers the owner's question about
that order ("They wanted any fixings?"): the paid-order email listed size, material and wood, but not fixings.

## The rule (services/productionTime.mjs, the one source)

Working days from proof approval and payment; the longest that applies, never added together, so 15 at most:

| Plaque | Days |
| --- | --- |
| Any shape that fits within 600 × 400 mm, either way round | 5 |
| Aged brass | 7 |
| Wood backing up to A4 (fits within 297 × 210 mm, either way round) | 10 |
| Wood backing above A4 | 15 |
| Larger than 600 × 400 mm | 15 |

"A4 and below" is read strictly as fitting within 297 × 210 mm, so a 300 × 200 mm plaque on wood (3 mm longer than A4)
is 15. Before this change: 11 standard sizes 5 (aged 7); wood 10 only for exactly A5 or A4, else 15; every other size or
shape (ovals, circles, hearts, 100 × 50, A3…) 15.

## What changed

- `services/productionTime.mjs`: the rule above. Used by the designer, checkout (saved on each order as
  `metadata.turnaroundWorkingDays`), the Stripe delivery estimate (days + 1), Google Customer Reviews' delivery date
  and, now, the catalogue and the email fallback. Existing orders keep the days saved when they were paid.
- `services/merchantCatalogue.mjs`: each offer's `productionDays` comes from the same rule (was its own formula, plus a
  hard-coded 15 for the legacy polished brass 200 × 100 offer). 25 of 175 offers change: 200 × 150 on wood 15 → 10 (12),
  ovals and circles 15 → 5 (10) or 7 in aged brass (2), legacy 200 × 100 15 → 5. Product pages, their schema handling
  times and the Merchant Center feed (`google-merchant-feed.xml`) follow; feed handling days now 5: 76, 7: 15, 10: 60,
  15: 24.
- `components/Controls.tsx`: the custom-size step's "Custom turnaround" note shows whenever the estimate is over 5 days
  (it showed for any wood-backed or over-600 × 400 custom size); the old 600 × 400 helper is gone.
- `server/email.mjs`: a "Fixings" line in both internal emails (new paid order, production pack), between Material and
  Wood: "Hidden adhesive (VHB tape), no holes", "No fixings, no holes", "Domed cross-head screws, 2 holes (one at each
  end)", "Decorative caps, Ø15 mm, 4 holes (one in each corner)"… The hole count follows `services/fixingGeometry.ts`
  (what the proof and production artwork draw). The due-date fallback for orders without saved days uses the rule.
- Copy: the "Production & delivery" timing list (`components/ShopGuides.tsx`), the product FAQ answer and qualification
  (`services/shopInformation.ts`, shown on 14 built pages), the terms' production line (terms "Last updated" now 28
  October 2026) and the older FAQ answers in `components/SiteExperience.tsx` / `scripts/prerender-product-pages.mjs`
  (not in the current build, kept consistent).

## Checks

- `scripts/check-production-time.mjs` (new, no network): 23 rule cases including the "don't add together" ones; every
  catalogue offer uses the rule; the Fixings line in both emails (HTML and text) for 12 fixings, each hole count equal to
  `getFixingPositions` from the TypeScript source; the fallback due date.
- `scripts/check-custom-size-turnaround.mjs` (new, browser, local build): custom 100 × 50 and 400 × 600 show 5 working
  days with no note; 600 × 500 shows 15 and the note; 390 and 1440 px.
- `scripts/check-audit-checkout.mjs` updated (circle, oval and 200 × 100 now 5; 600 × 500 and 400 × 300 on wood 15).
- Pass: scoped `tsc`, `npm run build` with every postbuild check (product policies, catalogue, feed vs pages),
  `check-audit-checkout`, `check-server-checkout`, `check-google-customer-reviews`, `check-posthog-analytics`,
  `check-layout-progress`. `check-pricing.cjs` can't run on the VPS (it launches Playwright's own Chromium, which isn't
  installed); pricing is unchanged. `check-r2-artwork.mjs` writes to production storage and was not run.
