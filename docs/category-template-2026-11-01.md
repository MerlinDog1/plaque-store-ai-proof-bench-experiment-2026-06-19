# "Products first" category template, stage 1: /memorial-plaques and /bench-plaques — 1 November 2026

**PREVIEW ONLY. Not merged into the live source, not live.** Owner msg 8384 (1 Nov 2026): "low key hate all of them
[the AI in-place photos], stick with studio shots… the layouts and contents all suck for what they are. You need to
research and find stuff to copy." The research is in workspace `output/instaplaque-competitor-research-20261101/`
(`ux/`, `memorial/`, `metal-business/`, `occasion/` REPORT.md; the specs used here are `ux` section c and `memorial`
section c). Later stages (garden, tree, brass, stainless, opening, donor, church, house name, practices) follow as
separate requests.

- **Branch:** `codex/instaplaque-category-template-20261101`, from `df652c9` on
  `codex/instaplaque-combined-preview-20261031` (the combined preview code `cf000e5` plus docs, AI photos reverted).
- **Code commit:** `195692e14b6931565a882143d4bf39d4da22fe28`.
- **Preview:** https://instaplaque-a5pwj5nd6-dullaghan31-3959s-projects.vercel.app (`dpl_AoKmAAKg68MHjGF9Zfm1YsG6oXPC`,
  target **preview**, **Ready**, built from `195692e`). Vercel login applies; Preview environment variables, so don't
  take orders on it. Pages: `/memorial-plaques`, `/bench-plaques`.
- **Production unchanged:** `instaplaque.co.uk` is still `dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8` before and after the deploy.

## What changed

The two pages now use one shared template (`components/CategoryTemplate.tsx`); each page is a config in
`components/CategoryTemplatePages.tsx`, so the later pages are mostly config. `ShopProduct` (Shopfront.tsx) renders the
template for the slugs listed there, before the older `CategoryLandingPage`. Phone order (390 × 844):

1. **Title block** (≈160 px): breadcrumb, the unchanged H1, a two-line intro (the memorial intro links bench, garden and
   tree), one facts line: *From £58.50 · engraving, fixings and UK delivery included · free PDF proof before you pay ·
   made in the UK in 5 working days after you approve (aged brass 7, wood-backed 10–15)*. The days come from the
   catalogue's production days for the plaques on the page. No video, hero photo or buttons here.
2. **Sticky chip row with a count** ("78 plaques"): memorial *All · Brass · Stainless steel · Small · Medium · Large ·
   On a wood board*; bench *All · Stainless steel · Brass · Aged brass*. Finish chips show every card in that metal from
   its own from-price; size/board chips narrow the grid. Links may preselect a chip with `?finish=`, `?size=` or
   `?board=yes` (for ad groups such as "brass bench plaque").
3. **Grid of studio photos, one card per size** (memorial 10, bench 6 = every bench size sold): photo, size in mm, what
   fits, real-metal swatches (and light oak / dark walnut on wood-backed cards) that swap the photo, the price and the
   link, then the from-price. The whole card opens the plaque in the chosen finish. A label on the photo names the
   pictured finish, so a from-price beside it is never read as that finish's price. Leads mix brass, steel and wood
   (owner msg 5927), all with memorial wording. The first card starts at 317 px on a phone, with or without the cookie
   notice.
4. **The page's six questions, right after the grid** (accordion; FAQPage schema = the same list).
5. **Sizes drawn to scale** beside a house brick (memorial) or a bank card (bench), each linking to its cheapest plaque
   at that price; the size × metal price table and (bench) every bench size and finish folded under "Compare all sizes
   and prices".
6. **Free proof before you pay**: three steps, the page's own sample proof PDF, Design online and WhatsApp, the design
   form and the film's watch page as links.
7. **The finishes, side by side**: the six metals (plus the two woods on memorial) as close-ups cropped from the
   materials page's finish photographs, with the materials page's own words.
8. **Three wording ideas** and the link to the full wording page (`#memorial-wording` kept).
9. **"More about …"** fold with the page's existing guide text (sizes, measuring, permission, settings) and the
   existing contextual links (incl. `/church-plaques`), then a **closing strip** (Not sure which size? WhatsApp a photo;
   Design online; one portrait link). The phone Design/WhatsApp/Email bar shows from the start (the template has no
   hero buttons for it to wait for).

Removed from these two pages: the hero film, the "Shown:" photo, the "Where will it go?" photo tiles (now intro links),
the four "picks", the made-to-order picture band, the portrait block (one link) and the solid-metal block (one line in
the finishes row). Titles, meta descriptions, H1s and canonicals are unchanged (we are 5th on Google for "memorial
bench plaques" with the bench page; research memorial (e) item 10). The sitemap is unchanged.

**Prices** all come from the catalogue (`merchantOffers`, priced by `estimatePlaquePrice`). `resolveCard` fails the
build if a card's lead photo is not a studio photo, or if a finish left off a card for want of a picture would be
cheaper than the card's from-price. Finishes without a studio photo (seven thin strips) show their flat design view,
labelled "design view"; the A5 brushed steel and 200 × 100 brass bench plate have only in-place photos, so they are
not cards (A5 appears as A5 upright, and both stay linked from the size strip / folded lists).

**Copy:** the bench page gains three questions (fixings, permission for a park or council bench, how long), built
from the catalogue's fixing presets and `productionTiming`; memorial keeps its six. No reviews, VAT, invoice/PO,
logo, hole-matching or late-change promises were added; hole matching and bespoke work stay "ask us on WhatsApp".

**Images:** `public/site-images/finish/` holds 96 px swatches and 480 px finish-row pictures cropped by
`scripts/make-finish-swatches.py` from `public/materials/thumbs/*` (no new imagery; those sources carry no AI tag, so
neither do the crops). Cards use the existing studio photos (`-600.webp`, Vercel resizes on preview/production).

## Checks

- `npx tsc --noEmit -p tsconfig.check.json`: pass.
- `npm run build` (local) with every postbuild check: pass (workspace `tmp/cat-template/build2.log`). The Vercel
  preview build (Vercel image mode) also passed every postbuild check (`output/instaplaque-category-template-20261101/deploy.log`).
- **New postbuild check** `scripts/check-category-template.mjs` (`npm run check:category-template`): titles,
  descriptions, H1s and canonicals equal the live ones; FAQPage schema equals the six visible questions word for word;
  questions sit straight after the grid; 10 / 6 cards each leading with the studio photo of the plaque they link to,
  all card and finish links reach built product pages and the ItemList; no film or scene photos; every image and swatch
  file exists; facts line, sample proof PDF and contextual links present.
- **Changed checks (intended):**
  - `check-from-prices.mjs`: memorial and bench no longer have the 4 / 8 "picks" or the memorial grave tile. It now
    checks every template card instead (each finish link at its catalogue price, the from-price equal to the lowest of
    them, the card linking to one of them) and every size drawn to scale at its linked plaque's price.
  - `check-category-pages-browser.cjs` (local only): memorial and bench left its list (no hero photo or made-to-order
    band by design); the other seven pages still pass unchanged (same heights as 31 Oct).
  - `check-cookie-banner-clear.cjs` (local only): memorial and bench are checked on their first-screen controls (chips,
    card links, swatches, the contact bar) instead of the removed hero buttons; a control now counts as on the first
    screen only inside the screen both ways, and fails only when the notice takes its tap (the always-visible contact
    bar is not the notice). All pages pass.
- **New local browser check** `scripts/check-category-template-browser.cjs` (127.0.0.1, external requests blocked),
  phone 390 × 844 and computer 1440 × 900, both pages: **PASS** (`after/browser-results.json`).

| Page | First card, notice showing / after Accept | Notice bottom | Page length | Before (live) |
| --- | --- | --- | --- | --- |
| memorial phone | 317 / 317 px | 155 px | 4693 px, **6.40 screens** | 8769 px, 11.96 screens; first product at 2370 px |
| bench phone | 317 / 317 px | 155 px | 3871 px, **5.28 screens** | 7433 px, 10.14 screens; first product at 1815 px |
| memorial computer | 312 / 312 px | card bottom-centre, not over it | 5.22 screens | |
| bench computer | 312 / 312 px | as above | 5.04 screens | |

  Also verified: no sideways overflow; no script or console errors; on every card a swatch (and each wood) swaps the
  photo, price and link, and that link opens the built page of that finish (all 16 cards); a tap on the photo opens the
  card's plaque; chips switch finishes, narrow the grid (memorial board 3 cards), update the count and stick under the
  header; questions open and close; with JavaScript off both pages keep the H1, all cards, card and finish links (66 /
  36), prices, the six questions and the price table.
- Hosted (`vercel curl` on the preview): both pages serve the template (10 / 6 cards, studio photo first, Vercel image
  srcsets, no video, unchanged titles and H1s); swatch, finish and studio photo files answer 200.

## Screenshots

Workspace `output/instaplaque-category-template-20261101/`: `before/` (live, phone: screen 1 with the cookie notice,
screen 1, screen 2, full page), `after/` (preview build, phone and computer: same set, plus `phone.no-js.png`),
`before-after-first-screens.jpg` and `before-after-full-pages.jpg`.

## Rollback

Nothing is live. To drop the template from a page, remove its slug from `templatePages` in
`components/CategoryTemplatePages.tsx`: `ShopProduct` falls back to the page's previous `CategoryLandingPage` config,
which is still in `components/CategoryPages.tsx`; then restore the old expectations in `check-from-prices.mjs`
(memorial 4 and bench 8 picks, the memorial grave tile) and drop that slug from `check-category-template.mjs`. To drop
the whole branch, deploy `codex/instaplaque-combined-preview-20261031` instead. The bench FAQ additions live in
`services/commerce.ts` and can stay with either layout.

## Release

Only on the owner's go, and after any later stages they want bundled: merge into the release branch, deploy with
`vercel deploy --prod --skip-domain`, check, then `vercel promote`, as in HANDOVER.md. Research memorial (e) item 10
suggests watching Search Console for 2–3 weeks after changing these two pages before changing the others.
