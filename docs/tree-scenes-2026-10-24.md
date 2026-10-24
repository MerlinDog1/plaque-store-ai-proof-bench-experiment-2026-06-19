# Tree page photos redone on the Gemini key — 24 October 2026

## Request

The owner's msg 5762 (05:41 UTC), about https://instaplaque.co.uk/tree-memorial-plaques: "Use gemini key for these. You have a bunch that make zero sense. Use always the same backing board stake combo as nicola order".

## What was wrong

The overnight Codex scenes showed plaques about three times too big. Their mountings changed from photo to photo: a gatepost, a sleeper, the side of a planter, and a volunteer drilling into a post. Sizes ran from A5 to A4.

## The mount now used in every photo

This is the setup of the Nicola order (IP-2778619BBA). The order's wording and photo were not used anywhere.

- **Plate:** an A5 plate (210 × 148 mm) with four flat round caps.
- **Board:** fixed to a solid honey oak board, 235 × 173 mm and about 20 mm thick. This is the same size as the site's A5 wood backing.
- **Stake:** the board stands on one chunky black powder-coated steel ground stake, a 30 mm square bar with a bracket on the back of the board.
- **Placement:** the stake is pushed into the ground at the foot of the tree, and the board's top edge is at about knee height.

## How the photos were made

The scripts are on the VPS in `workspace/output/instaplaque-tree-scenes-gemini/`, outside Git.

- **Scenes:** `tree-scenes.json` holds the ten scenes. Each has invented people and its own invented wording: five in brushed stainless steel, five in brushed brass, three with a scalloped border.
- **References:** `make_refs.py` draws the exact plate face in the designer's EB Garamond (the fontsource 5.3.0 WOFF files the site loads). It also draws a front-view reference of the board and stake.
- **Generation:** `gen_scenes.py` runs on InstaPlaque's Development `GEMINI_API_KEY`, via `vercel env run -e development` from `projects/instaplaque`. It sends both references and the scene brief, at 3:2 and 2K.
  - The brief stresses the true scale: a 23.5 cm board, the size of a hardback book.
  - It also says the board has a single square stake and no post, and is never fixed to the tree.
- **Choosing the model:** two scenes were tried on Nano Banana Pro (`gemini-3-pro-image`, about $0.13 a picture) and on Nano Banana 2.1 (`gemini-nano-banana-2.1`, about $0.05).
  - 2.1 kept the border and lettering, and with a sharper brief its caps were real metal discs, not screw heads.
  - Pro dropped the border and changed the font.
  - All ten were made with 2.1, two versions each, plus two extra school versions.
- **Checking:** `check_scenes.py` uses `gemini-3.8-flash` to find each board and read its wording. Every chosen photo was then checked by eye at full resolution for:
  - wording, border, caps, the single stake and scale
  - hands, faces and anything that doesn't make sense
- **Spend:** about $1.90 on the Gemini key, under £1.50.

## Published

- `scripts/publish-codex-photos.py tree ACCEPTED.json` writes `public/site-images/tree-scenes/<slug>.webp` (1536 × 1024), `-900.webp` and `-sq.webp` (1200 × 1200). Each carries IPTC DigitalSourceType trainedAlgorithmicMedia.
- The new folder means phones and Google fetch the photos fresh. The old `public/site-images/scenes/` folder is removed.
- **Tree page:**
  - All ten photos are new, with captions and alt text describing the oak board and ground stake.
  - The hero and share image is `tree-01-family-cherry-sq.webp`.
  - The meta description, hero copy, the "Fix it beside the tree, not to it" section and the fixing question now describe the stake. They say to ask for it on WhatsApp; no stake price is given.
- **Garden page:** its four tree photos and captions are updated.
- **Elsewhere:** the sitemap image entries, `llms.txt` and the prerendered tree page description are updated.
