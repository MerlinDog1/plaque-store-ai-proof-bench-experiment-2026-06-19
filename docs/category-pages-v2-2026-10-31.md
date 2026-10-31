# Category pages v2 — 31 October 2026

**PREVIEW ONLY.** Based on the live source `ec24ba10d3582402fcd1b1f0b00553c83680775d`,
branch `codex/instaplaque-category-pages-v2-20261031`. No production deployment, domain change,
feed change, ad change, customer message or database write.

This implements the owner's category row review (msg 8182), authorised as a preview in the
parallel-task batch. The review and original 390 × 844 captures are in workspace
`output/instaplaque-category-review-20261031/`.

## What changed

1. **Photo first:** the seven film-led pages now open with their existing checked in-place
   plaque photograph. The redundant second photo row is gone. Tree and portrait hero markup
   is unchanged. The film remains accessible through its watch-page link in the compact
   ordering section, rather than another tall embedded row.
2. **Made to order:** the short line appears in the seven revised heroes, and immediately
   after the unchanged tree/portrait heroes. All nine reuse `CustomAnything showcase` and its
   existing nine pictures plus WhatsApp ask card. A compact option omits the duplicated
   three-step explainer; catalogue product pages keep their existing full band.
3. **Photo tiles:** all 28 popular-product cards use approved studio photos. Brass and steel
   gain four photo size cards each. Cards lead with size, then finish/backing and exact price;
   phones can swipe the complete row (including all eight bench choices). Thin-strip products
   without approved studio photos remain linked from the size tables/folds, rather than using
   an unapproved image. Finish/shape route tiles use studio photos too; setting tiles keep the
   location pictures that explain bench, stone, fence and grave fixing.
4. **One proof/making section:** eight shared category layouts replace ordering, quality and
   general proof rows with one compact section and the representative plaque's own PDF pages
   via `samplePdfFor` / `sampleProofPageFor`. No new PDFs or artwork were generated. Tree uses
   the A5 brass/oak-board sample and explicitly says the customer's tree proof also includes
   the stake; the sample itself is not presented as a stake proof. The portrait page has its
   own photo-to-engraving process, not those three duplicate rows, so it keeps that process.
5. **Real starting prices:** setting/shape choices resolve the cheapest matching catalogue
   offer in `services/categoryTileOffers.mjs`, with no copied prices. Oval, circle, large,
   grave nameplate and stone/fence routes lead to that offer. Separate pictured-product links
   preserve the previous finish choices. `check-from-prices.mjs` now checks these group minima
   (not merely equality with the linked product), the portrait route, and every product card.

## Making the pages shorter

- Brass/steel photo cards are followed by a folded full price comparison, retaining all sizes,
  prices and product links in the HTML.
- Memorial/tree portrait examples are optional folds: the made-to-order band already includes
  portrait pictures. The portrait-category link remains visible.
- The portrait page's seven-photo gallery swipes on phones; its complete sizing/display and
  choosing-a-photo guidance is folded, not deleted. Its real Millie hero is untouched.
- Section spacing is reduced; FAQs, wording ideas, buying advice and their internal links stay.
- No reviews were added.

## Checks and reproducibility

Run `npm run typecheck`, `npm run build` (including every postbuild check), then a local server:

```sh
PORT=4381 HOST=127.0.0.1 REVIEW_FOLLOWUP_CHECK_INTERVAL_MS=0 cody-job -- node server.mjs
OUT=/home/coding-agent/workspace/output/instaplaque-category-pages-v2-20261031/shots \
  cody-job -- node scripts/check-category-pages-browser.cjs
```

The browser check is local-only. It blocks external requests, marks the browser internal,
checks all images (including horizontal lazy-loaded cards), PDF links, swipe rows, guidance
folds, no page overflow and no JS errors, then saves phone/desktop first screens and full pages.
It preserves the cookie notice in `screen00.png`; `clean.png` and full-page captures hide it
only for inspection, without submitting consent.

Measurements use the review's method: `main.scrollHeight / (viewport height - mainTop)`.
SEO comparison against an unchanged baseline is in workspace
`output/instaplaque-category-pages-v2-20261031/check-preserved-seo.mjs` and `seo-and-links.json`.
Titles, descriptions, H1s, canonicals and non-ItemList structured data are unchanged.
ItemList continues to be generated from the actual product links, so the requested new cards
and corrected destinations update its membership/order. Every prior internal link remains,
except the general proof PDF, replaced by the category example's PDF. Merchant feed is
byte-identical to the baseline.

## Preview and final measurements

| Page | Before px | After px | Phone screens before → after | Shorter |
| --- | ---: | ---: | ---: | ---: |
| memorial-plaques | 8771 | 6928 | 12.0 → 9.5 | 21.0% |
| bench-plaques | 7434 | 5951 | 10.1 → 8.1 | 19.9% |
| garden-plaques | 8134 | 6748 | 11.1 → 9.2 | 17.0% |
| tree-memorial-plaques | 7218 | 6222 | 9.8 → 8.5 | 13.8% |
| opening-plaques | 7436 | 6046 | 10.1 → 8.2 | 18.7% |
| brass-plaques | 6942 | 5904 | 9.5 → 8.1 | 15.0% |
| stainless-steel-plaques | 7086 | 6033 | 9.7 → 8.2 | 14.9% |
| portrait-plaques | 7435 | 5695 | 10.1 → 7.8 | 23.4% |
| custom-plaques | 6883 | 5825 | 9.4 → 7.9 | 15.4% |

Measured at 390 × 844, with a 733 px main viewport, same as the review. All nine pages are 13.8–23.4% shorter.

Local checks: typecheck and full build/postbuild PASS. All 18 phone/desktop visual checks PASS (including images, swipes, PDFs, folds and no horizontal overflow). The old oval pictured-price regression was deliberately reproduced in an external fixture and is rejected by the extended check.

Screenshots and measurements: workspace `output/instaplaque-category-pages-v2-20261031/` (`shots/`, `first-screens-phone.jpg`, `screen-counts.md`, `screen-counts.json`). Local build logs are in workspace `tmp/category-pages-{typecheck,build,browser-final}.log`.

Preview deployment: pending the serialised preview-only deploy.

