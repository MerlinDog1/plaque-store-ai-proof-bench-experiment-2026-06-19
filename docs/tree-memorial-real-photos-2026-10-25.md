# Tree page and memorial picks: real-looking photos, plain wording (25 Oct 2026)

The last of the category pages done under the owner's plan (msgs 6270, 6281): plain wording and only photos the owner
has seen. Wording sent first (msg 6313), photos before release (msg 6320).

## Tree page: top photo and four examples (no pick row)

All are A5 plates on light oak boards, each on one black steel ground stake at the foot of its tree.

| Slot | Plate | Wording |
| --- | --- | --- |
| Top photo `category/tree-hero-v2` | Brushed brass, scalloped | This cherry tree was planted / in loving memory of / JIM PARTRIDGE / 1947 – 2025 |
| Example | Aged brass, cream lettering | This apple tree was planted / in loving memory of / PAULINE / HARGREAVES / 1940 – 2023 |
| Example | Brushed stainless, scalloped | This oak was planted / in memory of / KATHLEEN ELLIS / 1942 – 2024 |
| Example | Polished stainless | This tree was planted / by the children of / ASHFIELD PRIMARY / SCHOOL / in memory of Mrs Long |
| Example | Polished brass | In loving memory of / MOSS / 2009 – 2023 / Forever by our side |

- Photos: `tree-plaque-photos/memorial-tree-plaque-{cherry,apple,oak,school,birch}-v2` (+ `-900`, `-sq`). The tree
  family's share image is `memorial-tree-plaque-cherry-v2-sq`.
- The memorial and garden pages' "By a tree" tile is now `memorial/route-tree-v4`, the same photo. The signed-off v3
  said "Grandad, gardener and teller of tall tales".
- The A5 brushed brass on light oak product (`brushed-brass-210x148-rect-light-wood-plaque`, the tree page's "See this
  plaque") shows a square crop of the top photo, with the same wording, drawing and PDF.
- The row of eight wall plaques ("without a board or stake") is gone; the size ladder still lists every size.
- Wording ideas lost "who taught us the name of every tree", and the pet example is Moss, not Biscuit the spaniel.
  Biscuit is now only the garden page's cat.
- The garden landing data's unused tree examples point at the same new photos.

## Memorial page: four picks

Margaret Rowley (A5 stainless on walnut) and Joan Parry (bench) stay. Bob Cuthbert and David Okafor are redone in
plain wording from coded layouts:

- `aged-brass-400x300-rect-light-wood-plaque`: In loving memory of / BOB / CUTHBERT / 1938 – 2022 / Always one of us,
  on a cricket pavilion's white boards.
- `polished-stainless-210x297-rect-dark-wood-plaque`: In loving memory of / DAVID / OKAFOR / 1951 – 2020, on a
  summerhouse wall.

Photos `?v=3`. Ruth Adeyemi, Irene Baxter, Ivor Pugh and Samuel Hargreaves left the memorial picks; their product pages
are unchanged.

## Method

- Tree photos have no coded layout, because the plaque stands on a stake in soil. `scripts/real-photos/tree.py`
  briefs Codex from the designer stencil, with metal caps and aged brass recoloured to cream, used as a layout guide.
  It follows the memorial page's signed-off tree tile, plus the later rules: level board, true 1.5 mm plate and 15 mm
  board, flat caps, plain settings.
- Cuthbert and Okafor use `garden_scene.py` layouts (boards sized plate + 25 mm), as on the other pages.
- Versions: feed images and PDFs `?v=10`.

Kept versions: cherry v1, apple v1, oak v1, school v1, birch v2, Cuthbert v1, Okafor v2 (flatter caps). Square crops
of the cherry use `crop_x` 0.49 so the whole board shows.

Working files: `workspace/output/instaplaque-tree-memorial-20261025/`.
