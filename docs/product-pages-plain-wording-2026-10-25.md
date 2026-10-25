# Product pages: plain wording, drawings instead of unchecked photos (25 Oct 2026)

## Why

The owner (msg 6270): "a lot of plaque text sucks balls. Like it doesn't seem natural at all and I'm also concerned
at how many images there are now as too many realistically for me to root out the bad ones". After the nine category
pages were redone (all photos seen by the owner, plain wording), 138 product pages still showed photos from 21–24 Oct
that the owner had never checked, with the old story wording ("always first to the bar", invented towns, church
fittings, club honours). Plan A (msg 6326, under the owner's "Do what ever you think best", msg 6281): plain wording on
every product page, and the exact flat drawing instead of an unchecked photo. Merging the product pages into about 17
size pages comes later.

## What changed

- **Photos.** `services/vettedPhotos.mjs` lists the 36 product photos the owner has seen: those on the category pages,
  the memorial page's signed-off round-2 picks, and crops of top photos or tiles shown to the owner. Only these
  products link a catalogue photo (`photo` in `services/commerce.ts`). The other 137 render products lead with the
  flat drawing (`ShopProduct` hero, versioned with `merchantImageQuery`), and the size page and pick cards fall back
  to the versioned drawing. The unchecked photo files stay in `public/` but are not linked; to bring one back, show it
  to the owner and add its slug.
- **Wording.** 138 products have new example wording from
  `workspace/output/instaplaque-product-pages-20261025/plain_wording.py` (seeded, so reruns are identical):
  - memorials "In loving memory of / NAME / dates", about one in four with one plain extra line;
  - couples with both sets of dates;
  - pets, trees, rooms ("THE … ROOM / Opened on …"), building openings and two house names;
  - every name new to the site; long names, room names and tree names split over two lines where a single line
    made the lettering small (13 redrawn after the first pass).
  The 28 bench sizes use the bench rule. 18 portrait flags were dropped, because the drawings carry no portrait.
- **Text.** Product copy says "drawing" instead of "photo" where there is no photo (`pictureWord` in
  `services/catalogueContent.ts`; the example section in `CatalogueDetails.tsx`). `export_examples.py` takes an
  entry's own `use`.
- **Drawings, thumbs and PDFs.** All 138 were redrawn: `feed_layouts.cjs`, `publish-codex-photos.py thumbs`,
  `product_proof.py` + `render_products.mjs` (138 rendered, 0 layout issues). Feed images and PDF links are now
  `?v=11`.
- **Checks.** `check-product-policies.mjs` requires a photo only for vetted products. For the others it requires the
  versioned drawing and no linked catalogue photo.

## Lettering sizes

Smallest lettering, from `output/catalogue-wording/layouts/`: bench plates 6.5–6.8 mm (the signed-off Joan Parry and
Tom & Betty plates have 5.9 and 5.6 mm), A4 and larger 8 mm or more. No plate is under 6 mm after the second pass.
