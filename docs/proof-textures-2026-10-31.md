# Proofs and sample PDFs with the designer's textures (31 October 2026)

**Status:** LIVE since 31 October 2026, 08:05 UTC, with the product pages v3 release (owner msg 8146):
dpl_uNxynWjiLaW1qAcaUHEEXaNKJgiq (`index-CkaO0isp.js`, commit 2a93dd5). Rollback: dpl_sU9UTr4ZoqiSngGZXdnoZuWtRDbx.

## Why

The owner (msg 8116): "Why the pdf has a different image like texture not as good as designer and preview? Notice
this also sometimes in proofs?" Then (msg 8124): "my production stays plain drawing but the pdfs on the pages and all
other stuff uses the textures".

Causes found:

1. The 175 catalogue sample PDFs and the home-page sample were drawn by their own generator
   (`output/instaplaque-sample-proof/source/` in the workspace, outside this repository). It imitated the metal and
   wood with SVG colour fades and drawn streaks, not the designer's photo textures (`public/materials/optimized/`).
2. The designer's "Download proof PDF" uses the designer drawing with its real textures (checked on the 29 Oct proof,
   and by running the same steps in Chrome and in WebKit with iPhone settings). But when the customer had made an AI
   "Realistic preview", the PDF showed that AI picture *instead of* the drawing (`App.tsx`), and the picture was not
   cleared when the wording, size or finish changed afterwards, so it could even show an older design.
3. The order email's production artwork PDF (`createCorelPdfBlob`) is a plain technical drawing by design. Unchanged.

## What changed

- **Catalogue sample PDFs (175).** `product_proof.py` now places the designer's own drawing of the plaque (board,
  plate, lettering, border and fixings) where it used to draw its own: the product page's flat design view
  (`public/site-images/merchant/<slug>.jpg`), cropped to the board or plate box (the render fits the SVG in a 1360 px
  square centred in 1500 px; the crop is checked against the white frame), clipped to the shape for ovals and circles.
  The two products whose page image is a photo (A5 brushed steel, polished brass bench 200 x 100) got the same render
  from `render_designer_drawings.cjs` (the stencil app, as `scripts/real-photos/feed_layouts.cjs`). Pages 1 and 2 share
  one embedded JPEG. Dimension lines, the side section and the hole template are unchanged. The offer list was dumped
  afresh, so the 25 PDFs that still showed production times from 21 October now match the site. PDFs are about
  230 KB each (40 MB in all, up from 21 MB). Version `?v=12` (`samplePdfVersion`, `components/CatalogueDetails.tsx`).
- **Their pictures on the product pages** (350, `scripts/make-sample-proof-thumbs.py`) were remade from the new PDFs.
- **Home-page sample proof** (`/samples/instaplaque-sample-proof.pdf`, Margaret Rose): `sample_html.py` fills the plate
  and its caps with the designer's brushed brass photo, stretched over the plate as `PlaquePreview.tsx` does (caps as
  the plate image clipped to each cap; a pattern fill made Chrome embed the photo again, uncompressed). Its page
  pictures (`site-images/proof/sample-proof-page-*`) were remade; `sampleProofPdf` and `featureImageVersion` are `v=5`,
  as is the link in `DesignRequest.tsx`.
- **Designer "Download proof PDF".** The proof page always shows the designer drawing. An AI "Realistic preview" is
  added as its own second page, "AI impression, for illustration only", and only if the design is unchanged since
  the picture was made (`generatedImageFor` in `App.tsx`; `addAiPreviewPage` in `services/exportService.ts`).

Generator backups (workspace, outside Git): `product_proof.before-20261031.py`, `sample_html.before-20261031.py`,
`merchant/offers.before-20261031.json`, `before-20261031/` (old sample page PNGs).

## Redo after a design change

1. `node dump_offers.mjs`; `python3 product_proof.py`; `cody-job node render_products.mjs --offset 0 --limit 60`
   (and 60, 120), all in `output/instaplaque-sample-proof/source/`, from this repository's root for the renderer.
2. Copy `output/merchant-proofs/<slug>.pdf` over `public/samples/products/`, run
   `python3 scripts/make-sample-proof-thumbs.py`, and bump `samplePdfVersion` and the two `?v=` in
   `scripts/check-product-policies.mjs`.

## Checks

- All 175 PDFs printed with no layout issues; every cover reviewed on contact sheets; hole centre lines checked at
  300 dpi on a wood-backed and a round plaque; production days on page 2 match the catalogue for 175 of 175 (the old
  files: 25 out of date).
- tsc; full build with every postbuild check (the product-policy check now wants `?v=12` PDFs and pictures).
- The real `downloadPdf`, bundled with esbuild and run in Chrome at computer and phone widths: one page without an AI
  picture, two with one, page 2 labelled (workspace `output/instaplaque-custom-band-20261031/proofpdf-test/`).
- Product pages on the local build, phone and computer: one proof picture, the plaque's own, opening its `?v=12` PDF.
