# Google ad clicks reach GA4 as ad clicks — 15 October 2026

## Problem

The owner saw no Google Ads conversion for a genuine £290 sale on 14 October. With read (then Editor) access to the GA4
property (`properties/418296125`, named "tedx-23a04", streams INSTAPLAQUE `G-FKP17EXNBX` and PIM):

- The purchase did reach GA4. Its transaction ID matches the order's digest. It was reported as `google / organic`,
  landing on `/brass-plaques`.
- GA4 has never recorded a page address with a query string since the tag went in (2 October). The bootstrap in
  `index.html` set GA4's `page_location` to a copy keeping only `view` and `utm_*`, so `gclid`, `gbraid`, `wbraid` and
  `gad_source` were removed. A Google ad click therefore read as a visit from google.com: `google / organic`.
- From 12 October GA4 showed about 30 "organic" sessions on the ad landing pages (memorial, brass, bench, garden).
  Search Console, which counts unpaid clicks only, had 2 in 9–14 October, both to `/`.
- The property had no Google Ads link, so no GA4 purchase could become an Ads conversion either way. Linking needs an
  Ads admin and was left with the owner. Cody's Editor access set the property to GBP and Europe/London.

## Change

`index.html` keeps Google's click identifiers in GA4's page address as well: `gclid`, `gbraid`, `wbraid`, `gclsrc`,
`dclid`, `gad_source` and `gad_campaignid`. Everything else is still removed. Private pages still load no analytics,
and the referrer is still reduced to its origin. `scripts/check-google-consent.mjs` asserts the kept IDs and a dropped
private parameter, and fails on the previous bootstrap.

## Release (owner: "Deploy it")

- Source `4c36a4eb5c750e446a26b4e464135e50525a8506` on `codex/instaplaque-ad-click-attribution-20261015`.
- Staged with `vercel deploy --prod --skip-domain`, using project/org IDs from the environment with no link files.
  The remote build's consent check passed on every built page.
- Candidate checks: `/brass-plaques` carries the allow-list and passes the checker, and both health routes return 200.
- Promoted `dpl_HQBYhNJxVhe5mcBrcKCBi7afd4Cp` (`instaplaque-407w4xr8z`) at about 05:20 UTC. Independent canonical
  inspect shows it READY.
- Public `/`, `/design` and the five ad landing pages pass the checker, www redirects 308, and the health routes
  return 200. The app bundle `index-CUCmfLK8.js` is unchanged (HTML-only change).
- Rollback: promote `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7`.

Not verifiable from here: real ad-click receipt in GA4 (the next ad visit should read `google / cpc`), the Ads link
and the import of `purchase` as the primary conversion.
