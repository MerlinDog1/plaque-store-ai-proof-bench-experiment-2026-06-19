# Brass and stainless pages: real-looking photos, finish tiles only (25 Oct 2026)

## Why

After the garden page, the owner agreed the plan in msg 6281 ("Do what ever you think best"): plain wording and only
photos the owner has seen (msg 6270: "too many [images] realistically for me to root out the bad ones"). The wording
was sent first (msg 6293) and the photos before release (msg 6304).

Both pages already had four "finish" tiles, each a plaque photo. They are now the only plaque photos on each page
besides the top photo, so the separate row of eight picks is gone (`productPicks` has no brass or stainless entry).

## Brass page

| Slot | Product | Wording and setting |
| --- | --- | --- |
| Top photo `category/brass-hero-v3` | A5 brushed brass, scalloped border (the from-price plaque) | In loving memory of / ELSIE BOND / 1925 – 2014, on a Cotswold stone cottage wall |
| Brushed brass tile | `brushed-brass-297x210-rect-dark-wood-plaque` | In loving memory of / FRANK & JOAN / HOLLIS / Frank 1928 – 2009 / Joan 1931 – 2020, scalloped, on an old brick garden wall |
| Polished brass tile | `polished-brass-200x150-rect-plaque` | HOLLY / HOUSE, on a white-painted brick house front by a green door |
| Orbital brass tile | `orbital-brass-matt-lacquer-297x210-rect-plaque` | This pavilion was / officially opened by / JEAN HARPER MBE / on 12 April 2025, on cedar boards |
| Aged brass tile | `aged-brass-210x148-rect-plaque` | In loving memory of / JAMES ORMEROD / 1941 – 2019 / Forever in our hearts (cream lettering), on grey limestone |

The A5 brushed brass product page (`brushed-brass-210x148-rect-plaque`) shows a square crop of the top photo, so "See
this plaque" opens the same plaque.

## Stainless page

| Slot | Product | Wording and setting |
| --- | --- | --- |
| Top photo `category/stainless-hero-v2` | A5 brushed stainless, no border | THE OLD / DAIRY, on black-stained cladding by an oak door frame |
| Brushed tile | `brushed-stainless-250x150-oval-plaque` | In loving memory of / LILIAN BOYD / 1928 – 2017, on an old brick garden wall |
| Polished tile | `polished-stainless-297x210-rect-plaque` | In loving memory of / PETER & JUNE / WALKER / Peter 1930 – 2015 / June 1933 – 2022, on a stone garden wall |
| Light oak tile | `polished-stainless-200x150-rect-light-wood-plaque` | In loving memory of / SKYE / 2010 – 2024 / Our faithful friend, on a garden shed |
| Dark wood tile | `brushed-stainless-210x148-rect-dark-wood-plaque` | Margaret Rowley, already signed off on the memorial page (alt text corrected) |

## Products

The eight products above (all but the A5 stainless hero and Margaret) have new example wording, drawings, thumbs and
sample PDFs. Per-product settings in `output/catalogue-wording/border-styles.json` now match their photos (scalloped
for the A5 and A4 brushed brass, `inscriptionScale` 0.82 for Holly House, default borders for the rest). The orbital
A4 and aged A5 no longer carry engraved portraits. `export_examples.py` labels Holly House as a house name.

Versions: catalogue photos `?v=2` (aged A5 `?v=4`); feed images `?v=8`; PDFs `?v=8`. The written wording ideas on
both pages are plain too.

## Method

As for the garden (`docs/garden-real-photos-2026-10-25.md`), with two additions in `scripts/real-photos/`:

- `garden_scene.py` sizes a wood-backed plaque by its board (plate + 25 mm), since the designer stencil includes the
  board.
- `brass_stainless.py` (run as `garden.py` in its work folder) has the nine photo specs, generic wording ("memorial
  plaque", "house sign", "opening plaque"), and a `THIN_WOOD` paragraph: the plate flat on a 15 mm board, the board
  flat on the wall.
- Long couple names on A4 are split over two lines so the plate is not mostly empty.

Kept versions: brass top v1 (v2 too orange), Hollis v1, Holly House v1 (v2 tilted and small), pavilion v2 (more matt),
Ormerod v2 (more even aged finish), Old Dairy v2 (v1 small and tilted), Lilian v1, Walker v1, Skye v1. All were
word-perfect and sat on their layout outlines; Holly House's courses were measured (360 px per 75 mm course, as the
layout).

Working files: `workspace/output/instaplaque-brass-stainless-20261025/`.
