# Meta pixel: InstaPlaque's own dataset and a private Purchase event — 28 October 2026

## Why

The owner (msgs 7126, 7132) asked whether conversion tracking was set up for the new Facebook/Instagram ads. It
wasn't: the site's pixel (2766586460430567) belonged to a business portfolio that InstaPlaque's ads can't use, and it
reported only page views and checkout starts.

## What changed

- **New dataset:** `4216755011787795` ("InstaPlaque website"), created through the Marketing API inside the INSTAPLAQUE
  ad account (act_1592209308791719, owned by LASER2ETCH.COM and shared with instaplaque.co.uk). It is connected to
  that account. The old pixel stays on PIM's landing page; this site no longer uses it.
- `services/metaPixel.ts`: `META_PIXEL_ID` is the new dataset. Page views and checkout starts are unchanged.
- **Purchase:** `services/metaPurchase.ts` + `public/meta-purchase.html` / `meta-purchase.js`, built the same way as
  the Google purchase frame:
  - only on `/order-confirmed` for a paid live Stripe order in GBP, with advertising consent, never in the owner's own
    browsers (`?internal=on`), never for test, live-verification or no-fulfilment orders;
  - the private order page still never loads the pixel. A same-origin, event-only frame sends one `Purchase` with
    the value, `GBP` and an event ID that is a SHA-256 digest of the order ID;
  - Meta receives the site's origin as the page, not the order URL, order ID, Stripe session or customer data;
  - one report per order (in-memory, `localStorage` and Meta's event-ID dedupe).
- `components/SiteExperience.tsx`: called next to the Google and PostHog purchase tracking. The cookie details now say
  the pixel measures paid orders too.
- `vercel.json`: noindex, no-referrer and no-store headers for the frame, as for `/google-purchase.html`.
- `public/sitemap.xml`: the tree page's lastmod is 2026-10-28 (its from-price changed at 11:00).

## Checks

- `scripts/check-meta-purchase.cjs` (new) and `scripts/check-meta-pixel.cjs` (new pixel ID) run in postbuild; both
  pass locally and in Vercel's build.
- CI (draft PR #23, base: the live source): the typecheck passes; CI then stops at `check:google-purchase` ("Public
  pages retain one loader"), the same failure as on the live source.
- Live browser checks (Chrome; requests to facebook.com/tr are blocked in the browser, so nothing reached Meta):
  - `node scripts/check-meta-pixel-live.mjs`: the ad's landing URL sends PageView to 4216755011787795 only;
  - `node scripts/check-meta-purchase-live.mjs`: on an order-style page the frame sends exactly one Purchase (value,
    GBP, event ID), from the frame, with the page reported as the origin only and nothing from the order URL.
  - The pixel sends nothing for a `HeadlessChrome` user agent, so both checks present as ordinary Chrome.
- `BASE=https://instaplaque.co.uk node scripts/check-from-prices.mjs`: PASS. `verify_live.py`
  (`BUNDLE=index-N6efz1TY.js`): PASS.

## Live

- Promoted dpl_BqgnQ2WuCgQUn6YEVTjuoufxcQp9 (instaplaque-8a1hhfvyy, `index-N6efz1TY.js`) at about 15:20 UTC on
  28 October, on the owner's OK (msg 7132). instaplaque.co.uk serves it; www redirects there.
- The ad (120248883919230686) now tracks the dataset (`tracking_specs` offsite_conversion), and its ad set
  (120248883916170686) optimises for landing page views instead of link clicks.
- **Rollback:** promote dpl_3Kf1w2qQ6q6WCopG4nokYR28zfaV (the from-prices release). That brings back the old pixel
  ID; switch the ad set back to `LINK_CLICKS` too.

## Note

This checkout had no `.vercel` link, so a first `vercel deploy --yes` created a separate, unused Vercel project
called `instaplaque-contact-followups` (one deployment, no domain). The release was then built from the real
`instaplaque` project, using projects/instaplaque/.vercel/project.json. Link the checkout before deploying.
