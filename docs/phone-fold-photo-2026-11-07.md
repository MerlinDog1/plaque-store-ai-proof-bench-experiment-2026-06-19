# InstaPlaque bigger phone photo — v2 PREVIEW ONLY

7 November 2026. This changes only the phone product presentation from v1. Nothing deployed/promoted to production; no Stripe sessions (live or test), orders, DB writes, messages, Merchant or Ads changes.

## Preview and source

- Home: https://instaplaque-al102u7s8-dullaghan31-3959s-projects.vercel.app
- Bench strip: https://instaplaque-al102u7s8-dullaghan31-3959s-projects.vercel.app/brushed-stainless-150x65-rect-plaque
- A5 brass: https://instaplaque-al102u7s8-dullaghan31-3959s-projects.vercel.app/brushed-brass-210x148-rect-plaque
- Wood-backed: https://instaplaque-al102u7s8-dullaghan31-3959s-projects.vercel.app/brushed-stainless-210x148-rect-dark-wood-plaque
- Designer: https://instaplaque-al102u7s8-dullaghan31-3959s-projects.vercel.app/design

Ready, target **preview**, **deployment id: dpl_C2UB3G3ACxikhbAKp8bqSH5jB3wN**. Application commit **c0fb82b59dea618ceee277b58a34aa944bf68707**. Vercel SSO protection: see `preview-access-v2.json`. Immediate receipt: `PREVIEW2-READY.txt`.

Branch **codex/instaplaque-phone-fold-photo-20261107**, created from `48e2c5c5ebc7784b9943b9a688695951b0bec544` in the existing task worktree. V1 branch and deployment remain intact (`dpl_E88Xp4Ym9rXGcF7gCrM9w7KFh9cC`). Production remains `dpl_DyTwtgWCmASKbePetzNnczHsHsG1`; `production-before-v2.txt` and final reinspection record this.

## What changed

- Below 768px only: gallery thumbnails now follow the free-proof line, after both CTAs. The example-inscription caption is directly under the main photo. Relocated controls are real shared-state buttons; selecting them changes the main image.
- The image remains first and uses **object-fit: contain**, never cropping any product. Larger photo clamp: `clamp(195px, 100svh - 407px, 380px)`; below 390px, `clamp(180px, 100svh - 430px, 360px)` leaves space for longer titles and the taller 360px cookie notice.
- Product-only phone header/breadcrumb spacing is tighter; price margins shrink by 2px. Photo box heights are **210 / 237 / 257 / 325 / 333px** at the five tested viewports, versus v1 **126 / 153 / 150 / 218 / 220px**.
- No copy, price, H1, SEO, catalogue/feed/sitemap, cookie wording/dimensions, attribution or designer changes. At 768px and 1440px, product screenshots are pixel-identical to v1 (and v1 was identical to live).

## Rendered plaque widths

CSS pixels. Each cell is **outer plaque width (photo box height)**. Wood includes the board. These are actual image-content scale estimates, not simply the width of the full image element. Outer edges were hand-checked in 480px reference copies: bench x32–449, A5 x27–454, wood x20–457; width accuracy is approximately 1–2 source pixels. Ratios use the same asset/landmarks and are exact scale comparisons.

The live photo uses **cover**, whereas v1/v2 use **contain**. Therefore the earlier 54%/59% estimates based on box heights overstated v1's actual plaque width. Here bitmap width uses max(box width, aspect-corrected height) for live and min for v1/v2. V2 achieves **75.1% of live width at 390×664**, and **71.3% more plaque width than v1** there.

| Viewport | Product | Live width (box height) | V1 width (box height) | V2 width (box height) | V2/live |
|---|---|---:|---:|---:|---:|
| 360×640 | Bench strip | 271.1 (234.0) | 109.5 (126.0) | 182.4 (210.0) | 67.3% |
| 360×640 | A5 brass | 277.6 (234.0) | 112.1 (126.0) | 186.8 (210.0) | 67.3% |
| 360×640 | Wood-backed | 284.1 (234.0) | 114.7 (126.0) | 191.2 (210.0) | 67.3% |
| 375×667 | Bench strip | 284.1 (245.2) | 132.9 (153.0) | 205.9 (237.0) | 72.5% |
| 375×667 | A5 brass | 290.9 (245.2) | 136.1 (153.0) | 210.8 (237.0) | 72.5% |
| 375×667 | Wood-backed | 297.7 (245.2) | 139.3 (153.0) | 215.8 (237.0) | 72.5% |
| 390×664 | Bench strip | 297.1 (256.5) | 130.3 (150.0) | 223.3 (257.0) | 75.1% |
| 390×664 | A5 brass | 304.2 (256.5) | 133.4 (150.0) | 228.6 (257.0) | 75.1% |
| 390×664 | Wood-backed | 311.4 (256.5) | 136.6 (150.0) | 234.0 (257.0) | 75.1% |
| 412×732 | Bench strip | 316.2 (273.0) | 189.4 (218.0) | 282.3 (325.0) | 89.3% |
| 412×732 | A5 brass | 323.8 (273.0) | 193.9 (218.0) | 289.1 (325.0) | 89.3% |
| 412×732 | Wood-backed | 331.4 (273.0) | 198.5 (218.0) | 295.9 (325.0) | 89.3% |
| 430×740 | Bench strip | 331.9 (286.5) | 191.1 (220.0) | 289.3 (333.0) | 87.2% |
| 430×740 | A5 brass | 339.8 (286.5) | 195.7 (220.0) | 296.2 (333.0) | 87.2% |
| 430×740 | Wood-backed | 347.8 (286.5) | 200.3 (220.0) | 303.2 (333.0) | 87.2% |

## First-screen geometry

Price and **both** side-by-side CTAs are fully in the viewport and above the unchanged notice. Position ranges cover the three photographed products; worst gap covers all 175 exact titles, including the longest wood-backed H1, at each size.

| Viewport | Price top | Both CTAs top → bottom | Cookie top | Worst gap, all 175 titles |
|---|---:|---:|---:|---:|
| 360×640 | 402.5–427.2 | 446.1–470.8 → 496.1–520.8 | 531.0 | 10.23 |
| 375×667 | 429.5–454.2 | 473.1–497.8 → 523.1–547.8 | 578.2 | 30.48 |
| 390×664 | 449.5 | 493.1 → 543.1 | 575.2 | 32.11 |
| 412×732 | 517.5 | 561.1 → 611.1 | 643.2 | 32.11 |
| 430×740 | 525.5 | 569.1 → 619.1 | 651.2 | 32.11 |

All hit tests use centre plus four inset corners; targets must receive the hit, lie fully in the viewport and not overlap the notice. The relocated thumbnails are intentionally below the first-screen purchase choices, not required above the notice. No text was shortened.

## Evidence and checks

Paths are relative to workspace `output/instaplaque-phone-fold-source-20261107/` unless noted.

- `photo-v2/`: 18 live/v1/v2 first-screen JPGs (360 and 390, three products), plus six side-by-side `comparison-*` JPGs; `photo-widths.json` has all 45 measurements. Live baseline is the immutable original live-source build; v1 is its preserved compiled artifact, both served locally with the unchanged public assets.
- `photo-v2/all-title-fit.json`: **875/875** title/viewport cases pass (175 exact H1s substituted into the shared product template at each of five widths). `scripts/check-phone-photo.mjs` also checks caption placement, thumbnail order and actual thumbnail selection on the three products at all sizes. This is shared-template/title coverage, not 875 separate network page navigations.
- `local-v2/` and `after-build-v2/`: **27/27** fresh-visitor screens and hit tests pass, covering 15 product screens, ten designer screens (size + wording), tablet 768 and desktop 1440. `phone-fold-built-v2.log` records the compiled build result.
- Hosted matrix: **27/27 PASS**, zero page errors/failures. `hosted-v2/` and `hosted-v2.log` record the actual preview's 27 screens and hit tests; every geometry/hit-test object exactly matches the compiled local result (`hosted-geometry-parity-v2.json`). Hosted requests are GET-only, paced and cached; analytics and every API/non-GET request are blocked.
- `cookie-designer-parity-v2.json`: cookie text/rectangles unchanged across all 27 cases; all ten designer geometry/hit-test objects exactly match v1. `pixel-parity-v2.json`: tablet/desktop pixel-identical; eight of ten designer screenshots identical, two differ only in small plaque-preview rendering regions, not controls/geometry. Designer code/CSS was not changed.
- `typecheck-v2.log`: **PASS**. `build-v2.log`: full build + all postbuild guards **PASS**. Vercel's same build/postbuild also passes (`deploy-preview-v2.log`).
- `attribution-unit-v2.log`: **27/27 PASS**. `attribution-browser-v2.log` and `intercepted-checkout-v2.json`: **three intercepted end-to-end flows PASS**, including `?utm_source=google&utm_medium=cpc&gclid=TEST`, Shopping and Instagram. No real AI/proof/checkout/order/email or DB request.
- `seo-parity-v2.json`: **all 175** title, description, canonical, H1 and JSON-LD fields match the live capture; Merchant feed and both sitemap SHA-256 hashes match live. `raw-seo-tag-parity-v2.json`: byte-identical raw tags for all 175 against the live-source build. Public/legal/catalogue files are unchanged in Git.
- V1's broader suite remains documented in `REPORT.md`: 35/44 commands passed; nine pre-existing failures were reproduced on baseline, including absent generic `npm run check`, stale browser fixtures/selectors and a decorative-alt assertion. V2 reran the requested relevant suites and full postbuild, not those unrelated known-failing commands.

## Attribution retained without changes

Memory-only first-arrival UTMs, click IDs, referrer hostname, landing path and derived label; sanitized `storefront_orders.metadata.attribution`, Stripe label/campaign, admin label. No attribution cookies/device storage. **G = Google ads/Shopping; F = Facebook/Instagram; O = organic; D = direct/unknown; R = other referral; B = Bing/Microsoft ads.** WhatsApp/mail/free-proof references retain v1 suffix handling.

No live or test checkout sessions or DB writes were made for v2. Database persistence remains deliberately unproven by a write. V1's privacy disclosure is still a proposal only; no legal text changed. Full reload/new tab resets memory attribution and source signals are hints, as documented in the v1 report.

## Caveats and release

- Browser emulation with fresh consent state, not physical iPhone/Safari testing. Layout verified at the requested 640–740px heights. At 360×640 the longest title leaves 10.23px clearance; substantially shorter screens or large accessibility text may need scrolling.
- The 75% target is met at 390; the smaller 360 viewport reaches 67.3% while preserving the longest title, both full-size CTAs and the larger unchanged cookie notice. Tall-phone photos grow beyond v1's 220px cap.
- Vercel preview is protected; owner sign-in is needed. The official CLI's temporary preview-only header is used for hosted checks and removed afterward. No secret is recorded in evidence.
- Release is **not authorized/performed** by this preview task. Reinspect live source, reconcile changes, then only if instructed stage under `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --prod --skip-domain`, verify before promotion, and promote under the same lock. Never copy preview TEST settings into production.
- Rollback after a future release: promote `dpl_DyTwtgWCmASKbePetzNnczHsHsG1` under the lock. No migration required. Preserve order data.

Only the new v2 branch is pushed. Completion state (remote SHA, clean checkout, no `.env.local`, stopped task servers) is recorded in `final-state-v2.txt`.
