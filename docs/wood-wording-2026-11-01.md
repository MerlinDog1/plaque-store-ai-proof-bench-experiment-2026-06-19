# Wood wording — 1 November 2026

## Status and rule

**PREVIEW ONLY; Cody releases.** Based on the explicitly identified live source `753e195`, branch
`codex/instaplaque-template-release-20261101`, in a new worktree/branch
`codex/instaplaque-wood-wording-20261101`. Production remains `dpl_3yA5Qrb7ipZgQaJnKHaMMSEvV3zF`.

Owner msg 8635: describe supplied backing boards, bases and stands as **light solid wood** or **dark solid wood**.
Compact labels, captions, swatches and feed titles may say **light wood** / **dark wood**. When tone is immaterial,
say **a solid wood board**. Never infer or promise a species, or use “hardwood”. Do not mention uncertainty about
species. Actual trees in example inscriptions and the customer's own objects are not claims about our supplied boards.
Keep image filenames, URLs, slugs, item IDs and prices stable.

## What changed

- Category templates and legacy category layouts: the tree kit, size/price sections, cards, swatches, sample captions,
  FAQs, meta descriptions and accessibility labels; light/dark finish options; material stories; the homepage and
  PIM portrait examples displayed on InstaPlaque. `services/commerce.ts` is still the shared FAQ source; all eight
  template pages' visible FAQ answers match FAQPage schema word for word.
- `services/catalogueContent.ts`: all 84 wood-backed catalogue variants get short light/dark wood titles and full
  light/dark solid wood descriptions (also used by Product schema and the Shopping feed).
- Designer: Light wood / Dark wood buttons and a solid wood board description; downloaded customer proofs say
  “Light/Dark solid wood”. `services/geminiService.ts` supplies these names and explicitly forbids inferring a species.
- `server/email.mjs`: wood details say Light/Dark solid wood. Confirmation/proof-copy emails and both internal order
  templates were rendered locally for both tones with synthetic data; no email was sent. Stripe's product title comes
  from `getPlaqueSummaryTitle` (material + size only), already species-free; no Stripe operation or setting change.
- `public/sitemap.xml`: seven image titles changed. This file is the source editorial sitemap; the prerenderer adds
  only the watch/video entry. `public/llms.txt` changed once. All image paths stay unchanged.
- Existing from-price/category-template/browser assertions now expect the owner-requested copy, with a dated reason
  at the top of each changed check. No pricing, dimensions, material options, artwork or checkout logic changed.
- Removed 159 species tokens across changed source (including associated comments/checks): components 99, services 36,
  App comment 1, sitemap/llms 8, build/check scripts 15. This is a source occurrence count, not unique product claims.
- `scripts/real-photos/*.py`, historic photo generators and private `scripts/photo-review/build.py` retain their old
  visual-generation/review wording: their species-bearing strings are not published alt text or captions. Published
  captions/alt text live in the components/data changed above. No images were regenerated. The unused private
  `brass-texture-expander/` tool is excluded from Vercel; its example prompt is not storefront copy.

## Feed invariants

Compared the new build with the release worktree's `dist/google-merchant-feed.xml` using an XML parser:
**175 items; 84 titles and 84 descriptions changed; 91 items unchanged.** Every other item element is identical,
including IDs, links, prices, image links/additional images, groups, handling times and shipping. Nothing was submitted
to Merchant Center. Full machine diff: workspace `output/instaplaque-wood-wording-20261101/feed-diff.json`.

### ip-bs-210x148-rect-dark

- Title before: Personalised Brushed Stainless Steel Plaque on Dark Walnut 210 × 148 mm – Engraved Presentation or Memorial Plaque
- Title after: Personalised Brushed Stainless Steel Plaque on Dark Wood 210 × 148 mm – Engraved Presentation or Memorial Plaque
- Description before: An A5 (210 × 148 mm) brushed stainless steel plaque on dark walnut…
- Description after: An A5 (210 × 148 mm) brushed stainless steel plaque on dark solid wood…

### ip-bs-210x148-rect-light

- Title before: Personalised Brushed Stainless Steel Plaque on Light Oak 210 × 148 mm – Engraved Presentation or Memorial Plaque
- Title after: Personalised Brushed Stainless Steel Plaque on Light Wood 210 × 148 mm – Engraved Presentation or Memorial Plaque
- Description before: An A5 (210 × 148 mm) brushed stainless steel plaque on light oak…
- Description after: An A5 (210 × 148 mm) brushed stainless steel plaque on light solid wood…

### ip-bs-148x210-rect-dark

- Title before: Personalised Brushed Stainless Steel Plaque on Dark Walnut 148 × 210 mm – Engraved Presentation or Memorial Plaque
- Title after: Personalised Brushed Stainless Steel Plaque on Dark Wood 148 × 210 mm – Engraved Presentation or Memorial Plaque
- Description before: An A5 (148 × 210 mm) brushed stainless steel plaque on dark walnut…
- Description after: An A5 (148 × 210 mm) brushed stainless steel plaque on dark solid wood…

## PDFs and images

`pdftotext -layout` checked all **175 product samples + the home sample** successfully: **zero species claims**,
528 pages total. The existing wood-backed samples already say Light/Dark wood (42 of each). All 176 PDFs, 350 product
proof thumbnails and six home proof pictures (532 files) are byte-identical to the release. **No regeneration or cache
version bump**; products remain `?v=12`, home `?v=5`. The external shared generators were audited, not edited.

The current `downloadPdf` implementation was bundled from this worktree and executed in Chrome at phone and desktop
sizes, each with/without an optional AI picture: four downloaded PDFs successfully extracted with **Dark solid wood**
and no species term. PDF CDN libraries were fetched to the private test output and supplied locally to the browser;
external browser requests were blocked. No AI generation or production artwork change.

## All remaining mentions

The exhaustive built HTML/JS/JSON/XML/text scan found **226 matches in 182 files**: 211 allowed tree/customer-object
occurrences (mostly the same grave-cross alt text repeated on catalogue pages), plus 15 stable asset-path occurrences.
Every match, with its built file, line, byte-independent character offset and context, is recorded in
[wood-wording-built-mentions-2026-11-01.md](wood-wording-built-mentions-2026-11-01.md).

Allowed text contexts:

- “LARCH” in the example house name “LARCH HOUSE” is an inscription, not a board material.
- “This oak was planted…”: tree inscriptions, the tree FAQ (visible and schema), community dedication examples and
  the aged-brass 148 × 210 product's example inscription/alt text.
- “An oak on the village green”, “beside a young oak”, “under a young oak”, “under the oak he planted”: actual trees.
- “A silver birch for Moss”, “beside a young silver birch”, “This silver birch”: actual tree examples/inscriptions.
- “temporary oak cross”, “a new teak bench”, “an oak door frame”: the customer's setting, not supplied products.
  The short grave-cross caption now says “Polished brass on a grave cross” to remove ambiguity; the uncertain pavilion
  wall description was rephrased from cedar boards to timber boards.
- Texture URLs containing `wood-dark-mahogany-veneer` / `wood-light-oak-veneer`, the Anne image filename, and tree image
  filenames are intentionally unchanged technical paths, not visible material labels.

## Checks and review images

- `npx tsc --noEmit -p tsconfig.check.json`: pass.
- `cody-job -- npm run build`: pass, including every postbuild check (consent, live/designer SEO, product policies,
  merchant catalogue/feed, designer SEO CI, from-prices, category-template FAQ parity, Meta pixel/purchase).
- Chrome, local `127.0.0.1:4398`, **390 × 844**, external requests blocked: tree What you get and sizes, wood-backed
  product, designer wood step (both tones), home: **zero application console/page errors, zero horizontal overflow**.
  Expected blocked external resources are excluded from console-failure accounting. Local server/browser closed.
- Three screenshots visually reviewed and small PIL JPEG copies saved to workspace
  `output/instaplaque-wood-wording-20261101/telegram/`: `tree-what-you-get.jpg`, `wood-product-first-screen.jpg`,
  `designer-wood-step.jpg` (390 × 844, each under 53 KB).
- `git diff --check`: pass. Original release and PIM working checkouts remain clean/unchanged.

## Preview

https://instaplaque-4q96reixr-dullaghan31-3959s-projects.vercel.app

Deployment **`dpl_AgRkRc72NRicXFNGuzLZvWkMN8LW`**, inspected **Ready**, target **preview**, 1 November 2026.
Vercel API preflight returned `403 application/json`; deployed under the shared flock with `vercel deploy --yes
--scope dullaghan31-3959s-projects`. Cloud build and all postbuild checks passed. CLI uploaded the checked working tree
before this final audit/handover commit; deployment Git metadata can therefore refer to the base commit. Executable
source is the same as this branch; only final documentation was written after upload.

Authenticated `vercel curl` GETs returned 200 for home, tree, wood-backed product, designer, feed, sitemap and llms.
Feed, sitemap and llms are byte-identical to the checked local build. The four HTML pages have identical visible text,
alt/title/ARIA/meta content and JSON-LD. Expected cloud-only differences are responsive image/preload hints
(`__VERCEL_IMAGES__` in `vite.config.ts`), the resulting bundle name (`index-DlgJ8F90.js` versus local
`index-BsD5jnwj.js`), and Vercel's preview feedback script. The hosted JS has the same audited species-word counts and
no supplied-board species claim. The preview is protected by Vercel sign-in; the CLI's supported authenticated GET was
used without exposing credentials. See workspace `preview-http-checks.json` beside the other audit output.

## Read-only PIM audit

No PIM changes. Source `pim-pack-outer-border-20261009` at `97fc522`: **35 customer-facing fields/lines** across five files
(21 oak, 14 mahogany); **21 additional generator lines** repeat these claims. Public GETs: 32 successful route requests,
19 requested routes containing claims (96 repeated text/alt fields). All exact file:line contexts, technical-path
exceptions and live routes are in [pim-wood-wording-readonly-2026-11-01.md](pim-wood-wording-readonly-2026-11-01.md).

## Release steps — Cody only, not performed here

1. Check out this branch/revision; verify the preview and the wood wording. Keep the production rollback ID below.
2. Probe Vercel API first; with JSON response, stage production under the lock:
   `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --prod --skip-domain --yes --scope dullaghan31-3959s-projects`.
3. Inspect Ready/production target; check tree, home, designer, wood-backed pages, FAQ/schema parity, feed copy and
   unchanged IDs/links/prices/images. Then promote the newly checked deployment under the same lock using
   `vercel promote NEW_DEPLOYMENT_ID --yes --scope dullaghan31-3959s-projects`.
4. Check live aliases and pages/feed. No ads, Merchant Center settings, Stripe, database or PIM change is part of this task.

Rollback: `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel promote dpl_3yA5Qrb7ipZgQaJnKHaMMSEvV3zF --yes --scope dullaghan31-3959s-projects`, then verify live.
