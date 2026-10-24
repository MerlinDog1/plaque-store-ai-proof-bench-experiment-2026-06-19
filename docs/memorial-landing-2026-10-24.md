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

The page is staged only, waiting for the owner's go. Once promoted, record the deployment id here.

**Rollback:** `vercel promote dpl_6ZY8UAg58abxM8VaKWRreKWMxQBY --yes --scope dullaghan31-3959s-projects`. That is the homepage-tidy release, live before this one.
