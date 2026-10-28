# From-prices are each page's cheapest plaque — 28 October 2026

- **Why:** the owner (msg 7009, with a screenshot of the stainless steel page's "from £95.50"): "our from price still
  seems way high always".
  - Each page's hero "from" price was the price of the plaque that "Design online" opens on (owner msg 5906, 24 Oct).
    That is usually an A5. The same pages sell 150 × 50 mm plates for much less, listed further down the page.
  - The brass and stainless finish tiles showed the price of the larger plaque in their photo, e.g. "Brushed brass from
    £246.50" (an A4 on a walnut board). Brushed brass starts at £63.50.
- **Branch:** `codex/instaplaque-from-prices-20261028`, based on the live source
  (`codex/instaplaque-video-tracking-20261028`, a9bc414).

## What changes

| Page | Hero before | Hero now | The note beside it |
| --- | --- | --- | --- |
| Memorial | from £95.50 (A5) | from £58.50 | 150 × 50 mm stainless steel, or A5 for £95.50, … |
| Garden | from £95.50 (A5) | from £58.50 | same as memorial |
| Stainless steel | from £95.50 (A5) | from £58.50 | same as memorial |
| Brass | from £105.50 (A5) | from £63.50 | 150 × 50 mm brushed brass, or A5 for £105.50, … |
| Tree | from £190 (A5 on board and stake) | from £187.50 | 200 × 150 mm … on an oak board and black steel ground stake, or A5 for £190, … |
| Opening | from £145 (A4) | from £95.50 | A5 stainless steel, or A4, the usual size for an opening, for £145, … |
| Bench, custom | £58.50, £109 | unchanged | unchanged |

- **"Design online" still opens where it did**: A5 on the memorial, garden, stainless, brass and tree pages, and A4 on
  the opening page. A 150 × 50 mm plate is too small for most memorial wording, and the hero film shows an A5-sized
  layout. The note now names that plaque's price as well, so the designer's price is no surprise (the msg 5906 concern).
- **Finish tiles** on the brass page (brushed, polished, orbital, aged) and the stainless page (brushed, polished, on light
  oak, on dark wood) now show their finish's cheapest plaque and lead to it: brass £63.50 / £63.50 / £63.50 / £69.50,
  stainless £58.50 / £63.50 / £152.50 / £152.50. The photos still show each finish on a larger plaque.
- **Homepage tiles** ("What's your plaque for?" on phones and the collection cards on computers) show each page's own
  from-price: memorial and garden £58.50, opening £95.50.
- **Memorial FAQ** "How much does a memorial plaque cost?": from £58.50 for a 150 × 50 mm plate, A5 £95.50. This also
  goes into its FAQPage schema.
- Unchanged: the price tables, product pages, the designer, checkout, the Merchant feed and every actual price.

## Code

- `services/commerce.ts`:
  - The memorial, stainless and brass families' `startingFrom` is now the 150 × 50 mm plate's price. The `preset`
    (where "Design online" opens) is unchanged.
  - `SeoLandingPage.from` (new) is the plaque a landing page's from-price is for, where it's smaller than the designer
    preset: tree 200 × 150 mm (priced on the board and stake) and opening A5.
  - `landingDesignProduct` prices `from` when set.
- `components/CategoryPages.tsx`: the hero notes, and `cheapestIn` / `finishRoute` for the finish tiles.
- `components/Shopfront.tsx`: the homepage tiles take a landing page's price from `landingDesignProduct`, not from its
  related product.
- `scripts/prerender-product-pages.mjs`: the static fallback's category prices (memorial 58.5, brass 63.5,
  stainless 58.5).

## Check

`scripts/check-from-prices.mjs` (new; in `postbuild` and `npm run check:from-prices`) reads the built pages, or saved
ones (`DIST=`), or a site (`BASE=`). It checks that:

- each category page's hero price is the lowest in its own price table, in the page's metal (brass on the brass page,
  stainless steel elsewhere);
- every tile shows the price of the page it leads to: a category page's hero, or a plaque's own price;
- the brass and stainless finish tiles lead to their finish's cheapest plaque, on the same backing.

Against the live site before this change it reports 13 failures: 6 heroes and 7 finish tiles.

## Google Ads (not changed by this release)

Each search ad's pinned "From £" headline quotes its landing page's hero price (scripts/pin-prices-20261026.py in
projects/instaplaque-google-ads-memorial-20261009). Once this is live, the memorial, garden and stainless ads can say
£58.50, brass £63.50 and tree £187.50. Each edit goes back to Google's review. That needs the owner's go.

## Checks and candidate

- CI (draft PR #22, base: the live source): the typecheck passes. CI then stops at `check:google-purchase` ("Public pages
  retain one loader"), which fails the same way on the live source and isn't touched here.
- Vercel's build passed every postbuild check, including the new one (RESULT PASS).
- **Candidate (not live):** built with `vercel deploy --prod --skip-domain` from 41e495a:
  https://instaplaque-3ao2t833a-dullaghan31-3959s-projects.vercel.app (dpl_3Kf1w2qQ6q6WCopG4nokYR28zfaV, `index-urC02j3R.js`).
  - The pages fetched through `vercel curl` pass `DIST=<them> node scripts/check-from-prices.mjs` (8 heroes, 8 finish
    tiles and every other tile).
  - The hero lines and the memorial FAQ read as in the table above.
  - instaplaque.co.uk is still dpl_QCbB8CX9ekQjg63py3Za3i6goQsG (`vercel inspect`).
  - Not run: a local build or browser check. The account was at 3.8 GiB, over the 3 GiB limit for heavy jobs.
- **To go live (on the owner's go):**
  1. Check production is still dpl_QCbB8CX9ekQjg63py3Za3i6goQsG.
  2. Run `vercel promote https://instaplaque-3ao2t833a-dullaghan31-3959s-projects.vercel.app --yes --scope
     dullaghan31-3959s-projects`.
  3. Run `BASE=https://instaplaque.co.uk node scripts/check-from-prices.mjs` and `verify_live.py` with
     `BUNDLE=index-urC02j3R.js`.
  4. Ads: in projects/instaplaque-google-ads-memorial-20261009, run
     `python3 -I scripts/lower-from-prices-20261028.py validate`, then `apply`. It changes five pinned headlines:
     memorial, garden and stainless "From £58.50", brass "From £63.50", tree "From £187.50".
  - Rollback: promote dpl_QCbB8CX9ekQjg63py3Za3i6goQsG (instaplaque-gz1ge8cbh), then run the ads script's `undo` if
    the ads were changed.

## LIVE — 28 October 2026, 11:00 UTC (owner msg 7015, "go")

- Pre-flight: production was still dpl_QCbB8CX9ekQjg63py3Za3i6goQsG, and no newer deployment or branch existed.
- Promoted instaplaque-3ao2t833a at 11:00:02 UTC (`vercel promote`, 3 s). instaplaque.co.uk and www point to
  dpl_3Kf1w2qQ6q6WCopG4nokYR28zfaV (`vercel inspect`); the homepage serves `index-urC02j3R.js`.
- `BASE=https://instaplaque.co.uk node scripts/check-from-prices.mjs`: RESULT PASS, 45 checks, 0 failures. The same
  check found 13 failures on the previous release.
- `verify_live.py` (`BUNDLE=index-urC02j3R.js`): RESULT PASS. It covers 175 product pages, 633 assets identical to
  `public/`, both sitemaps (25 and 175 URLs) and the feed (175 items).
- No browser check: the account was at 3.8 GiB, over the 3 GiB limit for starting a browser job.
- **Google Ads, applied 11:00:31 UTC** (`scripts/lower-from-prices-20261028.py` in
  projects/instaplaque-google-ads-memorial-20261009, commit d330158):
  - It first confirmed that each landing page shows the new price, then sent a validateOnly request, then all five
    changes in one request.
  - Pinned headlines changed: memorial, garden and stainless "From £58.50", brass "From £63.50", tree "From £187.50".
    Each stays pinned to position 2.
  - The read-back matched. Google's status shows all five as approved.
  - Unchanged: bench (£58.50), graves (£63.50, as in its description) and the two portrait ads (£95.50).
  - The previous headlines are saved in output/instaplaque-ads-plan-20261025/lower-from-prices-20261028-state.json.
- **Rollback:**
  1. Promote dpl_QCbB8CX9ekQjg63py3Za3i6goQsG (instaplaque-gz1ge8cbh).
  2. Run `python3 -I scripts/lower-from-prices-20261028.py undo`, so the ads don't quote prices the pages no longer
     show.
- **Small follow-up for the next release:** `public/sitemap.xml` still gives `/tree-memorial-plaques` a lastmod of
  2026-10-24, although its from-price changed in this release. Set it to 2026-10-28 with the next site change. The
  other changed pages already say 2026-10-28.
