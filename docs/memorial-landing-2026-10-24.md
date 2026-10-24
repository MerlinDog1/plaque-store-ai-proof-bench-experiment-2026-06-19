# Memorial plaques page rebuilt as a phone-first landing page, and the yardstick (24 Oct 2026)

Owner msg 5876 (11:00 UTC): "OK make memorial page amazing and then use as yardstick to measure against other pages".

`/memorial-plaques` is the main ad landing page:
- 1,290 of 2,430 pilot ad views, 10–23 Oct
- Google rated its landing page "below average" on every main keyword
- 93% of ad views were on phones

## What changed

`ShopProduct` hands the memorial page to `MemorialLanding` in `components/CategoryLanding.tsx`. The sections are reusable for the other category pages; their CSS is the `cat-` block at the end of `shopfront.css`.

1. **Hero (`CategoryHero`).** Fits on the first phone screen:
   - the H1 "Personalised memorial plaques"
   - an in-place photo
   - "from £95.50" with what that covers
   - Design online / Design on WhatsApp
   - "Prefer us to design it?"
   - four ticks and the SEO intro

   The photo is made with the designer's built-in realistic preview from the catalogue stencil of `polished-brass-297x210-rect-plaque`, with the caps repainted in metal (Charlotte May Pemberton on a stone wall). Its caption gives that plaque's price and links to it. Phones show it full-bleed under the headline, desktops beside the copy. The src, srcset and sizes are identical, so there is one download and one React preload.
2. **"Where will it go?" (`PlaceRoutes`).** Four photo tiles:
   - bench → /bench-plaques
   - garden → /garden-plaques
   - tree → /tree-memorial-plaques
   - wall → /brushed-brass-210x148-rect-plaque, the exact plaque in the photo
3. **Product picks.** The existing 8 memorial picks; phones show 6. Anchor `#memorial-picks`.
4. **Sizes (`SizeLadder`, `#memorial-sizes`).** Four plates drawn to scale with their exact prices.
5. **Metal and fitting (`GuideAccordion`, `#memorial-materials`).** The four `seoSections`, folded.
6. **How it works (`OrderSteps`, `#how-it-works`).** Three steps, both buttons, and the "Tell us what you want. We'll make it." line, once.
7. **Portrait strip (`PortraitStrip`).** Four tree plaques with portraits made by Portraits in Metal's own process (owner msgs 5816/5830).
8. **Quality and proof.** The homepage quality section and the sample proof.
9. **Wording ideas (`WordingIdeas`, `#memorial-wording`).** Shown as small brass plaques.
10. **Close.** FAQ (`#memorial-questions`), the closing buttons and the mobile contact bar.

**What stays the same:**
- URL, title, description and canonical
- The FAQ list that the prerendered FAQPage schema is built from
- No Product schema on the category page
- The anchors other pages link to

**Removed:** the old memorial-only branches of `ShopProduct`, and the unused `MemorialSizes`/`MemorialWording`.

**Images:**
- New images are in `public/site-images/memorial/`, written by `scripts/publish-memorial-page-images.py`.
- Each carries IPTC DigitalSourceType trainedAlgorithmicMedia, with no visible label.
- The hero is also available as 800/1200/1600 webp: 113/203/305 KB.

## Checks

- **Vercel build.** Every postbuild check passed: consent, live SEO, designer SEO, product policies, merchant catalogue and feed. Staged candidates:
  - instaplaque-kn96k7tbl (first version)
  - instaplaque-2wx5oi77h (commit 3f90d1d, the compact steps version)
- **Real built app in headless Chrome, phone and desktop.** Checked through a local proxy that fetches the protected candidate with `vercel curl`:
  - no page or console errors and no failed requests
  - the landing renders after the scripts run
  - "Design online" opens /design
- **Phone page length.** 9,755 px, against 10,332 px before. The first product photo with a price is at 1,229 px (screen 2), against 6,065 px (screen 8) before.

## The yardstick

`scripts/check-landing-yardstick.cjs OUT_DIR name=URL ...` loads pages as a phone visitor and records:
- the first screen
- where the priced photos start
- which sections are present
- open guide words and repeated design blocks
- page length and hero bytes

It scores 10 points (½ for partly):
1. First screen: in-place photo, price, both buttons, free proof and UK delivery
2. Priced product photos within 3 screens
3. Sizes with prices
4. Quality section
5. Sample proof
6. Wording ideas
7. No more than 150 words of open guide text
8. "We design it" once
9. No longer than the memorial page
10. Hero no more than 200 KB

Scores on 24 Oct (live pages, against the staged memorial page):

| Page | Score |
|---|---|
| Memorial (new) | 10 |
| Bench | 5.5 |
| Brass | 5.5 |
| Opening | 5 |
| Stainless | 4.5 |
| Portrait | 4.5 |
| Tree | 4 |
| Custom | 4 |
| Memorial (live) | 4 |
| Garden | 2.5 |

The gaps for each page are in the owner report (msg 5898).

**Suggested next:** garden, brass and bench, then tree, stainless, custom and opening, built from the same sections.

## Release and undo

**LIVE at 14:15 UTC on 24 Oct**, at the owner's request (msg 5900, "Put memorial live for me to check properly").
- The staged candidate instaplaque-2wx5oi77h was promoted, and is now **dpl_FSTHn5UUgVz51kQxE1JCwmQ1NNGq** (commit 3f90d1d, bundle `index-CgzGX6S5.js`).
- Before promoting, production was confirmed to still be the homepage-tidy release, so no other change was overwritten.

**Live checks after the promote** (scripts in workspace/output/instaplaque-memorial-page-20261024):
- `verify_memorial_live.py` passed 22 of 22 page checks:
  - title, H1, canonical
  - FAQPage schema, no Product schema
  - the bundle and hero preload
  - all seven anchors and the section headings

  It also checked all 26 linked assets: the 11 memorial images are byte-identical to the repo, and the 15 others are served correctly.
- The overnight `verify_live.py` (BUNDLE=index-CgzGX6S5.js) passed: 175 product pages and 1,061 linked assets identical to the repo, feed 175 items, sitemaps, redirects.
- `check_pages_live.cjs` ran the real app on phone and desktop for memorial, home, bench, garden, brass, tree and a product page. There were no page or console errors, no failed requests and no broken images.
- On the memorial page, "Design online" opens the designer on the memorial preset (A5 brushed brass on dark wood, £165, the same preset as before).

**Rollback:** `vercel promote dpl_6ZY8UAg58abxM8VaKWRreKWMxQBY --yes --scope dullaghan31-3959s-projects`. That is the homepage-tidy release, live before this one.

## Fixes 1, 3 and 4 (owner msg 5906, "Fix134")

The owner asked whether the new page was really a 10 (msg 5903). My honest answer was about a 7, with five gaps; they asked me to fix gaps 1, 3 and 4.

1. **The price jump.**
   - **Problem:** the page said "from £95.50", but the hero photo was the £161.50 polished brass A4, and Design online opened A5 brushed brass on dark wood at £165.
   - **Hero:** now the £95.50 plaque itself: A5 brushed stainless, Margaret Rowley, on the same stone wall with roses.
     - The stencil was rendered by the designer itself through `output/stencil-app` (an esbuild bundle of PlaquePreview + svgToPngBase64, no Vite dev server). Its caps were repainted in metal.
     - The photo comes from the built-in realistic preview.
   - **Designer:** the memorial `preset` is now A5 brushed stainless without wood backing, so Design online opens at £95.50. The garden, tree and other pages that borrow the memorial product open there too. Checked in the staged app: memorial and garden both open at £95.50, 210 × 148 mm, brushed stainless.
3. **Shorter on phones:** 8,251 px, down from 9,755 (and 10,332 before the rebuild). Changes:
   - 4 picks instead of 6
   - sizes as rows
   - compact quality and proof blocks (`compact` props in FeatureSections)
   - the FAQs and the buying guide in one list (`QuestionsAndGuide`; the FAQ schema list is unchanged and comes first)
   - tighter section spacing
4. **Where will it go?**
   - The tiles are now bench, garden, tree and grave:
     - garden: brushed brass 200×150 (Ivy & Sid Moore) on a stone in a flower border
     - grave: aged brass 150×75 (Alice Grant) on an oak cross in a churchyard
   - The wall tile is gone, because wall plaques are the hero and the picks.
   - The new images have new file names, because phones keep old copies of same-name images.
   - The 6 built-in preview images cost about $0.91.

**Status:** staged as instaplaque-5ncih1yyd (commit 372fe63). Every Vercel postbuild check passed. The real app ran with no page errors. The preview was sent as msg 5916. **Not live**: waiting for the owner's go.

**Grave tile corrected** (owner msg 5918, "The grave one doesn't fit on the cross"):
- **Problem:** the 150 × 75 aged brass plaque overhung the cross arm.
- **Fix:** the tile is now a polished brass 150 × 50 (Alice Grant: In loving memory of / 1933 – 2021) that sits wholly on the arm, with oak above and below it.
  - The stencil was rendered with `output/stencil-app`. Its two screw holes were repainted in brass with `metal_screws.py`, in workspace/output/instaplaque-memorial-page-20261024.
  - The scene brief states the fit explicitly: a plaque 50 mm tall on an arm 100 mm tall, with no overhang.
  - All 3 built-in previews fitted. I picked v1. Cost about $0.45.
- New file `route-grave-cross.webp`. The tile links to polished-brass-150x50-rect-plaque (from £63.50).
- Staged as instaplaque-n5xyr1uoh (commit b4cb580): postbuild checks passed, the app ran with no errors, and the designer opens at £95.50.
- The corrected preview was sent as msg 5922. **Not live**: waiting for the go.
