# Tree page photos redone on the Gemini key — 24 October 2026

## Update, about 07:10 UTC: made with the designer's built-in realistic preview

- **Request:** at 06:50 (msg 5796) the owner asked: "Did you use the plaques Ai thing that has the ai image stuff built in I mean? It makes way better results that way". The close-ups below used my own prompt and a plate face drawn by `make_refs.py`, so all ten were remade.
- **How they were made:**
  - **Plate face:** the designer's own stencil. `output/catalogue-wording/render-wording-stencils.cjs` runs `PlaquePreview` and `svgToPngBase64` on the Vite dev server, from `closeups-wording.json` (in the VPS work folder). Each entry copies the A5 light-oak catalogue offer (`brushed-brass-` or `brushed-stainless-210x148-rect-light-wood-plaque`) with the photo's border.
  - **Photo:** `scripts/generate-tree-closeups.mjs` bundles `services/geminiService.ts` and calls `generateRealisticView` with the stencil: `gemini-3.1-flash-image-preview` at 4K and 3:2, with the built-in prompt unchanged. The scene brief (`options.prompt`) gives the setting, the close-up framing, no people, and the Nicola mount: one black 30 mm square steel stake under a 235 × 173 mm oak board.
  - Two versions of each, about 25 seconds and $0.15 apiece: about $3.02 in all.
- **Checking:** `check_scenes.py` read all 20 as exact, with four caps, the single stake and no extra text. By eye at full resolution, five versions had black caps where the product has caps in the plate's own metal, so their other version was chosen. The acer's second version had a dark mark on the plate.
- **Compared with the previous set:** the lettering follows the designer's layout exactly, and the metal and oak look more real. The previous set's own drawing put the small last lines in italics, which the designer doesn't, and the acer's "In loving memory of" came out in italics by mistake. The settings, captions and alt text still match.
- **Where they are:** `public/site-images/tree-plaque-photos/memorial-tree-plaque-<tree>.webp` (with `-900` and `-sq`). `tree-plaques/` is removed. The hero and share image is still the cherry.

## Update, about 06:40 UTC: close-ups, no people

- **Request:** at 06:15 (msg 5778) the owner sent the Nicola proof's illustration and said: "Just have them all be regular close ups like this, don't need the whole scene around it".
- **What changed:** the ten photos are now close product shots in that style.
  - The plaque on its oak board and black steel stake fills about half the frame, the young tree's trunk (with tie and support stake) is beside it, and the garden behind is softly blurred. There are no people.
  - Each keeps its own wording, finish and border.
- **How they were made:**
  - The same pipeline and model (Nano Banana 2.1 on the Gemini key), with `SCENES_FILE=tree-closeups.json` and the close-up brief in `gen_scenes.py` (`prompt_closeup`).
  - Two versions of each, plus two more of the oak, which came out too wide. The largest, cleanest one was chosen.
  - The checker read every one as exact, and each choice was checked by eye at full resolution.
  - This round cost about $1.45, about $3.30 for both rounds together.
- **Where they are:** `public/site-images/tree-plaques/memorial-tree-plaque-<tree>.webp` (with `-900` and `-sq`). The `tree-scenes/` folder from the earlier redo is removed.
  - The tree page hero and share image is `memorial-tree-plaque-cherry-sq.webp`.
  - The captions, alt text and sitemap image titles describe the close-ups.

The rest of this note covers the earlier redo, with people, that these close-ups replace.

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
