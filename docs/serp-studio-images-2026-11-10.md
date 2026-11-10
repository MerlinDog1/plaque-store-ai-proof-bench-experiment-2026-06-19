# Studio search/share images — 10 November 2026

Owner selected existing studio photographs, not the rejected generated scenes:
Norma Bradshaw stainless 150 × 65 mm for its product page; Jim Partridge's brass
cherry-tree memorial on light oak for the garden category. Owner also selected
all other studio-photographed products for plain studio share images.

## Scope

`services/searchImages.mjs` is the shared server/client mapping. The two primary
pages use 1200-wide 1:1, 4:3 and 16:9 WebP schema images, in that order, and a
1200 × 630 JPEG for Open Graph/Twitter. Their WebPage schema names the square
ImageObject as primaryImageOfPage. Only their sitemap entries gain a new square
image and 2026-11-10 lastmod; existing sitemap images remain.

All 167 studio-photographed product pages use their own plain OG JPEG. The
other eight products keep their previous share image. Part B changes no extra
schema or sitemap entries. Garden reuses its oak product's JPEG. Other category
pages and the homepage retain their branded share cards; removing garden from
`ogImageSlugs` also removes it from future branded-card regeneration.

There are 173 shipped images: 167 JPEGs plus six WebPs. Stainless uses its
existing square composition / centered wide crops. Other studio photos are
scaled down, centered and padded by extending the original studio backdrop.
No artwork is enlarged, no plate/board/fixings are cropped, and the conservative
source-frame margin is at least 7% for padding (stainless plate >=6%).
WebPs use quality 85; JPEGs quality 90. Every derivative carries the original
IPTC DigitalSourceType `trainedAlgorithmicMedia`.

Page photos, hero/cards, layout, wording, prices, offers, ratings and Merchant
feed bytes are unchanged. The existing feed already uses studio photos for
167 products, with their drawing as the first additional image.

## Reproduction and checks

`python3 scripts/serp-studio/export.py OUTPUT_DIRECTORY` exports all studio OGs
and the primary/alternative schema ratios from `public/site-images/studio-photo`.
Requires Pillow, NumPy, SciPy and ExifTool. It reuses `publish-codex-photos.py`'s
IPTC tagger. The unselected circle schema alternatives stay in release evidence,
not public assets; its OG is shipped for the circle product under Part B.

`npm run check:serp-images` is in postbuild. It verifies the primary metadata,
schema and sitemap, all studio-product share metadata, all shipped image file
headers/dimensions/IPTC labels and recorded conservative margins, and that other
category share images stay branded. `scripts/serp-studio/manifest.json` records
per-file transformations; export review contact sheets and 100% lettering crops
are in the release evidence folder.

Release evidence: `output/instaplaque-serp-studio-release-20261110/` outside Git.
Local comparisons normalize only shared fingerprinted JS/CSS asset references;
all remaining untouched HTML and all feed bytes must match fa757f7. Exact pixel
comparisons use 390 and 1440 locally. Hosted checks fully verify the two primary
pages and eight images, sample three other product pages/JPEGs, compare both
sitemaps and the feed, and compare primary pages at 390 with zero tolerance.

## Release and undo

Build and stage only with the production target and `--skip-domain`; the helper
must not promote or assign domains. The staged URL and exact final checks live
in the release receipts, not in this source documentation. Until Cody promotes,
production remains deployment `dpl_35tTzQzGs6traHXgT5Yz2mntHrg9` (fa757f7).

After a promoted release, code rollback is promotion of that previous deployment
under the existing release lock. Source-only rollback reverts the Part B and
Part A application commits together (including new guard and assets); the
separate documentation commit may remain. No database or feed migration exists.
Google still needs to re-crawl the two URLs; Cody can provide Request indexing
steps after go-live. Metadata guides, but does not guarantee, Google's thumbnail.
