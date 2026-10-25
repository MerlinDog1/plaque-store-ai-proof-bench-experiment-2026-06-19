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

## Round 2: coded bench layouts (owner msgs 6149, 6152, 6154)

Round 1 went live at 08:24 UTC. The owner's feedback on it:

> Yeah backgrounds on most is just way too much, too dramatic. Really wants to be more no descript right and throw in
> some newer looking benches. If you gonna take from an angle you need to make sure plaque lines up with bench and also
> check positioning on bench always

> Also if someone say somewhere to watch something etc the bench would be looking out towards that great view so our
> picture would not contain that great view make sense

> I mean could you even potentially code the angle? And the rough bench outline so image model was less likely to make
> shit up?

So the top photo and six picks were remade from a coded 3D layout. Mary Quinn's workshop shot and Joan Parry's pick
(signed off with the memorial page) stay.

- **The guide** comes from `scripts/real-photos/bench_scene.py`, a small numpy z-buffer renderer.
  - It renders a plain clay model of the bench: a garden bench with a thick top rail and vertical slats, a park bench
    with wide back slats on cast-iron ends, or a modern slatted bench on a steel frame. Every bench has the right
    recline.
  - The plaque's own designer drawing (screws repainted as metal) is mapped in perspective onto the middle of the top
    rail. It is centred on the rail and lined up with it. The script refuses a plaque taller than the rail allows.
  - The camera is set by lens, side angle, height and the share of the frame the plaque fills. Edges are outlined and
    the background is left plain.
  - It also records where the plaque's corners land in the frame.
- **Codex** gets the guide in place of the flat drawing. The `GUIDE` paragraph in `bench.py` says to keep the camera,
  perspective, bench outline and the plaque's exact place and angle, and to replace the grey placeholders with real
  materials and the setting.
- **Which way the bench faces.** Each bench faces its view, and the plaque is on the front of the backrest. So the
  photo looks back at the bench, and the view the wording talks about is behind the camera. Behind each bench is only
  an ordinary hedge, wall, path or fence, in soft daylight. Polished plates reflect the sky.
- **Benches.** Four are newer (teak, oiled hardwood on a steel frame, freshly painted, clear-finished park bench) and
  three are old (oak, iroko, oak).
- **The check.** `overlay.py` draws the guide's plaque outline over each photo. A version is kept only if the plaque
  sits on that outline: square on the rail and in the right place.

Round 2 was shown to the owner but never released.

## Round 3: closer, 1.5 mm, real metal (owner msg 6162)

The owner's verdict on the round-2 samples:

> Low key feel like you want to me closer to the plaque and also plaque is 1.5mm thick, it needs to look like real
> metal also

- **Closer and flatter on.** The plaque fills about 55% of the top photo (70 mm lens, about 50 cm away) and 75–80% of
  each product photo (85 mm lens, 65–95 cm away). The side angle is 12–18° and the camera is 10–14° above the rail.
- **Thin plate.** `THIN` now says square-cut edges with no bevel, rim or frame around the outer edge, while the
  engraved border on the face stays. The guide no longer outlines the plate, because an outline can read as a frame.
  At full size the plate edge is a hairline of about 1.5 mm.
- **Real metal.** A `METAL` paragraph says how each finish catches the light: brushed lines that shimmer, a mirror
  that reflects the real sky, a soft even patina, a fine swirl under lacquer. It adds that the plate is never a flat
  print.
- **Checks.** All 14 versions sat on their guide outlines and were word-perfect. `review_round.py r3` makes the
  overlay and plaque sheets.
- **Kept.** v1 of each, except v2 for Revd Ashworth, whose lighter reflections read better.

Round 3 was shown to the owner but never released.

## Round 4: simple wording (owner msgs 6186, 6189, 6192)

The owner liked round 3 ("they look better generally") but not the wording:

> I just don't like the text now I think. Its just not very human.

> for these I'd just have in loving memory, name dates and for like a quarter of them another line. Like a bible
> quote for the Reverend something about resting or sitting etc. Penrose can have a line about sailing. George needs
> dates.

> Put together again on Tom and Betty but yes proceed

The rule is now "In loving memory of", the name and the dates. Three plaques get one more line:

| Plaque | Wording |
| --- | --- |
| Top photo (150 × 50, brushed stainless) | In loving memory of / GEORGE HOLLAND / 1931 – 2021 |
| Lily Chambers (225 × 75, brushed brass) | In loving memory of / LILY CHAMBERS / 1929 – 2019 |
| Tom & Betty Harris (200 × 50, polished stainless) | In loving memory of / TOM & BETTY HARRIS / Tom 1932 – 2016 · Betty 1935 – 2021 / Together again |
| Alice Grant (150 × 75, aged brass) | In loving memory of / ALICE GRANT / 1933 – 2021 |
| Mary Quinn (150 × 65, polished brass, workshop) | In loving memory of / MARY QUINN / 1938 – 2022 |
| John Penrose (150 × 75, orbital brass) | In loving memory of / JOHN PENROSE / 1946 – 2022 / Fair winds and following seas |
| Stan Bailey (150 × 75, brushed stainless) | In loving memory of / STAN BAILEY / 1939 – 2020 |
| Revd John Ashworth (225 × 65, polished stainless) | In loving memory of / REVD JOHN ASHWORTH / 1929 – 2012 / “Come ye apart and rest a while” Mark 6:31 |

Other changes in this round:

- **Aged brass.** The owner said "Aged brass is intentionally aged ... It's aged but not old". The brief now
  describes a brand-new plate with a deliberate, even antique finish: never weathered, tarnished, blotchy or worn.
- **Top photo spacing.** With only three short lines, George's name grew close to the end screws. The hero preset
  sets `inscriptionScale` 0.86 for more room. The stencil tool now honours a preset's own `inscriptionScale`: see
  `output/stencil-app/entry.tsx`, with `stencil.js` patched to match.
- **Products.** The seven products got new example wording, flat drawings, thumbnails and sample PDFs. Feed images
  and PDF links are now `?v=6`.
- **Matching text elsewhere.**
  - `wordingFit` for 150 × 50
  - the wording guide's Lily example
  - the stainless page's bench example (Tom & Betty)
- **Mary Quinn's workshop shot** was remade from its flat drawing with the round-3 rules for a thin plate and real
  metal. The first two versions gave her plate a bevelled, raised rim and stood it up. The retry (`-r4b`) spells
  out "no bevel, no chamfer, no raised or stepped rim" and "lies completely flat, face up". Its v2 has a flat
  1.5 mm sheet and a plain tin; v1 was rejected for lettering on the polish tin.
- **Kept.** v1 of each bench photo, except v2 for Revd Ashworth; Mary's is `-r4b` v2. All 14 bench versions sat on
  their guide outlines and were word-perfect.

Files:
- Top photo: `category/bench-hero-v3`.
- The six bench picks and Mary's photo: `?v=3`.
- None of rounds 2–4 had gone live before this release, so they reuse those file names.

## Checks

- Static render: the bench page has 13 images and none are missing.
- Vercel postbuild:
  - live SEO: 21 editorial and 175 product URLs
  - product policies: every page has its photo and a `?v=5` PDF
  - feed: 175 items match
