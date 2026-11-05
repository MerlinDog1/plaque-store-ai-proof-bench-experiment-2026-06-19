# plaque-store-ai-proof-bench-experiment-2026-06-19: source and machine handover

## Border parity round 2: solid proof lines + parallel inner corners — PREVIEW ONLY, 5 November 2026

- **Owner:** msgs 10006 ("even then the double line is wrong huh?") and 10010 "OK do all that", after reviewing the
  4 Nov comparison sheet (its samples used test-only 8 mm rounded corners).
- **Branch** `codex/instaplaque-border-parity-20261104`; app commit **`3116e2f32ad22d777568ab0cf9381ba8638cb446`** on top of
  the width-parity commit `8d36d7e`; this note is docs only.
- **Changes (components/PlaquePreview.tsx only):**
  - The proof draws every border line at full opacity. Before: double inner line 0.8, double-scalloped inner 0.75,
    legacy inset inner 0.45, while the workshop file etches every line solid black.
  - Inner rectangle lines use the outer line's corner radius minus their extra inset, so double/inset lines stay
    parallel round rounded corners. Square plates (all products and the designer use cornerRadius 0) are unchanged.
- **Checks:** `tsc --noEmit`; `BORDER_PARITY_BASELINE=86188c9 npm run check:border-parity` = **1,804 cases** (new square-cornered
  caps case, plus new asserts: no faded proof border line, parallel inner corners) and the old/new full SVG comparison
  (only border widths differ from live 86188c9); `check:small-border-stroke`, `check:preview-geometry`,
  `check:curved-scallop-border` against a local Vite server (system Chrome shim) all pass; cloud build + every postbuild
  guard passed.
- **Ready preview:** https://instaplaque-ibdtrmk9a-dullaghan31-3959s-projects.vercel.app (`dpl_BwsoK1K2fKJw5YrgRfYECfnuzSfj`,
  inspected target **preview**). Hosted A5 double export (real designer UI, deployed exporter): proof opacities 1/1,
  file 1 / 0.75 mm at 3 / 5 mm, rx 0, solid black, text outlined, 210 x 148 mm, zero page errors.
- **Evidence:** workspace `output/instaplaque-border-parity-20261104/r2/` (square-cornered `border-parity-phone.jpg` + three
  size sheets, sample SVGs, logs, `hosted-check.log`).
- **Not live.** Production independently remains `dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`. Release only on the owner's go:
  `vercel deploy --prod --skip-domain` under the shared lock, check, then `vercel promote`; rollback = promote
  `dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`. Still open: whether Trade Etching can etch the 0.25 mm inner line on small
  double-scalloped plates.

## Production border parity — PREVIEW ONLY, 4 November 2026

- Task branch `codex/instaplaque-border-parity-20261104`, from current live `86188c9`.
  Application commit **`8d36d7ea0b6531804414b82f71844979390ccb9a`**, pushed; this handover is docs only.
- Ready preview: https://instaplaque-fuj2hb5v3-dullaghan31-3959s-projects.vercel.app
  (`dpl_3wdfv5KuRf4e765sieHkceCNHEwS`, inspected target **preview**, cloud build/postbuild passed).
- Only runtime change: stop forcing `.engraved-border` to 0.5 mm in production SVG/PDF. Preserve the exact
  approved proof widths/coordinates/radii; production remains solid etch black. Preview and other layers unchanged.
- Verified: baseline + standalone **1,604-case** border geometry matrices, **58-font** glyph parity, tsc, full
  local/cloud builds + postbuild, CI security/checkout suites, preview/scallop/circle geometry. Actual hosted A5
  Double export = **1 / 0.75 mm**, centreline insets **3 / 5 mm**, outlined text, zero browser errors.
- Evidence: workspace `output/instaplaque-border-parity-20261104/`; `border-parity-phone.jpg` plus three shorter
  size sheets, 12 old/new/proof SVG sets, logs and hosted SVG/screenshots. All synthetic; no order data accessed.
- Details, exact widths, 0.25 mm small-double-scallop manufacturing question, code-only impact since 26 Oct,
  old optional UI-suite failures, optional CI-hook permission limitation and rollback:
  [docs/border-parity-2026-11-04.md](docs/border-parity-2026-11-04.md).
- **Not live.** Production independently remains `dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`. No production deploy,
  promotion, aliases, order changes or messages. Future release is a separate owner decision; no live rollback needed.


## Cookie bar round 3 + cookie-free visit counter: LIVE — 3 November 2026, 17:58 UTC

- **Owner:** msg 9515 "Yeah go live". **Live:** `dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN` (instaplaque-nxc3awz2j) from this
  branch at `285d4d8` (app `6721d9a`), staged with `vercel deploy --prod --skip-domain` under the shared lock (cloud build
  + every postbuild guard passed), promoted 17:58:30 UTC. **This branch is now the live source.**
- **Ships, vs the previous live source `406df95`:** the plainer bar wording (phone "Cookies: OK to use analytics and ad
  cookies?", desktop "Cookies: may we use optional analytics and ad cookies to improve the site and our ads?"), the
  slightly bigger cream bar (round 2), and the cookie-free anonymous visit counter (Vercel Web Analytics pageviews for
  every visitor, PECR Sch A1 para 5, switch on /cookies). PostHog, session replay, Meta and Google ads stay behind Accept.
- **Pre-promote checks** (`output/instaplaque-consent-stats-20261102/round3/check_cookie_release.sh`, bypass header never
  printed): 9 pages 200 with the new wording and none of the old; /cookies has the statistics switch and still explains
  the recordings; `/_vercel/insights/script.js` 200; AI health ok; robots.txt identical; Merchant feed 175 items identical.
- **Live checks:** instaplaque.co.uk home, /cookies, /memorial-plaques, an A5 product 200 with only the new wording; www 308.
  `consent_live_check.cjs` (phone, trackers blocked): the counter's 2 cookie-free requests before any choice; Accept ->
  PostHog + Meta + GTM + insights, keys yes; Reject -> counter + GTM consent mode only, keys no.
- **Rollback:** `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel promote dpl_GkwLwPezCk8nN2dof46vZTe5adwp --yes --scope dullaghan31-3959s-projects`.

## Cookie bar round 3: plainer wording — preview (superseded by the live release above), 3 November 2026

- **Owner:** msg 9503 "Do this one" for the wording offered at 15:50 UTC (no "record" in the bar).
  Phone: **"Cookies: OK to use analytics and ad cookies?"**; desktop: **"Cookies: may we use optional analytics and ad
  cookies to improve the site and our ads?"**; then Settings / Accept / Reject. Same bigger cream bar as round 2,
  same Accept/Reject functions and keys (Accept still sets the replay key), cookie-free counter and /cookies switch
  unchanged; /cookies still explains PostHog session replay in full.
- **Why:** 3 Nov check (owner msg 9493): live wiring PASS (Accept -> PostHog/GTM/Meta/Vercel insights; Reject ->
  GTM consent mode only), but accepted Google ad visitors fell from 39% (25-30 Oct) to 14% (31 Oct-2 Nov) and 0 of 8
  on 3 Nov after the slimmer bar.
- **Branch:** `codex/instaplaque-consent-stats-20261102`, app commit **`6721d9a`** (MetaConsent.tsx only), pushed.
- **Ready preview:** https://instaplaque-dsdo2661c-dullaghan31-3959s-projects.vercel.app (`dpl_6m8fSnFeTwPBzdYh9RdyuQKhYAYd`,
  inspected Ready, target preview), deployed under the shared lock with `vercel deploy --yes`.
- **Checks:** typecheck; local build + every postbuild guard; new wording in all 200 HTML pages + the JS bundle, old
  wording in none; consent bar layout 7/7 (phone bar now one line, 56 px; desktop 62 px; equal 44 px buttons);
  category template 24/24; Google consent browser 3/3. Evidence: workspace
  `output/instaplaque-consent-stats-20261102/round3/` (logs, layout/ and categories/ shots, cookie-bar-round3-preview.jpg).
- **Not live.** Release only on the owner's go: `vercel deploy --prod --skip-domain` under the lock, check, then
  `vercel promote`; rollback = promote `dpl_GkwLwPezCk8nN2dof46vZTe5adwp` (live since 1 Nov 15:49 UTC).

## Cookie bar round 2: live cream bar, a little bigger — PREVIEW ONLY, 2 November 2026

- **Owner:** msg 9079 “do both”, then msg **9143** “leave as is just a bit bigger” / “Don't like mentioning
  recording like that”. The dark-green preview is superseded. Live markup, cream look and wording restored;
  no added counter sentence and no animation. The cookie-free counter and `/cookies` Statistics switch stay.
- **Branch:** `codex/instaplaque-consent-stats-20261102`, pushed without force. Restoration commit `138c33c`;
  deployed, verified application SHA **`87a804b84d85b0e3adaf10b02c0c5f116aacf054`**. The following docs commit
  changes no application code. Live baseline `406df95aedf810b4dac8e03a43010efe2107e9ce` remains untouched.
- **Ready preview:** https://instaplaque-oxf3vgt69-dullaghan31-3959s-projects.vercel.app
  (`dpl_4RMhBMCFHHPorH51b14c2S2afycu`, independently inspected **READY**, target **preview**).
- **Final bar:** phone **64.640625 px**, desktop **62 px**; equal 44 px buttons, 13/15 px text.
  The first category run failed `tree-memorial-plaques/desktop: notice covers the first card` (1.84375 px overlap);
  raw phone-product measurements found 1.46875 px overlap on the two Design buttons. Only vertical padding
  changed (desktop 10 → 8, phone 7 → 5 px); final clearance is 2.15625 / 2.53125 px respectively.
- **Checks:** typecheck, local/cloud builds + all postbuild guards; layout 7/7, categories 24/24,
  statistics 5/5 local + 5/5 canonical-origin simulation, Google consent 3/3; preview HTML/CSS 5/5 HTTP 200,
  with CSS byte-identical to the checked build. Browsers ran sequentially; all trackers intercepted, no live-site test.
- **Evidence/screenshots:** workspace `output/instaplaque-consent-stats-20261102/round2/`; four review copies in
  `review/`: `phone-home.jpg`, `phone-product.jpg`, `phone-cookies.jpg`, `desktop-home.jpg`. Original captures
  in `final/`; exact bounds in `clearance-before.json` / `clearance-final.json`. Task browsers and server stopped.
- **Not live:** one locked preview deployment only, after the API probe returned 403 JSON. No production deploy,
  promotion, manual alias/domain, account/environment, Ads/Google/Meta/Merchant or Supabase changes, messages or emails.
  Google advanced consent mode and the earlier processor-terms/retention question are unchanged.
- Details and superseded round-1 provenance: [docs/consent-bar-stats-2026-11-02.md](docs/consent-bar-stats-2026-11-02.md).


## Light/dark solid wood wording: LIVE — 1 November 2026, 15:49 UTC

- **Owner:** msg 8635 ("just say light or dark solid wood", no species, never say we don't know) and msg 8640 "Yeah release that".
- **Live:** `dpl_GkwLwPezCk8nN2dof46vZTe5adwp` (instaplaque-nw4xptuc9) from this branch at `9cc96a6` (staged with
  `vercel deploy --prod --skip-domain`, cloud build + postbuild pass), promoted 15:49:46 UTC. **This branch is now the live source.**
- **Pre-promote checks** (`output/instaplaque-wood-wording-20261101/check_wood_release.sh` + independent feed diff): tree page
  says "light solid wood board" with no species; the 8 template pages, home, designer, portrait and two product pages 200;
  feed 175 items, same ids, only `structured_title/content` and `structured_description/content` changed on 84 items
  (wood-backed variants), species words 168 → 0; robots identical; AI health ok.
- **Live checks (OVH):** instaplaque.co.uk = the new id; tree page 0 species; feed 175 items, 0 species; home/designer 200;
  www 308. Merchant feed fetch triggered (200) and both sitemaps resubmitted to Search Console (204).
- **Rollback:** `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel promote dpl_3yA5Qrb7ipZgQaJnKHaMMSEvV3zF --yes --scope dullaghan31-3959s-projects`, then re-fetch the Merchant feed.
- Details: [docs/wood-wording-2026-11-01.md](docs/wood-wording-2026-11-01.md).

## Light/dark solid wood wording — PREVIEW ONLY, 1 November 2026

- Owner msg 8635: never name a species for supplied boards/stands; use light/dark solid wood (short labels: light/dark wood).
- Branch `codex/instaplaque-wood-wording-20261101`, based on live-source `753e195`; no production promotion.
- Ready preview: https://instaplaque-4q96reixr-dullaghan31-3959s-projects.vercel.app (`dpl_AgRkRc72NRicXFNGuzLZvWkMN8LW`).
- All build/postbuild checks and 390px phone checks pass. 84 feed titles/descriptions updated; all other feed fields unchanged.
- 176 sample PDFs already species-free; PDFs/pictures/version numbers unchanged. PIM audit read-only, 35 source claims found.
- Full evidence, remaining allowed mentions, screenshots, release steps and rollback: [docs/wood-wording-2026-11-01.md](docs/wood-wording-2026-11-01.md).
- **Cody releases.** Production stays `dpl_3yA5Qrb7ipZgQaJnKHaMMSEvV3zF`.

## Eight products-first category pages: LIVE — 1 November 2026, 14:07 UTC

- **Owner:** msg 8620 "Go live then" (after msg 8603's proof/video change, preview `dpl_Y65CRMBo73eaE9h84eanyEMD3mDz`).
- **Live:** `dpl_3yA5Qrb7ipZgQaJnKHaMMSEvV3zF` (instaplaque-gangmmw1a), bundle `index-Dm4PwOLZ.js`, from this branch at
  `db5ff4bf8e35d736017af090704218be83e31a4a` (code identical to the verified `6dea61f`; db5ff4b adds docs only).
  Staged with `vercel deploy --prod --skip-domain` (cloud build and every postbuild check passed), promoted 14:07:06 UTC.
  **This branch is now the live source.** Base any further InstaPlaque work on it, not on the Stage 2/combined-preview branches.
- **Checks before promotion** (`output/instaplaque-category-template-20261101/release/check_release_20261101.sh`, log
  `check-release-prod.log` beside it): the 8 pages 200 with the proof and video sections, footnote, "sizes · finishes"
  count, canonical, H1, titles identical to the previous production and no links to unreleased pages; home, portrait,
  cookies, privacy, designer and two product pages 200; feed, sitemap and robots byte-identical to the previous
  production; `/api/gemini/health` ok.
- **Checks after promotion** (from OVH with a phone browser user agent): `vercel inspect instaplaque.co.uk` = the new id;
  the 8 pages live with the new layout; home 200 with the new bundle; portrait, designer and a product page 200;
  www 308 to the apex; sitemap, feed (175 items) and robots 200; AI health ok.
- **Search Console:** sitemap.xml and sitemap-products.xml resubmitted 14:08 UTC (204, 0 errors, 0 warnings).
  Merchant feed unchanged, so not refetched.
- **Rollback:** `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel promote
  dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8 --yes --scope dullaghan31-3959s-projects`, then verify and resubmit the sitemap.
- **Measure in about two weeks:** share leaving within 30 seconds, clicks from these pages to product pages, Google Ads
  landing-page experience, Search Console positions and sales from these pages.

## Live-only eight-template release candidate — PREVIEW ONLY, 1 November 2026 (superseded: released above)

- Branch `codex/instaplaque-template-release-20261101`, based on live source `ec24ba1`.
  Verified code/checks: `6dea61fe2231af5775bf61a650fdda44d5817c60`; no merge, production deploy, promotion or domain assignment.
- Preview: https://instaplaque-etn8xqef9-dullaghan31-3959s-projects.vercel.app
  (`dpl_Y65CRMBo73eaE9h84eanyEMD3mDz`, **Ready**, target **preview**).
- Only the eight products-first pages and slim cookie bar, retaining live consent and all non-template content.
  Owner msg 8603: separate free-proof and large tap-to-play video sections, short footnote (`1d9070b`).
- Route diff: exactly eight content changes, 192 notice-only routes, 16 finish crops; sitemap unchanged, nothing removed.
  Every off switch restores live's original page and FAQs. Typecheck/build, postbuild and 24 browser/no-JS cases pass.
- Full scope, tests, screenshots, removed unpublished links, release steps and rollback:
  [docs/category-template-release-2026-11-01.md](docs/category-template-release-2026-11-01.md).
- **Next: owner's review; Cody releases only after the owner's yes.** Live remains
  `dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8`; do not deploy the Stage 2/combined-preview branch.

## Shopping main picture = the studio photo: LIVE — 31 October 2026, 08:23 UTC

- **Why:** the owner (msg 8159): "I need all the new photos in Google ads". Shopping ads take the feed's `image_link`,
  and the few products already shown with a photo had drawn clearly more clicks than the drawings.
- **Branch:** `codex/instaplaque-feed-studio-photos-20261031` (a160b36), from the v3 live source (7e42700). This branch
  is now the live source; base new work on it.
- **What changed:** `scripts/prerender-product-pages.mjs` (`mainImageUrlFor`): for the 167 products with a studio photo
  the feed's `image_link` and the page's Product schema image are that photo (1200 × 1200 WebP, IPTC
  `trainedAlgorithmicMedia`); the drawing (`?v=11`) becomes the first `additional_image_link`, then any in-place
  photo. The 6 thin strips keep the drawing; the A5 steel and the brass bench plaque keep their photos.
  `check-merchant-feed.mjs` and `check-product-policies.mjs` now expect this. Nothing else in the feed changed (diff
  against live: only those 167 image lines); pages differ from v3 only in that schema line.
- **Live:** dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8 (instaplaque-psui4f71b), promoted 08:23:49 UTC after its feed was checked
  byte-identical to the local build. Live feed (apex and www) = the new file; all 175 main images answer 200 with an
  image type. Merchant Center fetch requested at 08:25 (`post_release_submit.py merchant`): SUCCEEDED, 175 items.
  Google then re-checks each new image (Merchant says up to 5 days for some destinations); read progress with
  workspace `output/instaplaque-feed-photos-20261031/merchant_image_status.py`.
- **Rollback:** promote dpl_uNxynWjiLaW1qAcaUHEEXaNKJgiq (the v3 release), then
  `python3 -I output/instaplaque-google-visibility-tools/post_release_submit.py merchant` (workspace) so Google re-reads
  the old feed.

## Product pages v3, the pictures band, each plaque's own proof and the designer-texture PDFs: LIVE — 31 October 2026, 08:05 UTC

- **Why:** the owner's go (msg 8146) for everything on the v3 preview (msgs 8065, 8088, 8100, 8116, 8124; the three
  PREVIEW sections below).
- **Live:** dpl_uNxynWjiLaW1qAcaUHEEXaNKJgiq (instaplaque-jyygrmsuz, `index-CkaO0isp.js`), promoted 08:05:33 UTC from
  commit 2a93dd5 on `codex/instaplaque-product-page-v3-20261030`. This branch is now the live source; base new work on
  it.
- **Release:** `vercel deploy --prod --skip-domain` (no files left to upload after the preview; the build and every
  postbuild check passed), checked before promotion (4 pages, their PDFs and proof pictures, the home-page sample),
  then `vercel promote`. Vercel's security checkpoint had blocked Contabo's API calls from about 07:44 to 08:01; the
  release waited for it to clear. The bulk live checks ran from the OVH server, so this server's requests to Vercel
  stayed low.
- **Checks on live:** all 175 product pages have the pictures band and their own proof pictures (one stack, `?v=12`)
  and PDF link, and all 350 proof pictures match the repo byte for byte; the home page links the new sample (`v=5`),
  which matches the repo; www redirects to the apex. `verify_live.py`: 175 product pages, sitemaps and feed (175 each),
  734 linked PDFs and photos byte-identical, redirects and IndexNow key file fine. `verify_studio_live.py`: 167 studio
  photos pass. In a browser (phone, brushed stainless 150 × 65; computer, polished brass 300 × 200 dark wood): the band
  once with 10 cards, phone swipe and computer wrap, no sideways overflow, the ask card opens WhatsApp, one proof
  picture, the plaque's own, opening its PDF. Scripts and logs: workspace `output/instaplaque-custom-band-20261031/`
  (`RELEASE-v3.md`, `check_deployment.sh`, `verify_v3_live.sh`, `live-checks/`, `shots-live/`).
- **Unchanged:** production artwork PDFs, prices, the Merchant feed, checkout and API code.
- **Known (owner not yet decided):** the film's end card "Made in 5 working days*" also shows on the 99 pages that take
  7, 10 or 15 days (its footnote explains); on a first phone visit the cookie notice covers the price and buttons
  until answered.
- **Rollback:** promote dpl_sU9UTr4ZoqiSngGZXdnoZuWtRDbx (instaplaque-5vb35oan3, `index-CCY4XCzT.js`, the last
  studio-photo release): `vercel promote dpl_sU9UTr4ZoqiSngGZXdnoZuWtRDbx --yes --scope dullaghan31-3959s-projects`.

## Sample PDFs and downloaded proofs with the designer's textures — PREVIEW ONLY, 31 October 2026

- **Why:** the owner (msgs 8116, 8124): the sample PDFs' metal looked worse than the designer; production artwork
  stays a plain drawing, everything customers see uses the textures.
- **Branch:** same v3 branch, `codex/instaplaque-product-page-v3-20261030`. Not merged, not live.
- **What changed:** the 175 sample PDFs show the designer's own drawing (`?v=12`, production days refreshed, 25 had
  been out of date) and their 350 pictures were remade; the home-page sample uses the designer's brushed brass
  (`v=5`); "Download proof PDF" always shows the drawing, with a current AI "Realistic preview" only as a labelled
  page 2. The PDF generator stays in the workspace (`output/instaplaque-sample-proof/source/`). Details, redo steps and
  checks: `docs/proof-textures-2026-10-31.md`.

## Product pages v3, "Tell us what you want" band: pictures and the proof PDF — PREVIEW ONLY, 31 October 2026

- **Why:** the owner (msg 8088): pictures of "more far out stuff" in that band so people know we make anything, and a
  picture of the proof PDF above "What you get."; then (msg 8100) use each page's own proof PDF, once.
- **Branch:** same v3 branch, `codex/instaplaque-product-page-v3-20261030`. Not merged, not live.
- **What changed:** catalogue pages only: nine pictures of plaques made to order plus an "ask us" card (swipe on phones,
  two rows of five on computers) and a shorter paragraph in that band; "What you get." pictures the plaque's own sample
  proof (pages 1-2) above its PDF link. Existing site pictures only (`scripts/make-custom-work-images.py` crops them);
  proof pictures from the PDFs by `scripts/make-sample-proof-thumbs.py` (rerun after redrawing the PDFs, same `?v=`).
  Details and checks: the 31 October section of `docs/product-page-v3-2026-10-30.md`.

## Product pages v3 (photo first, "we make anything", photo rows): PREVIEW ONLY — 30 October 2026, ~23:45 UTC

- **Why:** the owner (msg 8065) after reviewing the catalogue pages row by row: say in the first seconds that any size,
  finish or wording is made; photo rows of more sizes in the finish and other finishes in the size; drop the text
  wording examples; the film on every page.
- **Branch:** `codex/instaplaque-product-page-v3-20261030`, based on the live source
  (`codex/instaplaque-studio-photos-20261030` at 277ba40). Not merged, not live.
- **What changed:** `services/productLayout.ts` turns the 29 Oct layout on for every catalogue page, now with the photo
  first on phones, the "Any size, finish or wording…" line, the film, `ProductPhotoRows`, design-for-you moved up and
  the details folded. Design online links are `/design?plaque=<slug>` (App.tsx opens that plaque before hydration).
  Shorter cookie notice. Details: `docs/product-page-v3-2026-10-30.md`.
- **Checks:** tsc and the full local build with postbuild checks pass; the Vercel preview build's postbuild checks pass;
  `/design?plaque=` opens the right plaque and price; `check-merchant-browser.cjs` passes on all 175 pages at desktop
  width and its 35 phone pages (local build, 3 chunks). Screenshots of the preview itself: workspace
  `output/instaplaque-page-review-20261030/out-preview/`.
- **Preview:** https://instaplaque-lar3wb91d-dullaghan31-3959s-projects.vercel.app (Vercel login needed; Preview
  environment variables, so don't take orders on it).
- **To release:** only on the owner's go. Build with `vercel deploy --prod --skip-domain`, check, then promote; rollback
  is the live deployment at the time.

## Studio photos on the product pages, in batches: LIVE (first 20) — 30 October 2026, 15:35 UTC

- **Why:** the owner (msg 7966): "do batches and update the website for relevant pages each batch", after approving
  studio shots made with the designer's own realistic preview (msgs 7739-7939).
- **Branch:** `codex/instaplaque-studio-photos-20261030`, based on the live product-page release (c72c38d). This branch
  is now the live source; base new work on it.
- **What changed:** `services/studioPhotos.mjs` lists products with a checked studio photo. Their pages lead with it,
  then any signed-off in-place photo, then the flat drawing; cards that showed the drawing show it instead. The feed's
  image_link stays the drawing; the photo is an extra image and is in the product sitemap. Files are tagged IPTC
  trainedAlgorithmicMedia. Details, pipeline and per-batch release table: `docs/studio-photos-2026-10-30.md`.
- **Checks:** postbuild `check-product-policies.mjs` (new studio-photo checks) and all other postbuild checks pass
  locally and on Vercel; `check-merchant-browser.cjs` (updated) 25/25 on the local build; home, category and other
  product pages identical to live apart from asset hashes; `verify_studio_live.py` and `verify_live.py` pass on live.
- **Live:** dpl_AMZz5o9XoDh5saD2hU74mD5rvEjq (instaplaque-rcj72p6kq, `index-B9d3Z3kt.js`). Later batches are added to
  the table in the doc.
- **Rollback:** promote dpl_8HeMejLdG48U8XTAEzTLF4DuwHtB (the product-page release).

## Meta pixel: own dataset + private Purchase event: LIVE — 28 October 2026, about 15:20 UTC

- **Why:** the owner (msgs 7126, 7132) asked whether conversion tracking was set up for the new Facebook/Instagram
  ads. The old pixel (2766586460430567) sat in a portfolio InstaPlaque's ads can't use and sent no purchases.
- **Branch:** `codex/instaplaque-meta-purchase-20261028`, based on the live source (from-prices). This branch is now
  the live source; base new work on it. Draft PR #23 exists only for CI.
- **What changed:** pixel `4216755011787795` (made in the INSTAPLAQUE ad account); one `Purchase` per paid live order
  through a same-origin event-only frame, like the Google one; cookie details mention paid orders; tree page
  sitemap lastmod. Details: `docs/meta-pixel-purchase-2026-10-28.md`.
- **Checks:** `check-meta-purchase.cjs` (new) and `check-meta-pixel.cjs` run in postbuild and pass; CI typecheck
  passes (`check:google-purchase` fails as on the live source); live browser checks
  `check-meta-pixel-live.mjs` and `check-meta-purchase-live.mjs` pass with Meta's endpoint blocked;
  `check-from-prices` on live and `verify_live.py` pass.
- **Live:** dpl_BqgnQ2WuCgQUn6YEVTjuoufxcQp9 (instaplaque-8a1hhfvyy, `index-N6efz1TY.js`).
- **Rollback:** promote dpl_3Kf1w2qQ6q6WCopG4nokYR28zfaV and set the Meta ad set back to `LINK_CLICKS`.
- **Deploy note:** link this checkout to the `instaplaque` project first (copy projects/instaplaque/.vercel/project.json);
  without it, `vercel deploy --yes` creates a new project (it did: `instaplaque-contact-followups`, unused).

## From-prices are each page's cheapest plaque: LIVE — 28 October 2026, 11:00 UTC

- **Why:** the owner (msg 7009): "our from price still seems way high always" (the stainless page said from £95.50; its
  150 × 50 mm plate is £58.50).
- **Branch:** `codex/instaplaque-from-prices-20261028`, based on the live source (a9bc414).
- **What changed:**
  - Hero from-prices: memorial, garden and stainless £58.50; brass £63.50; tree £187.50; opening £95.50.
  - "Design online" still opens on A5 (A4 on the opening page), and each hero note names that price too.
  - The brass and stainless finish tiles show and lead to each finish's cheapest plaque.
  - The homepage tiles show each page's own price.
  - Details: `docs/from-prices-2026-10-28.md`.
- **Check:** `scripts/check-from-prices.mjs` (new, in postbuild). It fails 13 ways on the current live site.
- **Checks:** CI typecheck passes; Vercel postbuild passes, including the new check; the candidate's pages pass it.
- **Live (owner msg 7015):** dpl_3Kf1w2qQ6q6WCopG4nokYR28zfaV (instaplaque-3ao2t833a, `index-urC02j3R.js`) on both
  domains. `check-from-prices.mjs` on live and `verify_live.py` pass. This branch is now the live source; base new work
  on it.
- **Ads:** the memorial, garden, stainless, brass and tree ads' pinned price headlines now match the pages
  (`scripts/lower-from-prices-20261028.py` in the ads checkout, applied 11:00 UTC).
- **Rollback:** promote dpl_QCbB8CX9ekQjg63py3Za3i6goQsG, then run that script's `undo`.

## Promo film watch tracking in PostHog: LIVE — 28 October 2026, 10:24 UTC

- **Why:** the owner (msg 7004): "track video views percentage in posthog".
- **Branch:** `codex/instaplaque-video-tracking-20261028`, based on the hero film release below. This branch is now the
  live source; base new work on it. Draft PR #21 exists only for CI.
- **What changed:**
  - PostHog gets `ip_video_started` (with `autoplay`) and `ip_video_progress` (`percent` 25/50/75/100), once per visit
    and page, with analytics consent only, never to GA4.
  - The film also pauses while its tab is hidden.
  - The privacy notice lists it (updated 28 October 2026).
  - Details: `docs/promo-video-2026-10-28.md`.
- **Checks:** `npm run check:posthog` (now including `scripts/check-promo-video-tracking.cjs`) passes locally and in CI,
  as does the CI typecheck. Vercel's build passes every postbuild check. No browser run: the account was over 3 GiB.
- **Known failure, older than this change:** `check:google-purchase` fails in CI and locally ("Public pages retain one
  loader"). None of its inputs changed here; it likely dates from the 26 Oct page-speed change to `index.html`.
- **Live:** dpl_QCbB8CX9ekQjg63py3Za3i6goQsG (instaplaque-gz1ge8cbh, `index-M8D_2WTP.js`) on both domains; live HTTP
  checks and `verify_live.py` pass. The first real phone visit (10:25 UTC) sent started, 25/50/75/100% on time.
- **Rollback:** promote dpl_4MYqFi8ExJbiX9DRCwz4MVyTU9EP (instaplaque-rd8msp6l3).

## Promo film at the top, buttons glowing in turn, video schema and /video: LIVE — 28 October 2026, 10:08 UTC

- **Why:** the owner (msg 6986): the film at the top of the page, with "Design online" glowing while it shows the
  designer and "Design on WhatsApp" while it shows the chat.
- **Branch:** `codex/instaplaque-hero-film-20261028`, based on the live promo-film release (f4d52a5).
- **What changed:** the film replaces the hero photo on the homepage and the category pages, except the tree page. It
  sits beside the copy on computers and straight under the two buttons on phones. The category's photo follows the
  hero. While the film plays, the cued button gets a gold ring. Details: `docs/promo-video-2026-10-28.md`.
- **Checks:** scoped `tsc`, the build with postbuild checks, and the rewritten `scripts/check-promo-video.mjs` all pass
  locally.
- **Video schema and watch page (owner msg 6988), same branch:**
  - `/video` is a watch page with the film leading, a timestamped written version, VideoObject, og:video and a video
    sitemap entry.
  - The film's facts live in `services/promoVideo.mjs`, and the hero captions link to `/video`.
  - Details: `docs/promo-video-2026-10-28.md`.
- **Live (owner msg 7004):** instaplaque-rd8msp6l3 (dpl_4MYqFi8ExJbiX9DRCwz4MVyTU9EP, `index-BPx8Mq_0.js`) was promoted
  at 10:08:33 UTC; `verify_live.py` and live HTTP checks pass. The tracking release above replaced it at 10:24.
- **Rollback:** promote dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (instaplaque-j69fq1m7u, the film after the hero).

## Promo film after the hero (homepage and category pages): LIVE — 28 October 2026, 08:30 UTC

- **Why:** the owner (msg 6977, "Yeah do all 3"): a silent loop of the new promo film near the top of the homepage and
  the Google ad landing pages.
- **Branch:** `codex/instaplaque-promo-video-20261028`, based on the production-times branch (ef0ab9f), which is the
  live source.
- **What changed:** `components/PromoVideo.tsx`, placed after the hero on the homepage and on every category page except
  the tree page (all oak board and stake, 10–15 days, and the film says 5). The 4:5 film (1.27 MB) and its poster are in
  `public/videos/`, cached for a year. Nothing loads before the film is near the screen; it plays muted only while on
  screen, has a pause button, and never autoplays with reduced motion. Details: `docs/promo-video-2026-10-28.md`.
- **Checks:** scoped `tsc`, `npm run build` with postbuild checks, and `scripts/check-promo-video.mjs` (new) pass on the
  local build and on the live site.
- **Live:** promoted on the owner's go (msg 6977): dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (instaplaque-j69fq1m7u,
  `index-eAQF_wEa.js`) on both domains. This branch is now the live source; base new work on it.
- **Rollback:** promote dpl_2tbktHyiKAX62KXH3DZ9AGxZ2fse (instaplaque-qxw1hjk89, the production-times release).

## Production times by size, fixings in the order emails: LIVE — 28 October 2026, 06:48 UTC

- **Why:** the owner (msg 6947): any shape within 600 × 400 mm 5 working days, aged brass 7, wood backing 10 up to A4
  and 15 above, the longest that applies (15 at most); and add a fixings line to the order email.
- **Branch:** `codex/instaplaque-production-times-20261028`, based on the designer wording branch (7c7d075). This is
  now the live source; base new work on it.
- **What changed:** `services/productionTime.mjs` is the one rule (designer, checkout, Stripe, catalogue/feed, email
  fallback); 25 of 175 catalogue offers get shorter times; "Fixings" line in the new-paid-order and production-pack
  emails; timing list, FAQ and terms copy. Details and checks: `docs/production-times-2026-10-28.md`.
- **Checks:** new `check-production-time.mjs` and `check-custom-size-turnaround.mjs`, updated `check-audit-checkout.mjs`,
  build with postbuild checks, scoped `tsc`.
- **Live:** promoted on the owner's instruction (msg 6947): dpl_2tbktHyiKAX62KXH3DZ9AGxZ2fse (instaplaque-qxw1hjk89,
  `index-DEaUd31m.js`) on both domains.
  - `verify_live.py` passed.
  - The live feed has exactly the 25 expected handling-time changes, and no price or title changes.
  - Product pages show the new days.
- **Rollback:** promote dpl_F6osRRkzwag6cRMa3FooGwL1r9XQ (instaplaque-b8vdvugof, the designer wording release).

## Designer wording step: LIVE — 27 October 2026, 21:08 UTC

- **Why:** the owner (msg 6884): the Generate button is hidden on a phone, the step doesn't say "just paste your words
  and the AI does the rest", and asked for a percentage on the plaque while it works. Not the built-in layout.
- **Read first:** **base new work on `codex/instaplaque-designer-wording-20261027`**. It is the Google Customer Reviews
  branch (deb50df) plus this change; a deploy from an older branch removes it.
- **What changed:** the wording step's footer button is "Design my plaque" until there is a current layout; plain
  "just type your words" copy; an estimated percentage over the plaque by real stage; solid buttons in the review
  checklist. Follow-up (msg 6902): title "Just type your words", box "No layout needed", and a quiet "Or we can design
  it all for you on WhatsApp" line on every design step (placement `designer`). Details, claims and checks:
  `docs/designer-wording-step-2026-10-27.md`.
- **Checks:** scoped `tsc` (`tsconfig.check.json`), `npm run build` with postbuild checks, `check-layout-progress.mjs`
  (rewritten) and `check-generation-timeout-ui.mjs` pass.
- **Candidate:** instaplaque-b8vdvugof (dpl_F6osRRkzwag6cRMa3FooGwL1r9XQ, with the msg 6902 follow-up). The earlier
  instaplaque-3o0j9j905 (dpl_pXQ7J7nq) passed a real AI layout at phone size; the follow-up changed only copy and the
  WhatsApp line.
- **Live:** promoted on the owner's go-ahead (msg 6911): dpl_F6osRRkzwag6cRMa3FooGwL1r9XQ (instaplaque-b8vdvugof,
  `index-CzAcsBAj.js`) on both domains. A real AI layout on the live site at phone size passed (26 s, four lines).
- **Rollback:** promote dpl_47YaX9pvMhg1h5qtCKHumLdMLaiT (instaplaque-ovr62c0y3, the Google Customer Reviews release).

## Google Customer Reviews opt-in: LIVE — 26 October 2026, 16:32 UTC

- **Why:** the owner (msg 6658): "Collect reviews after each delivery, through Google Customer Reviews - can you set
  this up?".
- **Read first:** this branch is Claude's speed release plus this change. **Base new work on
  `codex/instaplaque-google-customer-reviews-20261026`**: a deploy from the speed branch alone removes the opt-in.
- **What changed:** `services/googleCustomerReviews.ts`, run from the order confirmation page.
  - Paid customer orders (not tests, not more than 48 hours after paying, not the owner's browser) get Google's survey
    opt-in box for merchant 5859684800.
  - The box carries the order number, email, delivery country and an estimated delivery date: production estimate +
    1 delivery day + 2 spare working days, UK date.
  - The privacy and cookie policies describe it.
  - Details and the privacy probe: `docs/google-customer-reviews-2026-10-26.md`.
- **Still needed from the owner:** in Merchant Center, Settings → Add-ons → Google Customer Reviews → Add, then sign
  the agreement. There is no API for it. Until then Google's box shows nothing.
- **Checks:**
  - `npm run check:gcr` (new) passes.
  - `scripts/check-google-customer-reviews-browser.mjs` (new) passes on the build and on the live site (`LIVE=1`).
  - The build and all postbuild checks pass, as do `check:posthog`, `check:replay` and `verify_live.py`.
- **Live:** dpl_47YaX9pvMhg1h5qtCKHumLdMLaiT (instaplaque-ovr62c0y3, `index-DkNBmYdZ.js`).
- **Rollback:** promote dpl_DBVbnpjajLw2a1F3PKwMDLLSfDdq (instaplaque-dxg3rrhi3, the speed release).

## Page speed and Google rich results (Claude): LIVE — 26 October 2026, 15:25 UTC

- **Why:** the owner asked Claude (claude.ai, not Codex) to "fix and improve" PageSpeed and rich snippets, then to
  "make every page better and faster and as much rich snippet stuff as is possible for everything".
- **Read first:** Claude deployed straight to Vercel from the live deployment's own source. This branch holds exactly
  that code. **Base every new task on this branch** (or merge it in first): a deploy from an older branch removes it.
- **What changed:** see `docs/claude-speed-rich-results-2026-10-26.md`. In short:
  - Google Fonts CSS replaced by inline Fontsource faces.
  - The cookie banner is in the static HTML.
  - The app starts after first paint.
  - The Google tag loads after page load or first interaction.
  - Photos come in responsive copies from Vercel Image Optimization (Vercel builds only).
  - New build step `scripts/finalise-public-html.mjs` adds the schema:
    - product variant groups (feed item_group_id) and product SKUs;
    - breadcrumbs on every page;
    - product ItemLists on category pages;
    - Organization logo, contact point and return policy.
  - The app keeps the build-time route schema on the first page view.
  - Crawlable favicon files.
  - AA contrast fixes.
- **Branch:** `claude/instaplaque-speed-rich-results-20261026`, based on
  `codex/instaplaque-session-replay-20261026` (`2f45423`). Every file it changes was byte-identical there to the source
  of dpl_ogT7gvhE6aZ9EfUbRrLcb55ekVN9.
- **Live:** dpl_DBVbnpjajLw2a1F3PKwMDLLSfDdq (instaplaque-dxg3rrhi3).
- **PageSpeed after the changes (live, mobile / desktop):**
  - Home: 96 / 100 (was 72 / 92).
  - brushed-brass-150x50-rect-plaque: 97 / 100 (was 67 on mobile).
  - bench-plaques: 96 / 100.
  - Accessibility, best practices and SEO are 100 on all of them.
- **Checks:**
  - `npm run build` passes all postbuild checks, both plain and with `VERCEL=1`. `check-google-consent.mjs` was
    updated for the deferred tag.
  - `npm run typecheck` passes.
  - Rich Results Test (live): product snippets, merchant listings, breadcrumbs and Organization are all valid.
- **Deploying:** keep building on Vercel (`vercel deploy --prod`, not `--prebuilt`). `VERCEL=1` switches on the
  `/_vercel/image` srcsets; a local or VPS build without it keeps plain image URLs.
- **Rollback:** promote dpl_ogT7gvhE6aZ9EfUbRrLcb55ekVN9 (the session-replay release).

## Session recordings in PostHog: LIVE — 26 October 2026, 12:26 UTC

- **Why:** the owner (msg 6565): "can we set up recording for instaplaque also?". The PostHog project already
  recorded the JFK pack site; InstaPlaque had no recorder and its policy said session replay was off.
- **What changed:**
  - `services/sessionReplay.ts` loads posthog-js only for visits `replayVisit()` allows: analytics consent given under
    the new recording wording (`instaplaque-replay-consent-v1`), a public page, and not the owner's browser.
  - It sends recording data only (`before_send` keeps `$snapshot`), masks all typed input, and blocks the plaque
    preview, 3D view and uploaded or generated images (`ph-no-capture`).
  - It masks the design request's review and receipt (`ph-mask`), and strips query strings from network timings.
  - It stops before private URLs are pushed. Reject opts out and removes its storage.
  - Visit IDs are now UUIDv7 and shared with the recorder, so `ip_*` events link to recordings.
  - The cookie notice, privacy policy and cookie policy describe it. Privacy was last updated 26 October 2026.
  - Details: `docs/session-replay-2026-10-26.md`.
- **Checks:**
  - `check:posthog` and the new `check:replay` pass, as does tsc. `check:replay` is not in CI yet: the GitHub login
    can't change workflow files, so the one-line CI patch is saved in `workspace/output/instaplaque-session-replay-20261026/`.
  - The browser checks pass on the test copy: desktop, phone, the owner's browser and earlier consent.
  - Live: the HTML check and `verify_live.py` pass. A live QA visit's recording appeared in PostHog under its visit ID.
- **Branch:** `codex/instaplaque-session-replay-20261026` (`dafaf9d`, `1b582dd`), based on the live 3D stake release
  `29c4522`.
- **Live:** dpl_ogT7gvhE6aZ9EfUbRrLcb55ekVN9 (instaplaque-khphcqp8i, `index-B_3dEwRQ.js`).
- **Rollback:** promote dpl_9JbKwkHiX4takXcyKpfxJAdfDvyp (instaplaque-hdusrgc6v).

## 3D ground stake fades out, head leans back: LIVE — 26 October 2026, 10:08 UTC

- **Why:** the owner (msg 6541): "fade it out in 3d so doesnt look like its short"; "the stake head is like angled
  back a touch not totally straight so as to present the plaque better".
- **What changed** (`components/ThreePlaquePreview.tsx` only):
  - The stake's head leans back with the plaque, by the 3D view's usual 10° lean.
  - Below a bend at the foot of the board, the shaft stands upright and fades out over its lower part.
  - Plaques without a stake, the 2D drawings, photos, wording and prices are unchanged.
  - Details: the follow-up section of `docs/stake-length-2026-10-26.md`.
- **Branch:** `codex/instaplaque-stake-3d-fade-lean-20261026` (`40ec127`), based on the stake-length release `92776b6`.
- **Live:** dpl_9JbKwkHiX4takXcyKpfxJAdfDvyp (instaplaque-hdusrgc6v, `index-DgR9BCsh.js`).
  - On the test copy, the 3D check passes: head 10.25° back, shaft upright, opacity 255 → 0 with no hard edge.
  - The designer and no-stake checks pass on the test copy too.
  - Live: the HTML check and `verify_live.py` pass, and the tested files are byte-identical.
- **Rollback:** promote dpl_Bcm4CG9NfcFS1PLsnkUr9WmTDjLL (instaplaque-9uru8t8h6).

## The ground stake as it really is: LIVE — 26 October 2026, 09:48 UTC

- **Why:** the owner (msgs 6523, 6532): the stake is "just a 2mm thick kind of L shape bend thing - not these big
  chunky thing", 23.5 in long, "just put that in the description"; "you had the width ok", so the photos stay.
- **What changed:**
  - The wording gives the length, 600 mm (23.5 in), in the designer's stake option and the tree page's "Fix it
    beside the tree", which no longer says "chunky".
  - The 3D proof draws 2 mm sheet bent into an L (30 mm face) instead of a solid 30 mm post.
  - The owner's order emails say "2 mm L-shaped, 30 mm wide, 23.5 in long", not "30 mm square".
  - The 2D drawings, the photos and the AI preview prompt are unchanged.
  - Details: `docs/stake-length-2026-10-26.md`.
- **Branch:** `codex/instaplaque-slim-stake-20261026` (`9da66c5`, 3D hairline fix `5d0badb`), based on the live tree
  board-and-stake release `1a802f8`.
- **Live:** dpl_Bcm4CG9NfcFS1PLsnkUr9WmTDjLL (instaplaque-9uru8t8h6, `index-BKV4C7q8.js`).
  - The test copy's checks pass: static HTML, designer and 3D in Chrome, emails, server checkout.
  - The live HTML check and `verify_live.py` pass, and IndexNow was pinged.
  - The live files are byte-identical to the tested ones.
- **Rollback:** promote dpl_8cNFnsp71iWeN1vUAWXiqq55y6pD (instaplaque-5rlsj2we1). No ad depends on it.

## Tree page priced on the oak board and ground stake: LIVE — 26 October 2026, 09:17 UTC

- **Why:** the owner (msg 6506) asked for the tree page to show that each plaque has a board, and to include the stake,
  "because you kinda need it for this product".
- **What changed:**
  - The tree page's size table draws each plate on its oak board and stake, and prices both in: A5 £190 steel, £200
    brass, £213 aged brass.
  - Each price opens the designer on that plaque on the board and stake (`/design?backing=stake&plaque=<slug>`).
  - Its from-price, "Design online", the photo caption and the memorial and garden "By a tree" tiles follow it.
  - Details: `docs/tree-stake-prices-2026-10-26.md`.
- **Branch:** `codex/instaplaque-tree-stake-prices-20261026` (`2b770cf`), based on the live prices-at-a-glance
  release `5e996b2`.
- **Candidate:** `instaplaque-5rlsj2we1` (dpl_8cNFnsp71iWeN1vUAWXiqq55y6pD, `index-BaBqo9MQ.js`).
  - The build and postbuild checks pass.
  - The static HTML check of 9 pages and the browser check on computer and iPhone pass.
- **Live:** promoted at 09:17 UTC on the owner's "yeah go live" (msg 6519). The live HTML check, `verify_live.py` and
  IndexNow pass. The live bundle is byte-identical to the browser-checked one.
- **Tree ad:** `scripts/tree-ad-price-20261026.py apply` ran at 09:20 UTC. It now says "Tree Plaques From £190" and
  "Oak Board & Stake Included", and Google approved it within minutes.
- **Rollback:** promote dpl_ArHjbD1APPwCh2v82YFsTZt5XhZV (instaplaque-k902y8x8f), then run the ad script's `undo`.

## Prices at a glance: LIVE — 25 October 2026, 22:10 UTC

- **What it is:**
  - The homepage gets a table of 6 sizes × stainless steel / brass / aged brass, in place of "Brass or stainless
    steel?", and "from £58.50" in the top line.
  - Every category page's sizes are priced in all three metals.
  - On phones, the hero price moves above the photo.
  - Details: `docs/price-glance-2026-10-25.md`.
- **Branch:** `codex/instaplaque-price-glance-20261025` (`05d669d`), based on the live switch release below.
- **Live** as dpl_ArHjbD1APPwCh2v82YFsTZt5XhZV (instaplaque-k902y8x8f, `index-BoTQ0FU8.js`), on the owner's "Put it
  live" (msg 6463).
  - The live HTML tables on all 9 pages pass.
  - `verify_live.py` passes.
  - A live phone check of / and /memorial-plaques passes.
  - IndexNow was pinged for the 9 pages.
- **Rollback:** dpl_64YpihETGZ6BWVKsSUYDu9ELuSKT (the switch release).

## Owner's own browsers left out of the stats: LIVE — 25 October 2026, 21:37 UTC

- **What it is:** `?internal=on` marks a browser and `?internal=off` undoes it. A marked browser loads no Google tag,
  Meta pixel or Vercel analytics, and reports no Google purchase; its PostHog events are `is_test`. Details:
  `docs/internal-traffic-2026-10-25.md`.
- **Branch:** `codex/instaplaque-internal-traffic-20261025` (`5c5babb`, docs `8451cb8`).
- **Live** as dpl_64YpihETGZ6BWVKsSUYDu9ELuSKT (instaplaque-gvt8wqavd, `index-_-XqXkr5.js`).
  - `verify_live.py` passes.
  - The live switch check shows 0 Google, 0 Vercel and 0 Meta from a marked browser, with only test-marked PostHog
    events.
- **Rollback:** dpl_2xRXbiQMMK3ZNt3GeJYLGcaNjW2p (the ground stake release).

## Designer ground stake, and the tree page points to it — 25 October 2026, 18:57 UTC

- **Why:**
  - The owner (msg 6378): "Add a ground stake on the backing section of designer but only show it if they have
    already selected a backing board… Just show it like in Nicolas order".
  - Then (msg 6394), about the tree page's "ask us on WhatsApp for the stake": "Make that change then put it live".
- **What changed:**
  - In the designer's Backing step, a "Ground stake +£35" option appears once a wood board is added, and goes when
    the board goes.
  - It is drawn under the board in 2D and 3D. The plaque's own SVG, and with it every proof and production file,
    is unchanged.
  - The server prices and verifies it: `GROUND_STAKE_PRICE` and `hasGroundStake` in `services/checkoutPolicy.mjs`,
    with `productionSpec.groundStake`.
  - It shows in the checkout, the owner's order emails, the admin "Backing" row, the proof PDF and the AI preview
    prompt.
  - The tree page now says to add the stake in the designer, and links to `/design?backing=stake`. That opens the
    A5 plaque on the oak board and stake at £190, the Nicola order's price.
- **Branch:** `codex/instaplaque-ground-stake-20261025`, pushed. It is based on the live WhatsApp QR release
  `b381cdf` (see `docs/whatsapp-qr-desktop-2026-10-25.md`).
- **Live:** dpl_2xRXbiQMMK3ZNt3GeJYLGcaNjW2p (instaplaque-2si40x3v9, `index-D5_H_vMM.js`).
  - The candidate passed browser checks on computer, iPhone and 3D.
  - Live: `verify_live.py` and the live browser run pass.
- **Rollback:** `vercel promote` to dpl_JDHcpsNf3gxTY6m5ZuQmBzAwtPrQ (the QR release).
- **Details and checks:** `docs/ground-stake-2026-10-25.md`. Earlier 25 Oct releases (category pages, menu,
  product pages, QR) are described in `docs/*-2026-10-25.md`.

## Homepage tidy: each thing once — 24 October 2026, about 10:05 UTC

- **Why:** in msg 5860 the owner sent phone screenshots of the hero category tiles and of "Find your plaque.", and said: "This like repeats on the homepage like right next to each other. Low key feel like home page is a bit of a cluster fuck now huh?"
- **Before:** the phone homepage had 13 sections and was about 10,900 px long.
  - The four category photos appeared twice.
  - Three sections explained the same thing: designing online ("Your words. Your approval."), "Want us to take care of the design?" and "Tell us what you want. We'll make it."
  - A 01/02/03 strip and the hero's starting-price line repeated the hero and the tiles.
- **After:** the phone page has 9 sections and is 8,294 px long. Desktop has 10 sections and is 6,608 px long, down from 13 sections and 7,379 px.
  - **Categories:** phones keep the hero "What's your plaque for?" tiles. "Find your plaque." becomes the desktop grid (`.shop-home-collections`, hidden at 720 px and below) and sits straight after the hero.
  - On phones, the hero's separate starting-price and "See how the designer works" lines are hidden. The tile prices are now `TrackedPrice`, so `price_viewed` still fires on phones, and the tile footer carries the "see every size and price" link.
  - **One `HomeWays` section:** "Your words. Your approval.", with two cards side by side. One is "Design it yourself, online"; the other is "Want us to take care of the design?", with WhatsApp and the design form. The "Tell us what you want. We'll make it." line sits under both.
  - `ShopProcess`, the design-service block and `CustomAnything` are unchanged on the other pages.
  - The reassurance strip is removed.
  - Unchanged: quality, metals, the proof PDF, AI, portraits, FAQ and the closing section.
- **Branch:** `codex/instaplaque-homepage-tidy-20261024` (`6aaf759`, pushed), based on `61de829`.
- **Live** as `dpl_6ZY8UAg58abxM8VaKWRreKWMxQBY` (instaplaque-q44pidd7i).
  - Every postbuild check passed. The `check-live-seo` strings are kept, and the `check-design-request` heading and link are still there.
  - The staged copy was mirrored with `vercel curl` (HTML and built CSS) and screenshotted on phone and desktop.
  - On the live phone page, the collections and hero price compute to `display: none` and the tiles show.
  - `verify_live.py` (`BUNDLE=index-CoyOPz1a.js`) passes.
- **Rollback:** `vercel promote dpl_5ERTMmCmnWGU4rG2U69m4zSqef74 --yes --scope dullaghan31-3959s-projects`.

## Homepage quality and material section — 24 October 2026, about 08:57 UTC

- **Why:** in msg 5843 the owner said: "We need some homepage section about quality and material, like they etched in solid high quality metal in UK, Infilled by hand, laser cut for precision amazing quality etc". Portraits in Metal already had such a section and InstaPlaque had none, so it went here. The laser-cut line was also added to PIM's section.
- **What changed:**
  - `HomeQualitySection` (in `components/FeatureSections.tsx`): kicker "Made in the UK · Finished by hand", heading "Solid metal, made to stay.", and four points. The points are solid brass or stainless steel, etched into the metal, infilled by hand, and laser cut for precision.
  - The photo is real, not AI: Portraits in Metal's Millie close-up, from the same studio. It is copied to `public/site-images/quality/real-etched-detail-{600,1200}.webp`, with no AI tag.
  - It sits after "Find your plaque.". The "Brass or stainless steel?" section now follows it, so quality and material read as one block. The rest of the order is unchanged.