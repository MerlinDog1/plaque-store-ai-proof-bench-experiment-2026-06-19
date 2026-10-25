# Garden page: real-looking photos, four picks (25 Oct 2026)

## Why

The garden page was next after the bench page (owner msg 6132: the pages the last search campaign linked to, "with
the same level of care and detail"). The owner approved its wording first (msg 6229). Then the owner worried that the
site had far too many photos to check and that much of the plaque wording "doesn't seem natural" (msg 6270), and
asked me to do what I thought best (msg 6281).

So the garden page now shows only photos the owner has seen: a new top photo, a new fence tile and four picks, down
from eight. The stone and tree tiles were signed off with the memorial page; the bench tile is an original photo.

## What changed on `/garden-plaques`

| Slot | File | Plaque and setting |
| --- | --- | --- |
| Top photo | `category/garden-hero-v3-{1600,1200,800}.webp` | A5 brushed stainless, scalloped border (the from-price plaque): In loving memory of / SUSAN MARSH / 1951 – 2022, on an old red brick garden wall beside a climbing rose |
| Fence tile | `category/route-garden-fence-v2.webp` | Orbital brass 200 × 150: In loving memory of / BISCUIT / 2006 – 2024 / Our gentle cat, on a timber fence above lavender |
| Pick 1 | `polished-stainless-210x148-rect-plaque` | In loving memory of / ELIZABETH WARD / 1934 – 2020, on a sandstone terrace wall |
| Pick 2 | `aged-brass-250x150-oval-plaque` | GRANDAD'S / GARDEN, on a sage-green shed |
| Pick 3 | `brushed-brass-200x200-circle-plaque` | In loving memory of / MAY / ATHERTON / 1924 – 2019, on a blue-grey garden gate |
| Pick 4 | `orbital-brass-matt-lacquer-300x200-rect-plaque` | This garden is dedicated to / THE NURSES / of Slad Valley Hospital, on a buff brick wall (no border) |

- The four picks and the fence plaque (`orbital-brass-matt-lacquer-200x150-rect-plaque`, whose page shows a square
  crop of the tile) have new example wording everywhere it appears: `output/catalogue-wording/wording.json`, then
  `services/catalogueExamples.ts` via `export_examples.py`; the flat drawings and thumbs; the sample PDFs.
- Elizabeth Ward's plaque no longer carries an engraved portrait (removed from `portrait-styles.json` and the
  overnight portrait list), so the photo, drawing, PDF and page text agree.
- Versions: catalogue photos `?v=2`; feed images `merchantImageQuery` `?v=7`; PDF links `?v=7`.
- The nurses' and May Atherton's photos also appear on the tree, opening and custom pages until those are redone.

## Method

The bench page's coded-layout method (`docs/bench-real-photos-2026-10-25.md`), for walls, fences, sheds and gates:

1. **Coded layouts.** `scripts/real-photos/garden_scene.py` draws the surface from real measurements (bricks
   215 × 65 mm with 10 mm joints, coursed stone, sandstone blocks, boards at their real widths) with the plaque's
   designer drawing on it at its true size, seen by a camera square to the surface at the plaque's height. Every
   plaque is level (`plaque_tilt_deg` 0.0).
2. **Briefs.** `garden.py prompts rN`: the layout as a composition guide, plain ordinary surfaces and soft light,
   a true 1.5 mm plate with flat caps, real metal for each finish, the exact wording, and the scale in bricks or boards.
3. **Generation.** `run_batch.py` on Codex gpt-image-2 (ChatGPT subscription, no Gemini spend), two versions each.
4. **Choosing.** Every line zoom-checked; each plaque checked on its layout outline (`review.py`); plate proportions
   measured.
   - Round 1's circle came out 4–7% narrower than tall. Its oval and circle also had a screw slot drawn on the caps
     (from `metal_screws.py`, which is for screwed bench plaques), so the images mixed slotted screws and domed buttons.
   - Round 2 redrew both with flat caps (`metal_screws.py … cap`) and asked for a true circle: the circle is now within
     2% and both have flat caps.
   - Kept: top photo v2 (scalloped corners), fence v1 (the matt orbital finish), Elizabeth v1 (flat caps, not domed),
     oval r2 v1 (even aged finish), circle r2 v2, nurses v2 (matt, not shiny).
5. **Publishing.** `feed_layouts.cjs` (drawings and PDF layouts), `publish-codex-photos.py thumbs`,
   `product_proof.py` + `render_products.mjs` (PDFs, copied to `public/samples/products`),
   `publish-category-page-images.py` (photos).

Working files: `workspace/output/instaplaque-garden-real-20261025/`.
