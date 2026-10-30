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
   back by the text model and checked for wording, border, fixings, shape, support and backdrop. `vertex-shim.mjs`
   fetches a fresh gcloud token and repeats the call when a token runs out mid-chunk (a 401 cost batch 2 one product;
   batch 3 renewed twice without losing any).
4. `finish_batch.py LIST SINCE OUTDIR`: true proportions (`fix_shape.py`, not for angled wood shots), square 1600 px
   (`pad_square.py`), compare sheets. Every photo is then checked by eye before publishing.

Products sold without a border (`output/catalogue-wording/border-styles.json` `border: false`) are briefed and checked
for no border line (batch 1 found the check still asking them for the preset's double rule). A photo the check failed
wrongly is re-judged in the ledger by eye with a note and no charge, never regenerated.

## Checks

- `check-product-policies.mjs` (postbuild): every listed page leads with its studio photo, all three files exist and
  carry the IPTC tag, the drawing is still on the page, the feed and product sitemap list the photo.
- `check-merchant-browser.cjs`: lead image is studio photo, else signed-off photo, else drawing. It checks nothing until
  React owns the product hero: the app replaces the prerendered hero when it mounts (gone for 25-90 ms, live too), so a
  read in that gap finds no thumbnails (batch 3), and the prerendered Design link is a plain `/design` until then, so an
  early click opens the default A5 designer (£95.50) instead of the product.
- Release check: `output/studio-shots-20261029/site-diff/verify_studio_live.py` (live pages, byte-identical files,
  tags, feed, sitemap) and `verify_live.py`. Both retry a dropped connection twice and print `RETRY` (the VPS saw a few
  resets from the live site on 30 Oct; an HTTP error is never retried).

## Releases

| Batch | Photos | Deployment | Live (UTC) | Rollback |
| --- | --- | --- | --- | --- |
| First 20 (5 approved + 15) | 20 | dpl_AMZz5o9XoDh5saD2hU74mD5rvEjq (instaplaque-rcj72p6kq, `index-B9d3Z3kt.js`) | 30 Oct 15:35 | dpl_8HeMejLdG48U8XTAEzTLF4DuwHtB |
| Batch 1 (`batch-b1.json`) | 18 of 20 (polished brass 200 × 50 and brushed stainless 400 × 300 on dark wood retried in batch 2) | dpl_HmPAwVZWVNQuCkw9a1PMeSHErZ9q (instaplaque-q569kv964, `index-DzJJBsQm.js`) | 30 Oct 16:21 | dpl_AMZz5o9XoDh5saD2hU74mD5rvEjq |
| Batch 2 (`batch-b2-run.json`: 20 + the 2 batch 1 retries) | 17 of 22 (polished brass 400 × 300 held back by eye for a blurred reflection and polished stainless 148 × 210 on dark wood lost to an expired token, both retried in batch 3; polished brass 200 × 50, polished stainless 200 × 50 and brushed stainless 150 × 50 drawn too short, left for a different approach) | dpl_9CqqEUhEejrrzoGtge82m2c3tebn (instaplaque-mdznf6y0m, `index-7F9eLkre.js`) | 30 Oct 17:03 | dpl_HmPAwVZWVNQuCkw9a1PMeSHErZ9q |
| Batch 3 (`batch-b3-run.json`: 20 + the 2 batch 2 retries) | 21 of 22 (aged brass 200 × 50 drawn about 3.2:1 instead of 4:1, left with the other thin strips) | dpl_F6FuTXhLZhGgrWGg9DqYbjhohR97 (instaplaque-6h62dlwru, `index-DkugMOWZ.js`) | 30 Oct 18:14 | dpl_9CqqEUhEejrrzoGtge82m2c3tebn |
| Batch 4 (`batch-b4.json`) | 18 of 20 (brushed brass 148 × 210 on dark wood failed twice, a softbox in shot; brushed brass 210 × 297 on light wood held back by eye for a hard light streak behind it, retried in batch 5) | dpl_2oYaGf23ugiDuZJe77exQNrWwqNv (instaplaque-6z6u0v6z3, `index-UEWmYL9g.js`) | 30 Oct 18:30 | dpl_F6FuTXhLZhGgrWGg9DqYbjhohR97 |
| Batch 5 (`batch-b5-run.json`: 19 of `batch-b5.json` without the 4:1 brushed stainless 200 × 50, + the batch 4 retry) | 19 of 20 (brushed stainless 225 × 65 failed twice, screws over the border then drawn 2.84:1, on hold with the thin strips) | dpl_4SPrU38DTfA3N2QRTChe213Ng14V (instaplaque-hq308n5z5, `index-DPinTCvU.js`) | 30 Oct 18:56 | dpl_2oYaGf23ugiDuZJe77exQNrWwqNv |
| Batch 6 (`batch-b6-run.json`: 20 + the batch 4 retry) | 20 of 21 (polished brass 148 × 210 on light wood failed twice, an easel then a softbox in shot, retried in batch 7) | dpl_BR2t7famYuraRKjU9XuKPi2UTJy4 (instaplaque-ml4fkz1h7, `index-FrvLk0Ah.js`) | 30 Oct 19:28 | dpl_4SPrU38DTfA3N2QRTChe213Ng14V |
| Batch 7 (`batch-b7-run.json`: 20 + the batch 6 retry) | 21 of 21 | dpl_HTqhXUMVxXJZMr12F41LtyaLeRqj (instaplaque-6dlhptdvm, `index-CSPfq57Z.js`) | 30 Oct 19:53 | dpl_BR2t7famYuraRKjU9XuKPi2UTJy4 |
| Batch 8 (`batch-b8.json`, the round and oval plates) | 11 of 13 (orbital brass round 200 × 200 held back by eye: a spun, turned grain with a bright cone instead of the matt orbital haze; polished stainless 400 × 300 on light wood failed twice, then twice more in `batch-b9-run.json`; both retried in `batch-b10-run.json`) | dpl_Gc3XsAhVHDbRu4qfXbLZAAtAKZgZ (instaplaque-axk4f1esl, `index-BHQV5tou.js`) | 30 Oct 20:08 | dpl_HTqhXUMVxXJZMr12F41LtyaLeRqj |
| Last redos (`batch-b10-run.json`, `batch-b11-run.json`) | 2 of 2 (polished stainless 400 × 300 on light wood v6, orbital brass round 200 × 200 v5) | dpl_sU9UTr4ZoqiSngGZXdnoZuWtRDbx (instaplaque-5vb35oan3, `index-CCY4XCzT.js`) | 30 Oct 20:42 | dpl_Gc3XsAhVHDbRu4qfXbLZAAtAKZgZ |

**Where it ended (30 Oct, 20:42):** 167 of 175 product pages lead with a studio photo; all 175 passed
`check-merchant-browser.cjs` (run in 3 chunks of 59: one browser for all 175 outgrows the 1 GiB job cap). Without one:

- Six thin strips the image model keeps drawing too short (or with screws over the border): polished brass,
  polished stainless and aged brass 200 × 50, brushed stainless 150 × 50 and 225 × 65 (2-4 tries each), and brushed
  stainless 200 × 50 (left out after the other 4:1 strips failed). They need a different approach, not more tries.
- The A5 brushed steel plaque and the polished brass bench plaque 200 × 100: their feed images are already photographs
  (`imageKind: 'ai'`), so they were never in the drawing-replacement batches; the A5 leads with its signed-off photo.

Cost on the Supatedorders Vertex ledger (`ledger-vertex.jsonl`, every studio photo made on Vertex since 30 Oct 14:02):
$23.63 for 234 images.

Rollback: `vercel promote <rollback id> --yes --scope dullaghan31-3959s-projects`. To drop one photo, remove its
slug from `services/studioPhotos.mjs` and redeploy (the page falls back to its previous picture).
