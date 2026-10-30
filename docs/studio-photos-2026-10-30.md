# Studio photos on the product pages — 30 October 2026

**Owner:** msgs 7739/7742 (29 Oct: "really nice studio product shots instead?", "Just do 5"), 7925 and 7939 (the
Supatedorders Google Cloud route, "another 15"), 7966 ("do batches and update the website for relevant pages each batch").

## What the site does

- `services/studioPhotos.mjs` lists each product with a checked studio photo and the date it went live.
- **Product page:** the gallery leads with the studio photo, then the in-place photo (where the owner signed one off in
  `services/vettedPhotos.mjs`), then the flat design view. The page copy says "the photo" instead of "the drawing" for
  them (`pictureWord`).
- **Cards** (shop-by-size page, product picks) keep an in-place photo where there is one; otherwise they show the studio
  photo instead of the drawing. Category pages' own curated photos are unchanged.
- **Google:** the feed's `image_link` is still the flat drawing (the Shopping picture is unchanged). The studio photo is
  added as the first `additional_image_link`, and listed in `sitemap-products.xml` with that page's lastmod.
- **Files:** `public/site-images/studio-photo/<slug>.webp` (1200 px), `<slug>-600.webp` and `thumbs/<slug>.webp`
  (160 px), from `scripts/publish-studio-photos.py DATE FILE...`, which also adds the slug to the list. Every file
  carries IPTC DigitalSourceType `trainedAlgorithmicMedia` (metadata only), which Google requires for AI images.

## How the photos are made (output/studio-shots-20261029, ignored)

1. `rank_remaining.py`: products without a studio photo, ranked by Shopping impressions since 26 Oct (Ads API, read-only).
2. `make_stencils.sh LIST`: designer-style stencils from each product's flat-drawing layout and example wording.
3. `run-batch-vertex.sh LIST` (with `BUDGET_USD` on the whole `ledger-vertex.jsonl`): the site's own
   `generateRealisticView` on Supatedorders Vertex (supated-orders-bot, gemini-3.1-flash-image, 2K), each image read
   back by the text model and checked for wording, border, fixings, shape, support and backdrop.
4. `finish_batch.py LIST SINCE OUTDIR`: true proportions (`fix_shape.py`, not for angled wood shots), square 1600 px
   (`pad_square.py`), compare sheets. Every photo is then checked by eye before publishing.

## Checks

- `check-product-policies.mjs` (postbuild): every listed page leads with its studio photo, all three files exist and
  carry the IPTC tag, the drawing is still on the page, the feed and product sitemap list the photo.
- `check-merchant-browser.cjs`: lead image is studio photo, else signed-off photo, else drawing.
- Release check: `output/studio-shots-20261029/site-diff/verify_studio_live.py` (live pages, byte-identical files,
  tags, feed, sitemap) and `verify_live.py`.

## Releases

| Batch | Photos | Deployment | Live (UTC) | Rollback |
| --- | --- | --- | --- | --- |
| First 20 (5 approved + 15) | 20 | dpl_AMZz5o9XoDh5saD2hU74mD5rvEjq (instaplaque-rcj72p6kq, `index-B9d3Z3kt.js`) | 30 Oct 15:35 | dpl_8HeMejLdG48U8XTAEzTLF4DuwHtB |

Rollback: `vercel promote <rollback id> --yes --scope dullaghan31-3959s-projects`. To drop one photo, remove its
slug from `services/studioPhotos.mjs` and redeploy (the page falls back to its previous picture).
