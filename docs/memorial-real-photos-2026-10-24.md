# Memorial page: real-looking photos (24 Oct 2026)

## Why

The owner reviewed every site photo (msg 5992):

> They all, apart from og ones that have always been on site, look way too fake like a bad photo shop where the plaque
> looks much less real than the rest of the photo … Plaque wording is also often sub par with too short text.

"og" means the original June photos, which stay. Further rules from the owner:

- Wall memorial plaques like these are shown on wood with the scalloped border (msg 6001).
- The photos must keep the exact layout and still look real (msg 6003, "can't we have both?").
- Msg 6056: "start with memorial page replace all newish images, you really need to sense check content, layout,
  placement etc. Make up a back story for the plaque if you must".

## What changed

All 16 newer photos on `/memorial-plaques` were replaced.

| Slot | New file | Story / setting |
| --- | --- | --- |
| Top photo | `category/memorial-hero-v3-{1600,1200,800}.webp` | Margaret Rowley, A5 brushed stainless on dark walnut, scalloped, on her old garden wall by her climbing rose |
| Tile: In the garden (also the garden page's "On a stone") | `category/route-garden-stone-v3.webp` | Ivy & Sid Moore, brushed brass on the boulder Sid dug out of the pond |
| Tile: By a tree (memorial and garden pages) | `memorial/route-tree-v2.webp` | Jim Partridge, brushed brass on oak board and stake by his cherry |
| Tile: At a grave | `memorial/route-grave-cross-v2.webp` | Alice May Grant, polished brass 150×50 on a temporary oak cross |
| 8 product picks | `catalogue-photo/<slug>.webp` (`?v=2`) | See the table below |
| Portrait strip (memorial, tree and portrait pages; custom page's "With a portrait" tile) | `memorial/portrait-{george-v2,daniel,bramble-v2,ron-pat-v2}.webp` | Settings from each portrait's wording |

The product picks:

| Product | Example wording | Setting |
| --- | --- | --- |
| aged-brass-210x148 | James Ormerod, signalman | Heritage railway platform |
| polished-brass-250x150 oval | Irene Baxter, church flowers | Church porch |
| polished-stainless-148x210 | Harold Jenkins, bowls captain | Bowls club pavilion |
| polished-brass-297x210 | Charlotte May Pemberton, headmistress | School rose garden |
| aged-brass-148x210 | Beatrice Anne Holt, lunch club | Village hall |
| brushed-stainless-300x200 | Alan Vaughan, lifeboat coxswain | Lifeboat station |
| polished-brass-148x210 light wood | Samuel Hargreaves, bell ringer | Ringing chamber; now with a scalloped border |
| brushed-stainless-150x50 | Joan Parry, community garden | Teak bench |

The eight products' example wording also changed everywhere it appears:

- `output/catalogue-wording/wording.json`, then `services/catalogueExamples.ts` via `export_examples.py`.
  - `USE_OVERRIDES` keeps Harold and Charlotte labelled as memorial plaques.
- Flat drawings in `public/site-images/merchant/<slug>.jpg` and their thumbs.
- Sample PDFs in `public/samples/products`.

Cache-busting versions:

- Feed images: `merchantImageQuery` is now `?v=3`, and product pages now load the flat drawing with it too.
- PDF links: `?v=3`.

Joan's portrait was refused by the image safety filter five times, including with the moderation hint set to low. It
was replaced by Daniel (also drawn by Portraits in Metal) on the cliff path. The superseded files were removed.

## Method (reuse for the rest of the site)

Scripts are in `scripts/real-photos/`. Working files are in `workspace/output/instaplaque-memorial-real-20261024/`.

1. **`specs.py`.** One entry per photo:
   - the back story
   - the plaque spec
   - fuller wording (5–7 lines)
   - the setting, camera and scale
2. **The artwork drives the layout.**
   - Page photos use `coded.py` + `render_coded.cjs`: hand-coded SVG in millimetres, with the site's pinned EB Garamond.
   - Products use the site designer (`output/stencil-app/render.cjs`), so the photo, drawing and PDF agree. Caps and
     screws are repainted in metal.
   - Portraits use PIM's own stencil, unchanged.
3. **`prompts.py`** writes one prompt per photo. The prompt treats the artwork as a layout guide ("not a picture to
   paste in"), then gives a real-photo brief: a family member's camera, natural light matching the scene, a gentle
   angle, weathered real settings and true scale.
4. **`run_batch.py`** runs Codex gpt-image-2 edits on the ChatGPT subscription, one at a time inside `cody-job`, with
   two or three versions each.
   - About 70 s per image.
   - Peak account memory 3.58 GiB, so no Chrome while it runs.
5. **Checks before publishing.**
   - Every line is zoom-checked against the artwork.
   - Plaque size is checked against bricks, flowers and trunks.
   - The setting must make sense for the wording.
   - The first hero versions came out 2–2.5× too big against the bricks. A wider framing with "about four whole bricks
     across and seven courses" fixed it.
6. **`feed_layouts.cjs`** redraws the flat drawings and sample-PDF layouts for any product whose wording changed. Then
   run:
   1. `publish-codex-photos.py thumbs`
   2. `product_proof.py` + `render_products.mjs` for the slugs
   3. copy the PDFs into `public/samples/products`
7. **`publish-category-page-images.py SOURCES.json`** publishes the photos. It now has a `memorial` group for
   `site-images/memorial/<name>.webp`.

## Release

| Item | Value |
| --- | --- |
| Live | 24 Oct 2026, about 22:18 UTC, as `dpl_7hAkGJ7nUstsJ5oLCMWbM53h7Riw` (commit b46450d, bundle `index-TTr7FKpr.js`) |
| Rollback | `dpl_G9QMwFLX9BqKrawZbfiKSEGH2ynX` |
| Vercel build | Passed, including the postbuild product-policy and feed checks |
| Static render | No missing images on the eight category pages |
| Real app, phone and desktop | Memorial, garden, tree and one product page passed; the designer opens at the expected prices |
| Live bytes | Every new asset served live matches the repository |

## Round 2 (owner msg 6085, 24 Oct about 22:25 UTC)

The owner's feedback (msg 6085):

> Not all the portrait plaques on that page have to be tree stake ones. Also for the tree stake ones make sure the plaque
> still looks real and keep real close to them and show less background. Some of these the thickness is very
> exaggerated and I don't see any scalloped borders or wip Pics?

What changed:

- **Thickness.** Every prompt now states the real 1.5 mm plate and 15 mm board. It also asks for a fine edge line only, never a slab or a deep block. The five round-1 products that left the memorial page were redone the same way, for their own product pages (photos `?v=3`).
- **Scalloped borders and wood.** The memorial page's picks moved to wood-backed products with the scalloped border:
  - Margaret Rowley, A5 stainless on walnut
  - Bob Cuthbert, aged brass 400×300 on oak, cricket pavilion
  - David Okafor, polished stainless 210×297 on walnut, summerhouse
  - Ruth Adeyemi, aged brass 148×210 on walnut, library
  - Ivor Pugh, polished brass 200×150 on oak
  - Samuel Hargreaves, bell ringer, kept
  - The church-porch oval and the bench plaque were kept and redone thinner.
  - New wording, flat drawings, thumbs and sample PDFs for the five changed products: feed images `?v=4`, PDFs `?v=4`.
- **Workshop pictures.** Margaret's plaque is propped on the workshop bench (the first pick, also the hero's product). Ivor's plaque gets a macro shot on the bench. Bramble's portrait is also on the bench.
- **Portraits.** Not all on stakes:
  - George and Ron & Pat on stakes, as tight close-ups with little background
  - Daniel on a sailing club boathouse wall
  - Bramble in the workshop
- **Top photo and tiles.** All redone at true thickness: Margaret on the wall, Ivy & Sid on the stone, and a tight close-up of Jim Partridge's tree plaque.

Scripts: `scripts/real-photos/round2.py` (specs, `designer` and `prompts` commands); `run_batch.py` reads `JOBS=` for another jobs file. One Codex call in about 15 hung for 11 minutes (the CLI timeout); the batch carries on past it.
