# Catalogue product pages: photos, specifications, links and sample proofs (21 October 2026)

Owner request (msg 5231), following the independent review of 21 October:

> You should be able to use an old version of the site to generate very realistic plaque photos.
> Pad out all products pages. Make the example pdfs for them all?

It also covers the review's SEO point about the 175 exact-offer pages, which were near-duplicates and orphaned.

## What changed on every catalogue page (`/<slug>` for the 175 `merchantOffers`)

- **Photo first.**
  - The hero shows a realistic photo of that exact configuration (size, shape, finish, backing, caps or screws) with the example inscription, fixed in a fitting setting.
  - Bench formats are shown on a bench rail. Metal-only plates are on a brick, stone or rendered wall. Wood-backed plates are on painted interior walls.
  - A second gallery image is the flat design render (`image`). It stays the Merchant Center `image_link` and the Product schema image, so the feed image is still on the landing page.
  - The two offers that already had photo-style images (`a5-brushed-steel-personalised-plaque`, `polished-brass-bench-plaque-200x100`) keep them.
  - There are no visible AI captions (owner msg 5231). Each published photo carries IPTC `DigitalSourceType = trainedAlgorithmicMedia` in its metadata.
- **"What you get."** replaces the empty "Choose the size and finish." block:
  - A specification list: size, board size, shape, finish, lettering, border, fixings, backing, production, delivery and price.
  - A finish note and a size tip (A5 = half A4, bench rail depth, card template).
  - A link to the page's own sample proof PDF.
  - Facts come from the catalogue and site copy only: 1.5 mm metal, wood board 25 mm larger overall, caps Ø10/Ø15 mm.
- **"Other sizes and finishes."** links:
  - other sizes in the same finish and backing
  - the same size in the other finishes
  - the other backing options

  Each link shows its price.
- **Category and materials pages link in:**
  - `/brass-plaques` and `/stainless-steel-plaques` have a "by size" list per finish, collapsible.
  - Each `/materials` finish card links to its A5 page.
- **Wording help:** the "A little help choosing." block on catalogue pages points to the memorial wording examples and to bench and garden fitting, no longer to opening plaques.

Not done: the review's suggestion to canonicalise finish/backing variants to about 15 core sizes. A variant page whose canonical points at a different-priced page risks Google Shopping price-mismatch disapprovals. Doing that safely means one page per size with a finish selector and ProductGroup/variant markup. The pages were enriched instead, so they are no longer thin duplicates.

## How the photos are made (reproducible)

1. `scripts/render-merchant-stencils.cjs` needs a Vite dev server on `APP_URL`, default `http://127.0.0.1:4210`.
   - For each offer, it renders the designer's `PlaquePreview` with the example inscription in EB Garamond.
   - It calls the designer's own `svgToPngBase64`, which is exactly the reference image the realistic preview sends.
   - Output: `output/merchant-photos/stencils/<slug>.png`. Ovals and circles use `inscriptionScale: 0.8` so the side caps stay clear of the name.
2. `scripts/generate-merchant-photos.mjs` runs as `vercel env run -e development -- node scripts/generate-merchant-photos.mjs` (the key is never printed).
   - It bundles `services/geminiService.ts` with esbuild and calls `generateRealisticView` (model `gemini-3.1-flash-image-preview`), at 2K, 1:1, with a per-format scene brief.
   - `gemini-3.8-flash` then checks each image: exact wording, shape, backing, fixing count, no added lines or symbols, caps clear of the text, legible under reflections, photographic, fully in frame.
   - A failed image is regenerated, up to three attempts.
   - Output: `output/merchant-photos/raw/<slug>.png` and `qa/<slug>.json`. Options: `ONLY`, `LIMIT`, `CONCURRENCY`, `MAX_ATTEMPTS`, `FORCE`, and `RECHECK` (re-checks photos accepted under older rules and regenerates failures).
   - The checker misses some faults, so every contact sheet was also reviewed by eye. 24 photos were redone after that review:
     - pale polished brass
     - mirror reflections hiding words
     - caps drawn as black dots
     - black instead of cream lettering on aged brass
     - circles crowding the caps
   - Four photos were accepted by eye although the checker objected to their slight perspective (`output/merchant-photos/manual-accept.json`).
   - About 250 images were generated in all (counted from the run logs) on the Gemini key; at an estimated $0.10 each, that is roughly $25.
3. `python3 scripts/publish-merchant-photos.py --sheets` writes contact sheets for review (`output/merchant-photos/sheets/`).
   - Without `--sheets`, it writes `public/site-images/merchant-photo/<slug>.webp` (1200 px) and `-600.webp`, with the metadata above.

Fixes made along the way:
- `svgToPngBase64` left the wood board blank (cream) in the realistic-preview reference. The board's `url(#wood…)` fill pointed at defs that were removed. It now fills the board with the wood reference colour; this also fixes the designer's realistic preview for wood-backed plaques.
- `generateRealisticView` takes an optional `imageSize`; the designer keeps 4K.

## Sample proof PDFs

`public/samples/products/<slug>.pdf` is one per offer (175; 81–223 KB; 21 MB in total), in the style of the owner-approved sample proof (`/samples/instaplaque-sample-proof.pdf`). Each has three pages:
1. A cover with the plate.
2. A dimensioned front view, with hole centres and edge offsets and the board size for wood. It also has a side section for caps, screws or wood, and a specification table.
3. Fitting steps for the fixing type, the approval box and the hole positions.

There are no prices and no names apart from the example "ALEX MORGAN".

- **Geometry:** a port of `services/fixingGeometry.ts`, `inscriptionLayout.ts`, `safeMargin.ts` and `circularTextFit.ts`, checked against the TypeScript for all 175 offers. Cap insets are 14 mm (Ø10) and 16.5 mm (Ø15), and screws sit 7.75 mm from the ends. Holes are Ø5 for caps and Ø3 for screws.
- **Thickness:** 1.5 mm metal, and a 15 mm wood board, from `ThreePlaquePreview.tsx` and the designer copy.
- **Assumption to confirm with the owner:** on wood-backed plaques, the screws are drawn going through the plate and the board into the wall. The site does not say how the board is fixed.
- **Generator:** `/home/coding-agent/workspace/output/instaplaque-sample-proof/source/`, outside the repository like the original sample's generator. It holds:
  - `product_proof.py`
  - `render_products.mjs`, run in batches of 60 under cody-job after `mem_gate.py`
  - `verify_geometry.mjs` and `check_geometry.py`
  - `contact_sheet.py`
- **Staging folder:** `output/merchant-proofs/`.

The original sample's page 3 hole template ran into the footer; it is now drawn at 0.30 scale (`sample_html.py`). The sample PDF link and the proof preview images are version-tagged `?v=4`.

## Checks

- `scripts/check-product-policies.mjs` (postbuild) now asserts that every catalogue page has:
  - its photo, both sizes built (render offers only)
  - the specification
  - variant links
  - a linked, built sample PDF
- `scripts/check-merchant-browser.cjs` expects the photo first and the feed image in the gallery.
