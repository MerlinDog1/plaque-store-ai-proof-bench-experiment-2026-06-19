# Bench page: real-looking photos (25 Oct 2026)

## Why

The owner signed off the memorial page (msg 6132) and asked for the pages that the last search campaign linked to to
be done next, "with the same level of care and detail":

> Memorial page is signed off. How many pages did last search ad campaign directly link too? Those will be the pics to
> fix the next with the same level of care and detail

The 14-day pilot (campaign 24337051883, 10–23 Oct) linked to 7 pages. Its 5 ads went to memorial, bench, garden, brass
and opening; its sitelinks added how-it-works and materials. GA4 ad landings: memorial 119, bench 54, garden 34,
brass 33, opening 1. How-it-works and materials show only the sample proof and the original material photos, so the
order is bench, garden, brass, then opening. The paused next campaign also links the tree page.

## What changed on `/bench-plaques`

| Slot | File | Plaque, story and setting |
| --- | --- | --- |
| Top photo | `category/bench-hero-v2-{1600,1200,800}.webp` | Brushed stainless 150 × 50 (the from-price plaque). George Holland "who walked these hills and loved this view", on a weathered teak bench on a hilltop at sunset |
| Pick 1 (kept) | `catalogue-photo/brushed-stainless-150x50-rect-plaque.webp?v=3` | Joan Parry, community garden: done for the memorial page and already signed off |
| Pick 2 | `brushed-brass-225x75-rect-plaque` | Lily Chambers, who walked by the river every morning: dark oak bench by a weir at dawn |
| Pick 3 | `polished-stainless-200x50-rect-plaque` | Tom & Betty Harris, who watched the boats come home: seafront bench with green cast-iron ends at sunset |
| Pick 4 | `aged-brass-150x75-rect-plaque` | Alice Grant, who bowled on this green: teak bench by a village bowling green (scalloped border, cream lettering) |
| Pick 5 | `polished-brass-150x65-rect-plaque` | Mary Quinn, sweet peas on the allotments: on our workshop bench, just polished, with its four screws laid out (double border) |
| Pick 6 | `orbital-brass-matt-lacquer-150x75-rect-plaque` | John Penrose, who taught half the village to sail: sailing club bench by a lake |
| Pick 7 | `brushed-stainless-150x75-rect-plaque` | Stan Bailey, park keeper for thirty years: painted park bench by the bandstand |
| Pick 8 | `polished-stainless-225x65-rect-plaque` | Revd John Ashworth, who always had time to sit and listen: oak bench in a churchyard (double border) |

Product photos are `?v=2` (`cataloguePhotoVersions` in `services/commerce.ts`).

Each of the seven products also has new example wording everywhere it appears:

- `output/catalogue-wording/wording.json` and `border-styles.json` (backups `*.before-20261025-bench.json`), then
  `services/catalogueExamples.ts` via `export_examples.py`.
- The flat drawings `public/site-images/merchant/<slug>.jpg` and their thumbs.
- The sample PDFs in `public/samples/products`.

Cache-busting versions: feed images `merchantImageQuery` `?v=5`, PDF links `?v=5`.

Page copy:

- The picks' intro names the settings.
- The wording section now says a bench plaque has room for three to five short lines. The 150 × 50 top photo carries
  four.

## Method

The memorial page's method (see `docs/memorial-real-photos-2026-10-24.md`), with bench-specific rules. The scripts are
`scripts/real-photos/bench.py` and `metal_screws4.py`; the working files are in
`workspace/output/instaplaque-bench-real-20261025/`.

1. **Wording.** Each plaque gets a back story and 4–5 lines, checked in the designer's own layout:
   - smallest lettering 5.6 mm, on the 150 × 50 and 200 × 50 plates
   - names 10–13 mm
   - longer sentences fit on the wider plates
2. **Artwork.** `bench.py designer` writes the stencil wording; `output/stencil-app/render.cjs` draws it. The screw
   dots are repainted as metal screws: `metal_screws.py` for 2-hole plates, `metal_screws4.py` for 4-hole plates.
3. **Briefs.** `bench.py prompts` writes the brief for each photo:
   - the artwork as a layout guide, not a picture to paste in
   - a true 1.5 mm plate "screwed straight onto the timber… no gap, no frame and no backing board"
   - low screw heads
   - the bench as real, used timber
   - scale from the top rail: the plaque covers the middle half or so of a 95–110 mm rail
   - no people
4. **Generation.** `run_batch.py` makes 2 versions of each on Codex gpt-image-2 (ChatGPT subscription; no Gemini
   spend). 16 images took about 20 minutes.
5. **Choosing.** I zoomed in on every line and measured each plate's proportions; a plate more than ~12% off its true
   shape was rejected. Rejected versions:
   - the seafront v1: plate 3.2:1 instead of 4:1
   - the sailing club v2: a person in the background
   - the park v2: a stray mark after "BAILEY"
   - the workshop v2: a grubby bench
   - the churchyard v2: a wide gap in the name
6. **Publishing.**
   - `scripts/publish-category-page-images.py` for the photos
   - `feed_layouts.cjs` for the drawings and PDF layouts, then `publish-codex-photos.py thumbs`
   - `product_proof.py` + `render_products.mjs` for the PDFs

## Checks

- Static render: the bench page has 13 images and none are missing.
- Vercel postbuild:
  - live SEO: 21 editorial and 175 product URLs
  - product policies: every page has its photo and a `?v=5` PDF
  - feed: 175 items match
