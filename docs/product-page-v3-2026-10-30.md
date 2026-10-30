# Product pages v3: photo first, "we make anything", photo rows (30 October 2026)

**Status:** preview only. Nothing here is live until the owner says so.

## Why

The owner (msg 8065), after a row-by-row review of the 175 catalogue pages:

- "random sizes will show for random searched" (Google Shopping picks the product);
- "Do we make it clear enough on a product page that you can have whatever you want?";
- "show a row more plaques in this finish. Another row different finishes in that same size";
- "Do the text examples add much";
- "Probably gonna have to have the video on all these pages";
- "How we go let someone know in first few seconds of visit have you in the right place?"

Evidence at the time (PostHog, consented visitors, 25-30 Oct): 13 Google ad visits landed on a product page, 10 on
phones; 9 did nothing after arriving; every contact tap came from the hero or the bottom bar; 2 of the 13 ordered.

## What changed

`services/productLayout.ts` switches the 29 Oct layout on for every catalogue page (`NEW_PRODUCT_LAYOUT_EVERYWHERE`),
and that layout now has, top to bottom:

1. **Phones: the photo first** (gallery: studio photo, flat drawing, finish close-up, wood close-up), then the kicker,
   title and **"Any size, finish or wording. We'll make it, and you see a free proof before you pay."** in place of the
   old one-line pitch (the owner crossed out "A wood-backed plaque for presentations, retirements…"). Price and the two
   buttons follow; on a phone they are on the first screen once the cookie notice is answered.
2. The film ("Type your words. Our AI does the layout.") with its buttons, as on the 29 Oct test page.
3. **Photo rows** (`ProductPhotoRows`, data from `catalogueRowsFor` in `CatalogueDetails.tsx`): "More sizes in
   <finish>[ on dark/light wood]" and "<size> in other finishes" (other finishes in the same backing, then the other
   backings). Studio photo where there is one, otherwise the in-place photo or the flat drawing. Phones swipe
   sideways (about 2.4 cards in view); computers wrap.
4. "Tell us what you want. We'll make it." (moved up from near the bottom).
5. Portrait row (A5 and larger only, unchanged).
6. "What you get." with the sample proof PDF in sight and everything else in one fold (finish note, size tip,
   specification table).
7. FAQ (unchanged), closing buttons.

Removed from catalogue pages: the text-only wording example cards, the text price lists (the photo rows link the same
pages) and "A little help choosing" (the footer links the same guides).

**Design button fix.** Catalogue pages' Design online links are `/design?plaque=<slug>` (`designHrefFor`), and
`App.tsx` opens the designer on that plaque, then drops the parameter. Before, a tap before the page's script loaded
went to plain `/design` and opened the default A5 plaque (£95.50) instead of the product. The in-app click is unchanged.
The film/hero glow CSS matches `a[href^="/design"]`.

**Cookie notice.** One sentence instead of three, so on a phone it is 129 px tall instead of 224 px: "Cookies: may we
use optional analytics cookies, which record how pages and the designer are used (typing hidden), and ad cookies?
Details and settings". It still names the recordings, so analytics consent given here still covers them
(`REPLAY_CONSENT_KEY`). Accept/Reject unchanged.

## Checks

- `tsc --noEmit -p tsconfig.check.json` passes.
- `npm run build` and all postbuild checks pass. `check-product-policies.mjs` now accepts the photo rows as the
  variant links.
- Phone and desktop screenshots of the local build (brushed stainless 200 × 150 dark wood, aged brass 150 × 65 bench):
  workspace `output/instaplaque-page-review-20261030/out-v3/`.
- `/design?plaque=<slug>` opens the right plaque, price and size for 3 products; plain `/design` still opens A5 £95.50
  (`output/instaplaque-page-review-20261030/check_design_param.cjs`).
- `scripts/check-merchant-browser.cjs` on all 175 pages against the local build: see the release notes.

## Known

- The film's end card says "Made in 5 working days*"; its footnote gives aged brass 7 and wood-backed 10–15 working
  days. Now that the film is on every page, the 99 pages that take longer than 5 days show it too.
- On a first visit the cookie notice still covers the price and buttons on a phone (the photo, title and the new line
  are above it).
