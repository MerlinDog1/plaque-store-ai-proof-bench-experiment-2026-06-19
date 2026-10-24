# Overnight catalogue and contact upgrade — 23–24 October 2026

The owner asked for this in Telegram msg 5736 on 23 Oct:
- finish every catalogue photo, each with its own wording
- add tree-planting and garden memorial scenes with made-up people (never the Nicola order photo)
- add more portrait work, on A5 and larger only
- make every page better for getting in touch and for Google, and say clearly "we can make whatever you want via WhatsApp"
- use Codex image generation if the quality compares, spend at most £15 on the Gemini key, and set up Shopping and a few days of stronger search ads without starting any campaign

Branch `codex/instaplaque-overnight-20261023`, built on `b0f2970`, which is the live 23 Oct "Design on WhatsApp" release (`cfa4e94`) plus docs.

## Pages and copy

- **Product pages (175):**
  - Each page now has its own example wording, ideas and size advice (`services/catalogueContent.ts`, generated `services/catalogueExamples.ts`).
  - Six product-specific questions replace the block that was repeated on every page.
  - The alt text uses the example wording.
  - Portrait plaques on A5 and larger have an "Add a portrait" section with real examples.
- **WhatsApp:**
  - A "Tell us what you want. We'll make it." band (`CustomAnything`) on the home, category and product pages.
  - The contact page says we can make almost anything.
- **New pages:**
  - `/tree-memorial-plaques`, with the scene photos. `/tree-plaques` redirects to it.
  - `/plaque-sizes`, a hub of every size with photos.
  - `/memorial-plaque-wording`, a wording guide.
- **Existing pages:** photo picks on the garden, tree, memorial, bench, brass, stainless and custom pages, and a richer `/faq`.
- **For Google:**
  - Feed titles and descriptions are per product, and the feed carries `additional_image_link`.
  - `sitemap-products.xml` lists the 175 product URLs with lastmod and images.
  - `llms.txt` is updated, the IndexNow key file is published, and `check-live-seo` now expects 24 URLs.

## Images

All images were made on the ChatGPT subscription (Codex, gpt-image-2). The Gemini key was not used, so the spend is £0.

- **Catalogue photos:** 173, one per render offer (168 queued plus 5 earlier samples), each showing that plaque's own wording, border and fixings.
  - Every photo was checked by eye for wording, shape, finish, lettering colour, board, border and fixings.
  - Two are a little wider than their true shape:
    - `polished-stainless-150x75-rect-plaque` (EDNA WOOD) is about 2.3:1 instead of 2:1, the best of 5 attempts.
    - `orbital-brass-matt-lacquer-297x210-rect-plaque` (the Winterbottom couple) is about 1.6:1 instead of 1.41:1, the best of 4.
  - **Portraits:** 22 portrait plaques on A5 and larger, with made-up people and pets.
    - The artwork came from `output/catalogue-wording/portraits.py`, traced with potrace into the designer's engraved-image layer.
    - Two traces were over the site's 1,000,000-character SVG limit (`MAX_PROOF_SVG_CHARS`), so the designer showed its placeholder head. They were re-traced with coarser coordinates. `portraits.py` now does this automatically.
    - The photos of those two were made from stencils without the portrait, so their faces were drawn from the written description. They differ from the traced face in the flat image and PDF.
- **Flat images:** `public/site-images/merchant/<slug>.jpg` were redrawn from the designer with each plaque's wording, border and portrait (`render-feed-images.cjs`). They are the feed `image_link`, the Product schema image and the second gallery image.
- **Garden scenes:** 10 in `public/site-images/scenes/`, with invented families, a school, allotment volunteers and a couple with a dog.
  - Six were redone once because the first attempt drew black caps.
  - `scene-01-family-cherry-sq.webp` is the tree page hero.
- **Sample proof PDFs:** all 175 were regenerated from the designer's own layout (`layouts/`), so each PDF shows its photo's wording, border and portrait.

## New URLs for redrawn files

Phones, and Google, keep same-name copies of redrawn files. On 20 Oct this made the owner think a release had not worked.

- Photos moved to `/site-images/catalogue-photo/`. The old `/site-images/merchant-photo/` folder, which held the ALEX MORGAN pictures, is removed.
- Sample PDF links carry `?v=2` (`samplePdfFor`).
- The flat image URLs that Google reads carry `merchantImageQuery = '?v=2'` (`services/merchantCatalogue.mjs`). This covers the feed `image_link`, the Product schema and the image sitemap. Bump it whenever those images are redrawn in place.

## Ads (nothing started)

- The Shopping campaign `24390273287` is PAUSED, at £10/day until 8 Nov.
- Five GA4 contact events are secondary conversions.
- The stronger search campaign script is ready but not created: `projects/instaplaque-google-ads-memorial-20261009/scripts/build-overnight-campaigns.py`. It waits for the tree page to be live.

## Release

See HANDOVER.md for the candidate deployment, the checks and the rollback. The release is promoted only after the owner has seen it, as promised before msg 5736.
