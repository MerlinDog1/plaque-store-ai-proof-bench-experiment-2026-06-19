# plaque-store-ai-proof-bench-experiment-2026-06-19: source and machine handover

## Product pages v3, "Tell us what you want" band: pictures and the proof PDF — PREVIEW ONLY, 31 October 2026

- **Why:** the owner (msg 8088): pictures of "more far out stuff" in that band so people know we make anything, and a
  picture of the proof PDF above "What you get.".
- **Branch:** same v3 branch, `codex/instaplaque-product-page-v3-20261030`. Not merged, not live.
- **What changed:** catalogue pages only: nine pictures of plaques made to order plus an "ask us" card (swipe on phones,
  two rows of five on computers), a shorter paragraph, and the sample proof's first two pages in step 02. Existing site
  pictures only (`scripts/make-custom-work-images.py` crops them). Details and checks: the 31 October section of
  `docs/product-page-v3-2026-10-30.md`.

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
- **Branch:** `codex/instaplaque-quality-section-20261024` (`ec62957`, pushed), based on the live tree release `15deca5`.
- **Live** as `dpl_iWG2pjpuC3iToJE8HyUM7cGvJ5k4` (instaplaque-b0ddlqdlm). The Vercel build ran every postbuild check.
  - The staged copy had the section in order, its CSS rules and byte-identical photos.
  - `verify_live.py` (`BUNDLE=index-C4Pag9-L.js`) passes: 175 product pages and 1,061 assets.
  - Live screenshots on desktop and phone were sent to the owner.
- **Rollback:** `vercel promote dpl_3VdWJAfa8gA3nEUmBXg9BbcDJuH5 --yes --scope dullaghan31-3959s-projects`.
- **Caption removed** at about 09:51 UTC. In msg 5855 the owner said "Remove this caption" about "A real etched plaque, photographed up close." The photo's alt text is kept, and the unused figcaption CSS is removed.
  - Commit `e66f790`, live as `dpl_5ERTMmCmnWGU4rG2U69m4zSqef74` (instaplaque-njyg1goun).
  - Checks: the staged copy had no caption and an intact section; the live page has no caption; a live phone screenshot shows 0 figcaptions; `verify_live.py` (`BUNDLE=index-D1Cs1H2A.js`) passes.
  - Rollback to the version with the caption: `vercel promote dpl_iWG2pjpuC3iToJE8HyUM7cGvJ5k4 --yes --scope dullaghan31-3959s-projects`.

## Tree close-ups remade with the designer's built-in realistic preview — 24 October 2026, about 07:10 UTC

- **Why:** in msg 5796 the owner asked whether the tree photos used "the plaques Ai thing that has the ai image stuff built in", because "it makes way better results that way". They hadn't: the close-ups below were made with my own prompt and a plate face I had drawn.
- **What changed:**
  - The same ten close-ups, remade through the designer's own pipeline. The plate face is the designer's stencil (`svgToPngBase64`, via `output/catalogue-wording/render-wording-stencils.cjs`), and the photo is `generateRealisticView` (`gemini-3.1-flash-image-preview`, 4K, built-in prompt unchanged). The scene brief carries the close-up framing, no people, and the Nicola mount.
  - New script: `scripts/generate-tree-closeups.mjs`.
  - The photos are in `public/site-images/tree-plaque-photos/` (a new folder, so phones fetch them fresh). `tree-plaques/` is removed.
  - The lettering now follows the designer's layout exactly: the previous set's italic small lines, and the acer's stray italic line, are gone.
- **Spend:** about $3.02 on the Gemini key (20 pictures at about $0.15), plus the checker.
- **More:** see [docs/tree-scenes-2026-10-24.md](docs/tree-scenes-2026-10-24.md).
- **Live** at about 07:13 UTC as `dpl_3VdWJAfa8gA3nEUmBXg9BbcDJuH5` (instaplaque-eybvr7w6r), from `9a8f235`. The Vercel build ran every postbuild check.
  - The staged copy was checked with `vercel curl`. The tree page links 21 new files and the garden page 8, with no `tree-plaques/` links. All 30 photos match the repository byte for byte, the share image is the cherry, and the old folder returns 404.
  - `verify_live.py` (`BUNDLE=index-zBn8nx0p.js`, now aware of `tree-plaque-photos/`) passes on 175 product pages and 1,061 linked assets. `/site-images/tree-plaques/` returns 404.
- **Rollback:** `vercel promote dpl_7kR3o75nbkb5ofso99srcKyf9ZWX --yes --scope dullaghan31-3959s-projects`, which brings back the previous close-ups.

## Tree page photos as close-ups — 24 October 2026, about 06:40 UTC

- **Why:** at 06:15 (msg 5778) the owner sent the Nicola proof illustration and said: "Just have them all be regular close ups like this, don't need the whole scene around it".
- **What changed:**
  - Ten close-up photos with no people, in `public/site-images/tree-plaques/memorial-tree-plaque-<tree>.webp`.
  - Each shows its A5 plate on the oak board and black steel stake, filling about half the frame, with the young tree beside it.
  - The `tree-scenes/` photos from the redo below are removed. The tree page hero, the tree and garden captions and alt text, and the sitemap image entries are updated.
- **Spend:** about $1.45 on the Gemini key.
- **More:** see [docs/tree-scenes-2026-10-24.md](docs/tree-scenes-2026-10-24.md).
- **Live** at 06:29 UTC as `dpl_7kR3o75nbkb5ofso99srcKyf9ZWX` (instaplaque-e90ulyu1o), from `5542845`. The Vercel build ran every postbuild check.
  - The staged copy was checked with `vercel curl`: 10 close-ups on the tree page and 4 on the garden page, no old photos, no people in the alt text, the photo bytes match, and the share image is the cherry close-up.
  - `verify_live.py` (`BUNDLE=index-Cwtd2rjz.js`) passes on 175 product pages and 1,061 linked assets. `/site-images/tree-scenes/` returns 404.
- **Rollback:** `vercel promote dpl_GQrPSjbByYpZxUENobdgXkWXgN5F --yes --scope dullaghan31-3959s-projects`, which brings back the scenes with people.

## Tree page photos redone on the Gemini key — 24 October 2026

- **Why:** in msg 5762 the owner said several of the overnight tree scenes "make zero sense", and asked for the Gemini key and the Nicola order's oak board and black steel ground stake in every photo.
- **What changed:** ten new photos in `public/site-images/tree-scenes/` (the old `scenes/` folder is removed). Each shows an A5 plate with four caps on a 235 × 173 mm oak board and one 30 mm square black stake at the foot of the tree, at true scale. The tree and garden captions, the tree page hero, the fixing text and FAQ, the sitemap images and `llms.txt` are updated to match.
- **Branch:** `codex/instaplaque-tree-scenes-20261024` (`8ff4088`).
- **Spend:** about $1.90 on the Gemini key.
- **Live** at 06:09 UTC as `dpl_GQrPSjbByYpZxUENobdgXkWXgN5F` (instaplaque-1jey5msee). The Vercel build ran every postbuild check, and the staged copy was checked with `vercel curl` before it was promoted.
  - `verify_live.py` with `BUNDLE=index-DqxGpN0l.js` passes: 175 product pages, and 1,061 linked photos, images and PDFs (including the 21 tree-scene files) match the repository.
  - No page links to `site-images/scenes/`.
- **Rollback:** `vercel promote dpl_8Rbi8zC7Wg9w1aQqz5qKCKxgeWjb --yes --scope dullaghan31-3959s-projects`. That is the overnight release with the old scenes.
- **More:** see [docs/tree-scenes-2026-10-24.md](docs/tree-scenes-2026-10-24.md).

## Overnight catalogue and contact upgrade: LIVE — 24 October 2026, 05:30 UTC

- **What it is:** the owner's msg 5736 overnight work: 173 new catalogue photos with their own wording (22 with portraits), 10 tree and garden scenes, per-product flat images and sample PDFs, per-product copy and questions, the WhatsApp "we'll make it" band, and the new tree, sizes and wording-guide pages. See [docs/overnight-catalogue-2026-10-24.md](docs/overnight-catalogue-2026-10-24.md).
- **Branch:** `codex/instaplaque-overnight-20261023`, pushed. It is based on `b0f2970`, which contains the previously live `cfa4e94`. The release was built from `17a465b`; `79f3986` and later commits change only this handover.
- **Checks before release:** the local build, all postbuild checks and `tsc --noEmit` pass. `check-merchant-browser.cjs` passes 16 desktop and mobile checks on 12 representative pages. Phone screenshots of the home, tree, sizes, wording and two product pages show no page errors. The candidate's `index-Eh3SouRG.js` was byte-identical to the local dist (`vercel curl`).
- **Released:** the owner said "Push changes live" (msg 5757). Production was still `dpl_5gu3AbcGzKWFSYNkZws7Cz8SZ9Wd`, so nothing newer was overwritten. `vercel promote dpl_8Rbi8zC7Wg9w1aQqz5qKCKxgeWjb` (instaplaque-12cb89mx3) succeeded at 05:30:12 UTC, and `vercel inspect instaplaque.co.uk` returns that id.
- **Live checks** (`workspace/output/instaplaque-overnight-20261024/verify_live.py`, PASS):
  - The home page serves `index-Eh3SouRG.js`. www returns 308 to the apex, and `/tree-plaques` returns 308 to `/tree-memorial-plaques`.
  - The new pages and the category pages return 200, with the "We'll make it" band and no ALEX MORGAN.
  - All 175 product pages return 200 with no ALEX MORGAN and no `merchant-photo` links.
  - All 1,040 photos, flat images, scenes and sample PDFs those pages link to match the repository copies byte for byte. The old `/site-images/merchant-photo/` returns 404.
  - The feed has 175 items: every `image_link` has `?v=2`, and 173 have a `catalogue-photo` additional image. `sitemap.xml` has 24 URLs and `sitemap-products.xml` 175. The IndexNow key file is served.
  - `/api/gemini/health`, `/api/supabase/health` and `/api/stripe/config` return 200 and report configured, with Stripe still in live mode. `/api/health` is not a real route: it returns the app's HTML on this and the previous release alike.
  - No headless-browser check was run on the live domain, because the account was at 3.3 GiB of memory. The identical files passed the browser checks locally.
- **Google, 05:35 UTC:** both sitemaps were submitted to Search Console (204, pending). Merchant Center was asked to fetch the feed (200). IndexNow accepted all 199 sitemap URLs (202). Log: `workspace/output/instaplaque-overnight-20261024/post-release-submit-20261024.log`.
- **Ads, 05:36 UTC:** the stronger search campaign was created **PAUSED**: 24385756716 "InstaPlaque | UK | Search | Top of page test (paused, Oct 2026)", £20 a day, ending 31 Oct. Nothing is running, and £0 has been spent today. The record and undo steps are in `projects/instaplaque-google-ads-memorial-20261009/evidence/paused-campaigns-2026-10-24.md`.
- **Rollback:** `vercel promote dpl_5gu3AbcGzKWFSYNkZws7Cz8SZ9Wd --yes --scope dullaghan31-3959s-projects` (the 23 Oct "Design on WhatsApp" release). It restores the ALEX MORGAN photos, the old feed images and the old PDFs, and removes the new pages from the site but not from the sitemaps already sent to Google.

## "Design on WhatsApp" buttons — 23 October 2026

- **Label:** the owner chose "Design on WhatsApp" over "Chat on WhatsApp" (msg 5654). It now pairs with "Design online". The change covers all five WhatsApp buttons in `components/Shopfront.tsx`: the home hero, the design-service section, the home closing, the product hero and the product closing. The sticky mobile bar still says "WhatsApp".
- **Unchanged:** the pre-filled message ("Hi InstaPlaque, I'm interested in a plaque", plus the reference) and the link.
- **Phone fit:** the longer label wrapped onto two lines in the hero at 360–393 px and made both buttons 67 px tall. Under 720 px, `shopfront.css` now sets the hero button text to `min(13.5px, 3.3vw)`, the icon to 16 px and the gap and inline padding to 4 px.
  - Measured in Chrome with Arial metrics (Liberation Sans): one line and 50 px tall at 360, 375, 390, 393, 412 and 430 px; 54 px on desktop.
  - It still wraps at 320 px.
- **Released:** the branch `codex/instaplaque-design-on-whatsapp-20261023` (`cfa4e94`) was built from the live 21 Oct release (`675cfb1`) plus docs. The build and postbuild checks passed.
  - The candidate `dpl_5gu3AbcGzKWFSYNkZws7Cz8SZ9Wd` (instaplaque-rbvemgttz) had JS and CSS byte-identical to the tested local dist (`index-C7dmdx6S.js`, `index-C9pByEAQ.css`). It was promoted about 10:41 UTC on 23 Oct.
  - Live checks:
    - Home and /memorial-plaques show the new label (none of the old).
    - www returns 308 and /api/health returns 200.
    - A browser check of the live site at 360, 390 and 1280 px has every new-label button on one line.
  - **Rollback:** `vercel promote dpl_Egizxth8TEzLsDZy9Uh6hx8ybyJU`, the 21 Oct release.

## Catalogue photo redo paused — 21 October 2026, about 11:48 UTC

- The catalogue photos are being redone with each plaque's own wording, on Codex (gpt-image-2). The work is on Cody's VPS only, in the untracked `output/catalogue-wording/`.
- **Progress:** 40 of 168 made. 39 were checked and sent to the owner, including scalloped and no-border designs.
- **Final reject:** `polished-stainless-150x75-rect-plaque`, whose plate proportions kept coming out wrong.
- **128 to go,** paused at the owner's request.
- **Nothing is published.** The live pages still show this morning's Gemini photos, which all say "ALEX MORGAN".
- **Planned once the photos are done (owner-approved):**
  - matching sample PDFs
  - a "Shop by size" page
  - all 175 pages in the sitemap
  - the photos as the Shopping image
  - ProductGroup variant markup
  - one release, then sitemap submission in Search Console
- **To resume,** follow `output/catalogue-wording/PROGRESS.md` on the VPS. Don't regenerate or replace catalogue photos from another machine in the meantime.

## Catalogue pages: photos, specifications, links and sample proofs — 21 October 2026, about 07:20 UTC

- **Every one of the 175 exact-offer pages now has:**
  - a realistic photo of its configuration, in a gallery whose second image is the flat feed render (still the Product schema image and Merchant `image_link`)
  - a "What you get." specification with finish and size notes
  - links to the other sizes, finishes and backings, with prices
  - its own three-page sample proof PDF
- Brass and stainless pages list every size by finish, and the materials cards link to the A5 pages.
- The realistic-preview stencil keeps the wood colour.
- The sample proof's page 3 template no longer hits the footer (`?v=4`).
- Commit `675cfb1`. Live `dpl_Egizxth8TEzLsDZy9Uh6hx8ybyJU`; rollback `dpl_5hQcQi8bCd9VretcmsUVcWytyVmg`.
- See [docs/catalogue-pages-2026-10-21.md](docs/catalogue-pages-2026-10-21.md).

## Review fixes live — 21 October 2026, about 05:57 UTC

- Trader address (no house number) sitewide, with the owner's name only on Terms and Privacy (with the ICO).
- "3 working hours", and "Have us design it – free proof" on every category and product hero (prefilled form).
- Phone heroes with the buttons above the fold; no AI captions.
- Product schema on product pages only, with category breadcrumbs.
- /quote 301s to /custom-plaques; descriptive About and Materials H1s.
- Branch `codex/instaplaque-review-fixes-20261021` (`931d4dd`). Live `dpl_5hQcQi8bCd9VretcmsUVcWytyVmg`; rollback `dpl_2C2nqMKWWAW6QGbJg3nCCL9xaYhb`.
- See [docs/review-fixes-2026-10-21.md](docs/review-fixes-2026-10-21.md).

## Proof and AI image URLs versioned — 20 October 2026, about 23:00 UTC

Proof preview and AI images now carry `?v=3` (`featureImageVersion` in `components/FeatureSections.tsx`); bump it when one is redrawn under the same name (`22d7e0c`). Live `dpl_2C2nqMKWWAW6QGbJg3nCCL9xaYhb`; rollback `dpl_7ozNAjg73UxbARZppVd1ZTodGeBx`.

## Sample proof PDF link versioned — 20 October 2026, about 22:54 UTC

Links to the sample proof now carry `?v=3`, so browsers that opened an older copy fetch the latest; bump it when the PDF changes (`2a821d5`). Live `dpl_7ozNAjg73UxbARZppVd1ZTodGeBx`; rollback `dpl_FpYhtGvBHURdPnnkkGsDE15H8jJH`.

## Sample proof border traced from the chosen rose plaque — 20 October 2026, about 22:37 UTC

The proof's border is now AI line art of the chosen photo's border, traced to vectors with potrace and masked clear of the screw caps (`45731dd`). Live `dpl_FpYhtGvBHURdPnnkkGsDE15H8jJH`; rollback `dpl_BsVM7nacMAiyb29Pz7yt4LEaaNgf`. See [docs/portrait-ai-pages-2026-10-20.md](docs/portrait-ai-pages-2026-10-20.md).

## AI page uses the owner's preferred rose plaque — 20 October 2026, about 22:26 UTC

"The plaque we make" is now the fuller rose-and-vine photo (red vine tint retouched), and the sample proof's border and lettering were redrawn to match (`ccd859a`). Live `dpl_BsVM7nacMAiyb29Pz7yt4LEaaNgf`; rollback `dpl_6oFFiLU8XivENvzXna1bkGtoYbJH`. See [docs/portrait-ai-pages-2026-10-20.md](docs/portrait-ai-pages-2026-10-20.md).

## AI page house-sign illustration re-shot — 20 October 2026, about 22:16 UTC

The Willow Cottage "made in metal" picture now shows the sign centred and flat on the wall (`576e779`). Live `dpl_6oFFiLU8XivENvzXna1bkGtoYbJH`; rollback `dpl_7SNmV88h5iMYaW1AqTUrsu4LFgQf`. See [docs/portrait-ai-pages-2026-10-20.md](docs/portrait-ai-pages-2026-10-20.md).

## Phone contact bar appears on scroll — 20 October 2026, about 22:09 UTC

The fixed phone bar now slides up only once the page's own buttons have scrolled off the top, and glows once on WhatsApp the first time (`8bbc657`). Live `dpl_7SNmV88h5iMYaW1AqTUrsu4LFgQf`; rollback `dpl_6wifdbq5WGwSzQhU3gMbXnhJ9ZRd`. See [docs/portrait-ai-pages-2026-10-20.md](docs/portrait-ai-pages-2026-10-20.md).

## Portrait plaques and AI design pages live — 20 October 2026, about 21:52 UTC

- **New pages:** `/portrait-plaques` (real Millie photos plus Portraits in Metal examples, with a
  subtle UTM link to its free sketch) and `/ai-plaque-design` (generated concept → engraved plaque
  pairs).
- **Sample proof PDF:** `public/samples/instaplaque-sample-proof.pdf`. It is shown on home, the AI
  page and how-it-works, and linked from the design form.
- **Homepage:** proof, AI and portrait sections replace the sister-site note.
- **Navigation and links:** a header Portraits link, footer links and internal links.
- **Wording:** no sister or sole-trader wording (owner msg 4908).
- **Design form:** shrinks images over 2 MB.
- **Search:** Service and FAQ schema, share cards, sitemap entries and llms.txt.
- **Release:** branch `codex/instaplaque-portrait-ai-pages-20261020` (`fd59c68`). Live
  `dpl_6wifdbq5WGwSzQhU3gMbXnhJ9ZRd`; rollback `dpl_BDFdvxSqAhkRNsPn5cCALgNzGPwd`. See
  [docs/portrait-ai-pages-2026-10-20.md](docs/portrait-ai-pages-2026-10-20.md).

## Lower-page CTAs follow the WhatsApp route — 20 October 2026, about 21:00 UTC

The home "Want us to take care of the design?" section, the closing bands, the FAQ link and answers, the memorial wording link, the designer guide, about and contact now lead with WhatsApp, with the design form second. The duplicate "Or send a design brief online" product-hero link is gone (`49febe1`).
Live `dpl_BDFdvxSqAhkRNsPn5cCALgNzGPwd`; rollback `dpl_AiAD9heNUrrWHdRE2PSUEfhfRpqu`. See [docs/home-routes-2026-10-20.md](docs/home-routes-2026-10-20.md).

## Product-page CTAs and branded share images live — 20 October 2026, about 20:30 and 20:43 UTC

Product pages now use the "Personalised …" H1s and the homepage buttons: "Design online", "Chat on WhatsApp", the ChatGPT prompt and the free-proof note (`d1169d4`). Home and the seven indexable category pages share branded 1200 x 630 JPG cards (`6298ff1`, generator `scripts/generate-og-images.mjs`). Branch `codex/instaplaque-product-ctas-20261020`.
Live `dpl_AiAD9heNUrrWHdRE2PSUEfhfRpqu`; rollback `dpl_J47PdMVYUD3rEaiXFcW7ExB3ZywT`, then `dpl_4fxkjCKyECqXUTuSnjoFjKxh1BcY`. See [docs/home-routes-2026-10-20.md](docs/home-routes-2026-10-20.md).

## Homepage routes and WhatsApp push live — 20 October 2026, about 20:10 UTC

Home H1 "Personalised brass & stainless steel plaques" with the old slogan as tagline; "Design online" and "Chat on WhatsApp" as equal first choices; a "Made a design in ChatGPT?" prompt; phone occasion tiles; a teal WhatsApp bar; and the generic WhatsApp opener. Branch `codex/instaplaque-home-routes-20261020`.
Live `dpl_4fxkjCKyECqXUTuSnjoFjKxh1BcY`; rollback `dpl_9owv5L5wmkfjBNBTXRFTxPu3r7AP`. See [docs/home-routes-2026-10-20.md](docs/home-routes-2026-10-20.md).

## Homepage H1 keywords live — 20 October 2026, about 16:45 UTC

The home H1 now reads "Custom brass & stainless steel plaques: Some words deserve to stay." (`9e750f4`), with no visual change.
Live `dpl_9owv5L5wmkfjBNBTXRFTxPu3r7AP`; previous `dpl_45KMn4o2JGaRuXhQSVTi6U3FxG4K`. Details in docs/contact-followups-2026-10-20.md.

## Phone hero photo live — 20 October 2026, about 16:40 UTC

Phones show the hero photo under the home headline and under product titles (`925d2ad`); desktop unchanged.
Live `dpl_45KMn4o2JGaRuXhQSVTi6U3FxG4K`; previous `dpl_ED4Br3NUyBhcHemAbzLHFyWN3zb7`. Details in docs/contact-followups-2026-10-20.md.

## Contact follow-ups live — 20 October 2026, about 16:20 UTC

Owner asked for every change possible without them, using 07464 843841. Branch
`codex/instaplaque-contact-followups-20261020` (`eaff934`, `a232517`) on top of the WhatsApp release.
- Phone and schema telephone are now 07464 843841.
- Enquiry text is singular ("a memorial plaque").
- WhatsApp tracking reads the configured number.
- On phones the cookie banner is compact and sits above the contact bar (same wording, equal choices).
- Download proof PDF ignores double taps and records a failure reason.

Checks and the local and live 390/1440 browser checks passed.

Live is `dpl_ED4Br3NUyBhcHemAbzLHFyWN3zb7` (`index-4sjvs3Ge.js`); rollback is
`dpl_24vUHJbRcoE9vHGs2XX9Mw7LfTSK`.

GA4 now has contact custom dimensions, `whatsapp_click`/`email_click`/`phone_click` derived events, and
those plus `enquiry_submitted` as key events. The GA4 to Ads link is still missing (owner).
See [details](docs/contact-followups-2026-10-20.md).

## WhatsApp/email and tracking live — 20 October 2026, 12:16 UTC

Owner reviewed the preview, then authorised "push to live".
`codex/instaplaque-contact-options-20261020`, application
`6488ab19a9e6b6f0558c5fcdea6bad44686b5391`, adds the confirmed WhatsApp number
07464 843841 and hello@ email options beside the designer, a mobile contact bar,
consented enquiry references and GA4 funnel observations. Typecheck, analytics/
consent/purchase checks, build/postbuild and 320/390/1440 px browser checks pass.
Published source `ac297ac7d0a858cf1ca719f8c665711c00146585` is READY on canonical as
`dpl_24vUHJbRcoE9vHGs2XX9Mw7LfTSK`; rollback is `dpl_F5LqMJKiDQNZE91JogdYbb81sAUn`.
Candidate/local/live bundle hashes match. Hosted synthetic proof save/read against
the migrated Supabase/private R2 passed and its fixture was removed. Live mobile
navigation, contact links and health checks passed. Google Ads account linking/
conversion settings remain unverified; backend configuration is unchanged. See
[scope, release evidence and next step](docs/contact-options-2026-10-20.md).

## Admin order list fixed — 16 October 2026, about 23:20 UTC

The owner's admin could not load orders: `GET /api/admin/orders` returned 500. The list selected full
`plaque_state`/`proof_package` for every order, and 16 older orders still hold inline proof artwork (up to 5.2 MB
each), so building the list took 17.2 s and 42 MB in Postgres, past the 8 s `authenticator` statement timeout.
This was the fault diagnosed on 7 October; its prepared fix (`codex/admin-list-timeout`) had never been released.
Owner: "Deploy". Cherry-picked `70e3f20`, `eb54620`, `aaecde3` onto live `e55706a` as `f6c6f59`, `2750d83`,
`2da34b3` on `codex/instaplaque-admin-list-release-20261016` (only HANDOVER conflicted). The list now reads
lightweight summaries (live DB equivalent: 79 rows, 117 KB, 0.79 s); artwork loads only when an order is clicked.
`check:admin-orders`, the 390/1440 px admin UI check, typecheck and build with postbuild checks passed. Live READY
`dpl_F5LqMJKiDQNZE91JogdYbb81sAUn` (bundle `index-2XO612Kq.js`, same as the tested local build); rollback
`dpl_HPNDR4HhTj31LiTChGgaXBYeJpqq`. Authenticated list check awaits the owner's admin login. The inline legacy
artwork is untouched.

## Production outlines match the preview — 15 October 2026, about 10:23 UTC

A paid order's production PDF and emailed proof showed a lumpy "fi" that the customer never saw. Production
outlining also used older font files than the preview, shifted script fonts, and dropped latin-ext characters.
`cf7f79098c45d7849c41623c51614dccb34dd8f5` on `codex/instaplaque-ligature-fidelity-20261015` (draft PR 20, CI
passed) makes the preview and the outlines share one pinned font catalogue and outlines ligatures as drawn.
`npm run check:glyph-parity` compares every font both ways. Live READY `dpl_HPNDR4HhTj31LiTChGgaXBYeJpqq`;
rollback `dpl_HQBYhNJxVhe5mcBrcKCBi7afd4Cp`. Read [the causes, change, check and release record](docs/preview-production-fidelity-2026-10-15.md).

## Google ad clicks kept for GA4 — 15 October 2026, about 05:20 UTC

GA4's page address dropped `gclid` and the other Google click IDs, so ad clicks showed as `google / organic` and
sales could never be credited to the ads. `4c36a4e` on `codex/instaplaque-ad-click-attribution-20261015` keeps them.
Live READY `dpl_HQBYhNJxVhe5mcBrcKCBi7afd4Cp`; rollback `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7`. The GA4 property still
needs its Google Ads link (owner, as Ads admin). Read [the finding and release record](docs/google-ad-click-attribution-2026-10-15.md).

## Account corrections released — 13 October 2026, 14:56 UTC

Owner accepted the audit's proposed fixes. The existing live Stripe webhook now
has completed, expired and both asynchronous payment events, independently read
back with all other endpoint settings preserved. Application
`0937ccb67ba1410dea2b5a3b06f0f8e582606a5e` on
`codex/instaplaque-account-fixes-20261013` excludes marked live/no-fulfilment tests
from Google purchases and corrects private-test wording. CI38416357936 passed;
canonical READY `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7`, 13 public hashes match the
verified candidate. Ordinary purchases and Meta/consent behaviour are retained.
Actual webhook/Google/email receipt remains unverified. Extra methods, old-order
corrections, replacement address and campaign changes remain held. Read
[the release and rollback record](docs/account-corrections-2026-10-13.md).

## Site audit fixes - 13 October 2026

Owner authorised careful fixes and release. Task branch
`codex/instaplaque-audit-fixes-20261013` includes the pending Consent Mode changes
and verified production source. Security/lifecycle/rate migrations already
applied to the migrated Supabase project; both other-brand cron jobs retained.
See [scope, tests, remaining account work and rollback](docs/site-audit-fixes-2026-10-13.md).
Application `57e09c6ab7f5c572694e3eb2c051d5900c816f29` is live on canonical at
READY `dpl_24YZazbstYN3S9EgkrtGhTdA6ZNZ`. PR18 / CI38407857350 pass (CI-only
follow-up `1330232bd5fe035ca8160d72c0349c38fa060dc6` has identical application
code). Hosted asset hash, health, route HTML, mobile proof form and private RPC
permissions verified. The existing admin status compatibility issue was also
fixed by additive migration `20261013160000` after rollback testing; historical
orders are unchanged. See the report for account-access gaps and rollback.

## Consent follow-up Tasks2–4 — 13 October 2026

Owner4527 requests purchase audit, Cookies/Privacy wording and real consent
checks. Application/checkpoint `f9a459bd53faa4fc3aa6bff4eb435bf876c6289f` on
`codex/instaplaque-consent-v2-20261013` passes
[CI38399150001](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38399150001).
**Prepared, not deployed.** Continue PR17; no new checkout/dependency copy.

Real public Google JS with ALL collection intercepted verifies G100/no Google
cookies, native-link gclid/_gl passthrough, later G111/cookies, withdrawal and
private exclusions. Fixed bare public React pushState navigation dropping click
IDs, with no storage/private reference copying; designer/refresh regression
passes. Exact Task1 index block and Meta/banner/purchase code are unchanged.
Policies now distinguish public cookieless Google measurement from optional
cookies; PostHog/Vercel/Meta and the purchase event remain opt-in.

Purchase actually sends GA4 `purchase` to `G-FKP17EXNBX`, not direct Ads
`AW-18288208905/LABEL`. GBP paid amount, stable digest, original GA client and
unchanged landing `_gcl_aw` are verified; reload dedupe passes. The purchase
request itself does not contain TEST123. October9 notes describe a GA4-imported
Ads action; no fresh import/account receipt is verified. Do not invent a label
or claim rejected-consent purchases work. Live baseline still has old consent
gate. See [exact audit, wording and evidence](docs/google-consent-audit-2026-10-13.md).

## Google Consent Mode v2 preparation — 13 October 2026

Owner4526 supplies the exact public Google tag replacement and asks for remaining
React consent gates, explicitly retaining Meta opt-in. Work is on
`codex/instaplaque-consent-v2-20261013`, based on product-policy docs checkpoint
`2c5cd37` and independently verified live `dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`.
The exact block is first in head; public Google loading no longer waits for
consent, while denied defaults, events, URL redaction and private exclusions
remain. The sole ga-disable assignment is removed with the old block.

**Prepared, pushed and tested; not deployed.** Application/checkpoint
`d0891021c881e910c24da5128490fecdf370f665` passed
[CI38397272755](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38397272755):
typecheck/build, exact source/generated script order, real built React banner
Accept/Reject/saved choices, and catalogue/designer regressions. Google/Meta
delivery was locally stubbed. [PR17](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/17)
targets the live-source product-policy branch. No new permission to publish was
inferred from the code-only Task1 request. The separate Google purchase helper/frame
still requires `instaplaque-meta-consent=yes` and is unchanged. This is not a full
purchase-modelling or Ads-receipt fix. Meta/banner/PostHog and all checkout code
are unchanged. See [scope, audit and checks](docs/google-consent-v2-2026-10-13.md).

## Latest production release — 13 October 2026, product policy metadata

Owner4516 requested fixing the live site's yellow shipping/returns/delivery
warnings. Application `f7dcff058c885b3566e71b9e6b805f0f2bb6ebd6` on branch
`codex/instaplaque-product-policies-20261013` is deployed/promoted as
`dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`:
https://instaplaque-o8s9f1cn5-dullaghan31-3959s-projects.vercel.app.
Canonical READY identity independently verified. At11:23UTC all22 public checks
matched the protected candidate, including catalogue/policy HTML and
`index-CpAc9MaU.js`/`index-Bxw_YNF_.css` matching exact-source CI.

Existing Merchant policies were read, not changed: GB free shipping, weekday
handling/transit, one-day transit, existing personalised-plaque returns policy.
Initial/client physical-product data now consistently carries those policies,
with exact variant production estimates and the5–15day family range. The
existing delivery guide describes the already-approved carrier-service estimate.
No pricing/feed/checkout/tracking or designer layout change. Returns wording and
designer body match the predecessor; public feed is byte-identical.

CI38389208807 passed full typecheck/build, all360 physical Offer occurrences
across181 pages,175 catalogue/feed variants,11 hydrated product/catalogue routes
plus policy/designer routes, and the existing five-viewport/no-JS popup checks.
Vercel build and public read-only HTTP/hash checks passed. No fresh hosted browser
on the memory-constrained VPS. Google warning clearance awaits its recrawl and
owner's Validate fix; no Search Console submission was performed.
See [release evidence and rollback](docs/product-policies-2026-10-13.md).

## Previous production release — 13 October 2026, designer FAQ pop-up

Owner message 4495 corrected the published presentation: no added designer page
scrolling; help should open on click in a pop-up/expander. Publication authority
from message 4488 carries through this requested correction.
Application `588afdb38957333c873a2acf3c4743c764111069` is deployed/promoted as
`dpl_6o1LFnmir5w6VjKZdgqt5bRAotAu`:
https://instaplaque-o99inec90-dullaghan31-3959s-projects.vercel.app.
Canonical READY identity and candidate/public artifact equality were verified
at 10:11 UTC. The live JS is `index-BGL2dIT7.js`, CSS `index-Bxw_YNF_.css`;
both names match the exact-source browser-tested CI build.

Guide & FAQs now opens a native modal, closed initially, with expandable FAQs
first and a separate tips/examples disclosure. Close, Escape, backdrop and
return actions restore focus and preserve the inscription, step and URL.
The designer main is fixed; only the dialog's reading area and existing control
panels scroll. Shared initial HTML and a readable no-JavaScript fallback retain
the SEO content. CI run 38380879128 passed typecheck/build/SEO and browser checks
at 320/390/820/1440 widths, short landscape and no-JavaScript. Mobile/desktop
screenshots inspected. The checks caught and fixed keyboard-boundary behaviour;
layout checks explicitly finish the pre-existing entrance animation.

Vercel build/static checks, hosted assets/images/sitemap and read-only backend
checks passed; no new live browser was launched on the memory-constrained VPS.
No Ads, database, payment, analytics configuration, PIM or indexing changes.
Immediate code rollback is prior `dpl_55MasQFh4ss1hW2kmJtTqvYVor51`, but that
restores the scrollable guide the owner rejected. See
[release evidence](docs/designer-seo-2026-10-13.md).

## Earlier production release — 13 October 2026, initial designer SEO

Owner message 4488 explicitly requested publication. Application source
`37c841974dc6b8fc33f6762d40be8d2896da6688` on
`codex/instaplaque-design-seo-20261013` is deployed and promoted as
`dpl_55MasQFh4ss1hW2kmJtTqvYVor51`:
https://instaplaque-f2nyd823o-dullaghan31-3959s-projects.vercel.app.
Independent canonical inspection confirms this READY deployment. At 09:48 UTC,
canonical and www `/design` returned the verified candidate's identical HTML,
`index-BjtrW2fO.js` and `index-DhjswPCu.css`; www redirects to the canonical host.
All three guide images, sitemap, robots and backend health/config checks passed.

The exact application revision had already passed full CI including mobile,
tablet, desktop and no-JavaScript interaction checks. Vercel's cloud build and
static SEO checks also passed. No additional local browser/build was started
because account memory remained above 3 GiB; hosted verification used read-only
HTTP checks and artifact hashes, not a fresh live-browser interaction run.
No database writes, payments, analytics configuration, ads, PIM changes or Google
indexing request occurred. Code-only rollback: promote the previous deployment
`dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi` through the existing InstaPlaque project.
See [the release evidence](docs/designer-seo-2026-10-13.md).

## Designer SEO preparation — 13 October 2026, before publication

Owner requested improvements to `/design`. Work is on
`codex/instaplaque-design-seo-20261013`, based on the verified live PostHog
release and handover checkpoint `8822391`. Production was independently checked
at `dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`, serving `index-BNGuODZU.js`.
The shared guide includes useful instructions, illustrative examples, material
links and FAQs in both initial HTML and the interactive page, without displacing
the full-height designer. Metadata and application/breadcrumb schema use one
source. The sitemap entry records the content update and its example images.

Typecheck, production build, static SEO and browser checks passed on the existing
pull-request CI runner, including 320/390/820/1440 widths and no-JavaScript
reading. Initial/client content and metadata match; guide navigation retains
wording and URL state. Screenshots were recovered and inspected; capture was
then adjusted to finish the existing fade-in animation before saving the image.
See [draft PR 15](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/15).
CI is used because the VPS account is above its 3 GiB headroom threshold. No local heavy job, live AI
call, customer action, analytics event, deployment or indexing submission is
part of the checks. Git deployment remains disabled. See
`docs/designer-seo-2026-10-13.md` for evidence and release next steps.

## Latest production release — 12 October 2026, consented PostHog analytics

Application source `c02abb4ba1bea240741a9435da2d1362df9f00da`, branch
`codex/instaplaque-posthog-20261012`, was reviewed, pushed, built as a protected
production candidate, verified, then promoted to
`dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`. Independent canonical inspection and both
canonical/www HTML confirm `index-BNGuODZU.js`. Candidate asset bytes matched
the tested build. Hosted synthetic proof save/read verified target Supabase
`fygweiynqkglmjwqlouc` and private R2; only its own fixture/objects were removed.

PostHog EU project 303026 now has an InstaPlaque-only dashboard 1017503 with
14 tiles and daily subscription 51654 to sales@tradeetching.com at 08:00 UTC,
starting 13 October. Ten exact rolling-24h charts, selected preceding-24h
comparisons, no AI summary/replay/upgrades/action alerts. Existing Sample Studio
subscription is untouched. Production QA ingestion (one visit, three pageviews,
one product view, one designer start and three steps) reconciled with native
charts and the event log; all nine events are unique and excluded from reports.
Ordinary report counts were zero at initial verification; no history backfill.

Typecheck, local/cloud builds, new analytics tests, Google purchase regression,
design-request/checkout/input-security checks and intercepted browser fixtures
passed. No real enquiry, payment, generation or customer notification was sent.
The owner-authorised first report completed in PostHog at 15:12:35 UTC with all
ten chart exports; per-recipient provider/inbox receipt is not exposed. See the
detailed release document. Do not send another without checking
the existing delivery history. Purchases require a consented paid return and
are not the full accounting ledger. New analytics permission is required;
legacy advertising acceptance alone does not activate PostHog.

Read [tracking, verification and limitations](docs/posthog-analytics-2026-10-12.md)
and [saved dashboard/subscription configuration](docs/posthog-dashboard-2026-10-12.json).
No backend environment was changed. Code-only rollback to
`dpl_6XcsgpUTxk5AG5uE9sG6xQg4Pf2H` retains migration/payment compatibility but
removes the new tracking and restores the earlier consent behaviour.

## Latest production release — 10 October 2026, £1 test designer entry

Owner message 3874 requested removal of the oversized quote obstacle for the
123 × 456 mm live checkout test. Isolated branch
`codex/instaplaque-test-designer-20261010` adds the exact-size designer/checkout
link to the existing owner-authenticated test page. Server payment, quote,
production and email guards remain. Unit/canonical checkout, TypeScript, build
and both mobile fixture suites passed. Application source
`d13eaf630c2fb6df879bf34281f2407c16dd5fdf` is deployed at READY
`dpl_6XcsgpUTxk5AG5uE9sG6xQg4Pf2H`. Public canonical/www serve the tested
`index-BU8PILNh.js`; hosted mobile fixture routing and ordinary-size regressions
passed with APIs mocked and external traffic blocked. Owner API401, private-file
hashes/headers, live payment configuration and backend health passed. No actual
payment/order write/email/Google receipt or Ads activation was performed.
Read [the correction and release record](docs/one-pound-designer-2026-10-10.md).

## Latest production release — 9 October 2026, owner-requested £1 live checkout

Owner message 3870 explicitly corrected the sandbox setup to an actual £1 live
payment. Work is isolated on `codex/instaplaque-live-pound-20261009`, based on the
sandbox deployment and docs checkpoint `9825fae88536fceaff2de20b8b56d2217f0c6570`.
See [the live checkout contract and release record](docs/one-pound-live-2026-10-09.md).
The earlier request to add `STRIPE_TEST_SECRET_KEY` is obsolete for this task.
Existing live keys are used; owner-auth/exact-size/production/email guards remain.
The owner enters their own card on Stripe. No Ads enabling is authorised.

Deployed source `5c84d666220c945d520d767ef6765732f416f231` at READY
`dpl_C2T7RfDVjnCyqNKituKMQxzXDx7X`. Canonical/www independently verified; hosted
`index-BCMhDUUS.js`, private page and Google frame hashes/headers match. Owner-only
API401, live Stripe configuration and Supabase/Gemini health passed. Unit,
canonical-checkout, purchase/privacy/consent/dedup, TypeScript, local/remote build
and mobile built-app fixture checks passed. No actual payment/order write/email
or Google receipt was performed. Next: owner signs in at `/checkout-test.html`,
allows measurement if desired, pays £1 with their own card and returns to the
confirmation page. Do not revert to sandbox-only or older unguarded code after a
live verification record exists; retain both production/email guards.

## Latest production release — 9 October 2026, purchase tracking

Owner explicitly requested Deploy after reviewing the prepared fix. Released
source 3a39b2c7a1acf4eba56598db7229c8c0cd28c090 from branch
codex/instaplaque-purchase-tracking-20261009 to the existing InstaPlaque project.
Canonical/www independently resolve to READY dpl_D4AADmY5ReLfHXXNvYYKAdTt1y7Z.
Main bundle index-0AfWYGxb.js and both purchase-frame files match the tested
build/source; frame noindex/no-referrer/no-store headers passed.
Implementation/test commit: f78a935963e994e5e49776850701c9f4066b7edd.
Focused TypeScript, purchase/Meta/redaction checks, production builds and five
real-Google-tag browser cases with collection intercepted passed. Four further
mobile cases using the actual hosted compiled app passed with synthetic order
responses and all collection blocked: paid one, unpaid/test/rejected zero;
reload no duplicate, correct GBP/value/client ID and no private outbound values.
No Ads enabling, payment/order/database mutation, customer message or artificial
Google sale was performed. Ads account/property mapping and genuine receipt are
still unverified; do not claim end-to-end credited sales. See
[the tracking report](docs/google-purchase-tracking-2026-10-09.md).
Compatible previous deployment: dpl_8AR2RibDg36LohHmwHa4qjiQmzrx. Both retain
the address-free footer and current Supabase/R2 setup. PIM is unchanged.

Owner follow-up: no initial auto-selection or artwork request. Details load only
after an order-row click; searching, sorting and reloading stay summary-only.
Switching rows cancels the previous in-flight detail request. Included on the same
task branch; released on 16 October 2026 (see the top entry).
Application commit: `eb54620ffee3d7be6c4c889e2feb57ea6b84d6b6` on
`codex/admin-list-timeout`. Changed-component/dependency typecheck, production
build and 390/1440 px request-count/retry/exact-proof browser checks passed.
No known failure in this change; authenticated production verification remains
pending an explicitly requested release.

26 September 2026; housekeeping only. No deployment, runtime restart, database/storage/payment change, customer message or paid generation performed.

## Verified sources

- Repository: https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19
- Development baseline: `dev/verified-live`, source `9dc89f2ba7bc00983847d7f72931d18df59b550f` plus documentation and a Git auto-deployment guard. GitHub default may be set to this branch only after confirming all publishing triggers are separated.
- Live revision/evidence: ce2eecb787c0d8b59d5fd7ab03345d04b3ba8081
- URL: https://instaplaque.co.uk
- Platform/project: Vercel instaplaque / prj_e0enz36tdUE3mI8q3tKKG9YR5CLD / dpl_Etuo1oBDAerk7nFgXVa4qfCona2h
- Windows baseline worktree: `C:/Users/trade/Documents/Codex/2026-09-26/please-audit-and-tidy-all-our/work/checkouts/instaplaque-baseline`. Original working copies and all branches are preserved.

Live alias and metadata verified 26 September. Base 9dc89f2 adds handover documentation only. Existing GitHub main is 17 commits behind this source and is not the starting point. Cody codex/cody-start and Windows codex/seo-review at fdec484 predate migration: never deploy them unchanged. Active shared Supabase is fygweiynqkglmjwqlouc and new artwork is private R2. Preserve the same migration on PIM. Read docs/supabase-r2-handover-2026-09-21.md before backend work; older setup notes are obsolete. Historical retained artwork/data and full paid/customer browser journeys were not retested.

## Setup, secrets and checks

Read README.md and DEPLOYMENT.md; install Node/dependencies locally with npm ci, then npm run typecheck and npm run build in an isolated worktree. Do not run database/storage checks that create fixtures as part of this housekeeping task.

Vercel production environment and existing encrypted workstation stores described in the migration handover. Retrieve through the existing authorised account/wrappers; no .env transfer. Required migration names include SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ARTWORK_STORAGE_PROVIDER, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY. Other checkout/payment/email/generation variables are listed by name in DEPLOYMENT.md and .env.example.

Source-referenced environment names (required versus optional is defined by the setup/code): `ADMIN_ACCESS_TOKEN`, `ADMIN_AUTH_SECRET`, `ADMIN_ORDER_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_HOURS`, `API_KEY`, `APP_URL`, `ARTWORK_STORAGE_PROVIDER`, `CASE_LIMIT`, `CHROMIUM_EXECUTABLE`, `DEV`, `FORCE`, `GEMINI_API_KEY`, `GEMINI_PUBLIC_PROXY_ENABLED`, `GEMINI_RATE_LIMIT_UNITS_PER_MINUTE`, `GENERATE_TIMEOUT_MS`, `GOOGLE_API_KEY`, `HOST`, `LAYOUT_EXPERIMENT_OUT`, `LIMIT`, `NODE_ENV`, `ORDER_ADMIN_EMAIL`, `ORDER_EMAIL_FROM`, `PLAQUE_APP_URL`, `PORT`, `PUBLIC_REVIEW_URL`, `PUBLIC_SITE_URL`, `R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `REVIEW_FOLLOWUP_CHECK_INTERVAL_MS`, `REVIEW_FOLLOWUP_DAYS`, `REVIEW_URL`, `SEMANTIC_LAYOUT_EXPERIMENT`, `SLUGS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TEST_ADMIN_PASSWORD`, `VERCEL`, `VITE_AI_SEMANTIC_LAYOUT_EXPERIMENT`, `VITE_STRIPE_PUBLISHABLE_KEY`. No secret values belong in this document.

This housekeeping commit changes documentation and disables Git-triggered Vercel deployment on this branch. Review staged diff and secret-scan the new changes. Historical validation remains historical unless separately recorded as rerun in the central audit; no end-to-end live purchase/generation claim is made.

## Deployment and rollback

Vercel Git integration still targets its previously configured production branch. This development branch includes `git.deploymentEnabled=false`; keep it inherited on task/WIP branches so pushes cannot publish sites. Repository hooks and workflows must also be checked. Do not push old branch tips without a separate trigger review.

Explicit request only: follow DEPLOYMENT.md using the existing instaplaque project. Recheck the emitted deployment and alias. Do not roll back to pre-R2 code: any rollback must retain target DB records and compatible R2 readers. A Vercel rollback to dpl_Etuo1oBDAerk7nFgXVa4qfCona2h is code-only and still needs separate review/authorisation.

## Other machine / outstanding work

Use an independent task worktree from the development baseline. Do not switch a checkout used by a running service. The original Windows and VPS worktrees, unfinished files, experimental branches and private output remain preserved; consult the central repository/branch inventory before reconciling them. Fetch before starting and leave branch/SHA/checks/next step before switching machines.

## Working between Windows and Cody's VPS

- At task start run `git status --short --branch`, `git fetch --no-recurse-submodules origin`, read HANDOVER.md and compare remote branches with work from the other machine. Never infer production from main, the latest commit, or the latest deployment.
- Use a task branch and preferably a separate worktree. Do not edit the same branch concurrently on both machines. Keep source checkouts used by a running service unchanged; use the separate development worktree.
- Preserve all existing edits, stashes and branches. No hard reset, force push, branch deletion or overwriting another machine's work. Label unfinished work with a wip/ branch and notes.
- Commit at meaningful checkpoints. Review staged diffs and scan for secrets before pushing. Never commit credentials, real .env files, customer data, backups, machine state, dependencies or generated private artifacts. New repositories must be private.
- Check every deployment integration and workflow before a push, merge or default-branch change. Push only to branches known not to publish a site. Repository housekeeping never authorises deployment.
- Before switching machines or ending a task, push reviewed safe work and leave a short handover recording branch, full SHA, checks, known failures and next step. Say clearly when work is incomplete or a push is blocked.
- Merge only verified work. Deploy only when explicitly requested; then record and independently verify the live revision/alias or installed runtime hashes. Preserve separate bot identities and credentials.
- Install dependencies independently on each machine. Retrieve secrets through the existing project/service-specific secret store; do not copy node_modules, virtual environments or machine environment files between computers.

## New design-route review checkpoint (26 September 2026)

Work continues on `codex/design-routes-instructions`, not the production branch.
See `docs/design-routes-2026-09-26.md` for routes, instruction-based editing,
manual safeguards, checks and limits. Changes are review-only, not deployed.
Fetch that branch to continue; do not assume this older baseline contains it.

## Production release 26 September 2026, 17:32 UTC
Owner authorised release of `codex/design-routes-instructions` at
`3e800129b255c024563bbbac6916e28ad53b813a`. Live canonical/www aliases verified on
`dpl_EG7t1wV91VTJJHeHUqWuDvmDET2A`; see the latest release section in
`docs/design-routes-2026-09-26.md` for live checks and remaining inbox-confirmation
limit. Earlier production identifiers above are the previous release, not current.
Retains existing Supabase/R2 configuration; no database or payment change.

## Bench clearance production correction — 26 September 2026, 17:58 UTC
Current live source is `1cc8f618d28c2fd7244025b04040506d4ea3f722`, branch
`codex/bench-fixing-clearance`, worktree `projects/instaplaque-bench-clearance`.
Production `dpl_2w9RiMretPaTdbxjCqGHFyTeBaCe` READY and canonical/www aliases
independently verified. Supersedes the 17:32 release above. Hosted390/1440 bench
fixing changes and3Doutlining passed;400localgeometry cases/typecheck/build pass.
No live AI generation, email, database writes or payments during this correction.
Rollback compatible previous release: `dpl_EG7t1wV91VTJJHeHUqWuDvmDET2A`.

## Visual quality review release — 26 September 2026, 18:29 UTC
Current live application source is `7af33c155dd4d969e91be2ff08f59bd4a1e91161`,
branch `codex/layout-quality-review`, worktree `projects/instaplaque-layout-quality`.
Deployment `dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW` promoted after 10 fresh successful
AI cases; canonical and www independently resolve to this READY deployment.
16 baseline cases visually reviewed, 14 successful layouts replayed; 20 local
and hosted visual regressions pass, plus persistent failure-state check.
400 geometry cases, typography/security checks, typecheck/build passed.
See `docs/layout-quality-review-2026-09-26.md` for results, limitations and rollback.
No customer email, order, payment or database write by this review.

## MEDIUM release — 27 September 2026
Owner requested promotion. Current app source `730f7489e4454122853db478e7f37491dd787970`,
branch `codex/medium-live`, worktree `projects/instaplaque-medium-live`.
Canonical/www independently READY at `dpl_sM6tNv6rC2ouab27KDUzypd6P8qL`.
Server structured-content now MEDIUM/16,384; existing30s timeout, prompt and renderer unchanged.
Typecheck/build/security pass; fresh candidate2successful/1failed AI cases, public1first-pass success;4hosted mobile/desktop geometry checks pass. Dense portrait failure and browser interruption retained in release report.
See docs/medium-release-2026-09-27.md for scope, verification limits and rollback. No DB/order/email/payment change.

## Remove length-only quote gate — 27 September 2026
Current app source `e73db85e1e0993569be44aa55bfb33c21843da55`, branch `codex/remove-length-gate`, worktree `projects/instaplaque-remove-length-gate`.
Canonical/www READY at `dpl_MKer6sXvFh1U6HBNLKCAZgZdDAn7`. Removed only >360-character manual-quote condition from shared checkout policy; other quote rules, approval, pricing, MEDIUM and typography limits unchanged.
Server-checkout/typecheck/build pass; local+hosted390/1440 long-proof checkout interception passes. Live API deliberately unapproved long inscription passes quote gate then rejects before persistence. No orders/payments/DBwrites/email. See docs/remove-length-gate-2026-09-27.md.

## Progress and lettering limits — 27 September 2026
Current application source `c4e88cdfcc7e8dcf241f2303bb8da8a44d94f4c1`, branch `codex/layout-progress`, worktree `projects/instaplaque-layout-progress`.
Canonical/www independently READY at `dpl_3RyiPdtffNRKuy7vZT9p8WbCDapr`. Removed authored5-unit and dense8–10-unit floors, orphan aesthetic rejections and post-fit5.2 clamps; manual minimum now serialization precision0.01. Word preservation, overlap/containment, font export restrictions/security retained.
Always-visible generation card shows elapsed time and real retries/checks; MEDIUM16k and timeouts unchanged. Two fresh real-model long-text cases first-pass; visual/bounds/mobile checks pass. Hosted replay of both results and390/1440 progress tests passed. Typography/manual/typecheck/build pass. See docs/layout-progress-and-size-limits-2026-09-27.md. No orders/payments/DBwrites/email.

## Manual decimal entry correction — 27 September 2026
Current app cfbf876, branch codex/manual-input, worktree projects/instaplaque-manual-input. Canonical/www READY at dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E. Decimal typing fix; typecheck/build and local+hosted390/1440 manual controls pass. All prior MEDIUM, relaxed limits and progress changes retained. See docs/manual-controls-2026-09-27.md.

## Checkout return — 27 September 2026
App12bdb2cc3c6279c4a1d36435052a116e114da964, branch codex/checkout-return, worktree projects/instaplaque-checkout-return. Canonical/www independently READY at dpl_8PHYTHFtkg7Q555qMJq78nB6ipJw. Stripe cancellation now returns to designer final review/PDF; legacy checkout return links also restored. Uses existing protected order lookup/local artwork snapshot; missing local artwork fails with PDF-link recovery guidance. No payment completion/pricing/DB changes. See docs/checkout-return-2026-09-27.md. Previous compatible deployment dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E.

## Merchant returns setup — 27 September 2026
Current app c9e5e808df07c08332cd12231e8159ac5fa262e0, branch codex/merchant-free-listings, worktree projects/instaplaque-merchant. Production dpl_8bykWxCwvMaK7hutvS74t6PK5TbZ canonical/www READY. Owner-approved no physical return for faulty plaques and agreed Stripe refunds within2working days; statutory remedies retained. Full policy now in initial HTML. Typecheck/build/staticHTML/local+hosted390/1440 passed. Merchant API connected5859684800; shipping/contact/return policy configured, product feed NOT submitted. See docs/merchant-setup-2026-09-27.md. Rollback dpl_8PHYTHFtkg7Q555qMJq78nB6ipJw.


## Whole-UK delivery — 27 September 2026
Owner confirmed delivery included throughout UK and will absorb regional costs. Updated customer copy, SEO/static HTML, PDF estimate, dispatch-email wording, feed service label and Stripe checkout label. Existing Stripe GB/zero shipping rate unchanged; Merchant independently read as free GB with no regional exclusion. No prices, production times or payment operations changed.
App5a86813 deployed to dpl_2P4ZCVFVDLfQ9tuEJwwPJV7P6gTt; canonical/www READY. Typecheck/build/server-checkout pass; all generated HTML scanned free of mainland restrictions; hosted home/how-it-works390/1440 wording/no-overflow/no-JS-error checks pass. Initial browser assertion incorrectly expected regional text on homepage rather than how-it-works; corrected route passed. Rollback dpl_8bykWxCwvMaK7hutvS74t6PK5TbZ. Product feed submission still pending image/configuration alignment, not shipping clarification.

## Merchant exact offers — 27 September 2026
Current application d10c7a3, codex/merchant-free-listings, projects/instaplaque-merchant. LIVE dpl_AY8iSJ4VovByE6KLztq9TPYL9DyG canonical/wwwREADY. Two exact products/image metadata/matching landing presets; typecheck/build/local+hosted390/1440 pass. Merchant datasource10749182094 GB/en FREE_LISTINGS only; first fetch accepted, approval not yet proved. See docs/merchant-setup-2026-09-27.md. Rollback previous2P4ZCVFVDLfQ9tuEJwwPJV7P6gTt.

## Full standard Merchant catalogue — 27 September 2026
Current application49cf41a, codex/merchant-free-listings, projects/instaplaque-merchant. LIVE dpl_4FynpLKygsk16TD1BcAu77v2SqWB canonical/www independentlyREADY.175 exact configurations with matched illustrations, prices, presets and production times. Typecheck/build/catalogue/feed checks pass;210local+22hosted browser checks; all175publicpages/images verified. Google corrected import SUCCEEDED175/noimportissues,101new+74previouslyaccepted. Initial import's overlengthIDs corrected preserving acceptedIDs. Google image crawl/policy review still pending; nonblocking unit-pricing-measure notices observed. No paid ads/orders/refunds/DBwrites. See docs/merchant-catalogue-expansion-2026-09-27.md. Rollback prior2offer dpl_AY8iSJ4VovByE6KLztq9TPYL9DyG and refetch same datasource10749182094.

## Homepage sister links — 27 September 2026

Current task worktree `projects/instaplaque-sister-links`, branch `codex/homepage-sister-links`, deployed `dpl_8JunknXiRQUxDcmur3WxgNrPyv8r`. See docs/homepage-sister-links-2026-09-27.md for checks and rollback.

## Wording proofreading — 28 September 2026
Task branch codex/wording-proofreading, app c0c4ae1, projects/instaplaque-sister-links. Live dpl_J7N13RYDfRXiY1k7VpfLRyZC7JL1 / https://instaplaque.co.uk. Generation now runs conservative spelling/capitalisation proofreading before exact-copy SVG composition, commits corrected editor text and proof together, and retains stale-result guards. Rejects empty/invalid responses and changed digit sequences. No proofreading on manual typography edits.
Checks: browser mocked success/date-change rejection/concurrent-edit preservation passed. Full tsc hit inherited512MB heap limit; narrowed tsconfig including changed App/services/Controls and imported app dependencies passed (temporary config removed). Cloud production build passed. Actual hosted mobile model flow: “in loving memory / Alex McDonald / 1950–2026 / forevr remebered” corrected to “In loving memory / Alex McDonald / 1950–2026 / Forever remembered”; both model requests200, corrected textarea matched, no overflow, screenshot checked. Synthetic wording only, no order/payment/email/customer save. Rollback prechange dpl_8JunknXiRQUxDcmur3WxgNrPyv8r.

## Memorial search page — 29 September 2026 (not deployed)

Task branch `codex/memorial-search-2026-09-29`, application change
`285213a5907bf0ad3f224152a8aebcb6d337330c`, based on the latest proofreading
release and its handover. Adds memorial buying guidance, wording examples,
catalogue-derived prices, contextual links and consistent search metadata.
Full typecheck, build, SEO/static-output checks and local 390/1440 browser review
passed. Merchant feed matches production byte-for-byte. No backend, PDF,
generation, payment or price change. See
[the task handover](docs/memorial-search-2026-09-29.md) for coverage and limitations.
Next: explicit owner deployment request, reconcile any newer production changes,
verify hosted release, then request a fresh Google crawl. Current production
remains the proofreading release above; no deployment or indexing request made.

## Memorial page release — 30 September 2026

Owner authorised deployment. Source `febbedd49335a5625930099c7c0557e0d95461ec`
is live at READY deployment `dpl_2nWrgrqHCDEMkhAe1HRTpVnDRJyg`; canonical and
www independently verified. Cloud build, public content/hashes and hosted
synthetic proof save/read through the target DB/private R2 passed; fixtures
cleaned up. See docs/memorial-search-2026-09-29.md. Supersedes the review-only
status above. No email, generation, order or payment by this release check.

## Circular plaque review — 30 September 2026 (not deployed)

Branch `codex/circle-plaque-fixes`, app `6cbac3678afeda7d2fd465ba8fc57237c5a77784`.
Two side fixings for round plaques including restored designs; smooth 3D rim
and matching face geometry; circular text area and generation guidance.
Typecheck/build, 160 geometry combinations, typography/checkout regressions,
one fresh model composition and local desktop/mobile/3D review passed.
See docs/circle-plaques-2026-09-30.md for scope, limitations and release next step.
The memorial page is live; Search Console accepted its fresh indexing request.
The circle correction awaits explicit publication approval.

## Circular plaque release — 30 September 2026

Owner explicitly requested publication. Branch `codex/circle-plaque-fixes`,
deployed source `f7edbf8b15cfce428e2ad6f0d995b5505e7d34d8`, is live at
`dpl_AJCwLEfhRCrqzeygG5D9Dd5a2ykr`; canonical and www independently READY.
Cloud build, authenticated candidate/public assets, live circle/3D review and
hosted synthetic proof save/read through target Supabase/private R2 passed;
fixtures cleaned up. Supersedes the review-only status above. Existing wording
needs Regenerate for new wrapping; legacy round fixings correct automatically.
See docs/circle-plaques-2026-09-30.md for coverage and rollback. No order,
payment or email was created; full purchase/PDF browser coverage remains open.

## Oval inscription layout — 30 September 2026 (not deployed)

Branch `codex/oval-plaque-layout`, application
`bc50c16274b2b8cc49a02e44eccc1facb2d68033`, extends per-line ellipse fitting
and curved wrapping to text-only ovals, with wide/upright composition guidance.
The published smooth rim and two side fixings already cover ovals. Full
typecheck/build, typography regressions, 160 hardware/24 oval geometry cases,
two fresh model compositions and local desktop/3D review passed. Mobile DOM
geometry passed; mobile screenshot capture failed. See
docs/oval-plaques-2026-09-30.md for coverage and limits. No deployment made;
next step is explicit publish approval followed by live reconciliation and
hosted proof verification. Preserve the migrated Supabase/private R2 setup.

## Oval fixing follow-up — 30 September 2026 (not deployed)

Same branch `codex/oval-plaque-layout`, application
`7d23d6364b4259237eab2b88cad5be8480516c49`, includes the oval text improvements.
Extreme shallow ovals could let 15mm caps cross the edge; ellipse-aware insets
now keep the whole fixing plus 2mm clearance on the metal. Two side fixings,
legacy state normalisation and shared SVG/3D positioning are retained.
640 additional oval hardware cases, existing 160 hardware/24 layout cases,
typecheck/build and a local restored-proof/cap-to-screw browser check passed.
See docs/oval-plaques-2026-09-30.md. Pushed for review; publication approval
and hosted release verification remain the next step.

## Generic cookie popup — 4 October 2026
Owner requested generic popup disappearing after selection. Source 75a8cab on codex/generic-cookie-popup deployed READY dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q to instaplaque.co.uk. Accept/Reject remove popup entirely; existing consent storage preserved. Cookie settings available on /cookies, policy instructions updated. Meta consent/checkout regression and local/cloud builds passed; local and public mobile-browser checks proved accept/reject dismissal, reload persistence and reopen/revoke. No order/payment/email. Other analytics unchanged. Prior deployment dpl_Fpfz2aemHnvnxT7CTEogF3eC9STK is code rollback.

## Text-layout API timeout — 7 October 2026 (not deployed)

`codex/layout-api-timeout`, based on `b65f997`, fixes the explicit 30-second
function ceiling observed in live 504 logs. Prepared 120-second ceiling,
110-second cancellable structured-text deadline, safe errors and bounded browser
waiting without repeated timeout calls. Model/MEDIUM/16k, layout safeguards and
image budgets retained. Delayed actual-handler/SDK test, eight mobile/desktop
timeout/success scenarios, input security, changed-app dependency typecheck and
build passed. See [the report](docs/layout-api-timeout-2026-10-07.md).
No hosted release or real model call made. Owner release instruction, live-source
reconciliation and hosted verification remain. The separately pushed
`codex/admin-list-timeout` is NOT part of this branch and remains undeployed.

Verified application/test/report commit: `d22771b35c64431e51549fa7927339addd463f5d`. All task test servers and browsers closed.

## Text-layout timeout release — 7 October 2026

Owner explicitly requested deployment. Source
`b50123bb95087e360ca8c66d03aa5cfc1c4c0e9f` deployed and promoted to
`dpl_FR2heHpEJmvjoS7eP4GwGAf5nRKC`; canonical/www independently READY. This
supersedes the not-deployed status above. Cloud build/health passed and deployment
metadata confirms 120-second function duration. Hosted synthetic proofreading
and composition/repair returned 200 in 3.939s/35.625s/24.275s; final eight-line
proof passed exact-wording/dates, face bounds and 390/1440px browser checks.
One existing layout repair was required; no local fallback. Hosted JS hash matches
the tested build. No customer/order/DB/payment/email/PIM change. All jobs closed.
`codex/admin-list-timeout` remains separate and undeployed. See the
[release report](docs/layout-api-timeout-2026-10-07.md) for rollback and evidence.

## Postal-address removal — 9 October 2026

Owner requested live removal of the current business postal address from both
brands, including outgoing emails, pending a replacement tomorrow. InstaPlaque
app `48954736dbc179cc850957ec5d2bee1a625ad824`, branch
`codex/remove-postal-address-20261009`, is live on canonical/www at READY
`dpl_8AR2RibDg36LohHmwHa4qjiQmzrx`. All footer variants now say Made in the UK;
Contact/About/Terms and structured data have no postal address. Customer email
footers match; customer delivery addresses are retained. Eight offline email
renders, focused UI typecheck, cloud build/runtime/prerender, 26 live routes and
390/1440 browser checks passed. No customer mail, payment or DB mutation. PIM
was separately released from its current source. Do not restore an old address
from historical notes. See [the report](docs/postal-address-removal-2026-10-09.md).

## 9 October 2026 — private exact-size £1 sandbox setup

Owner 3860 requested a 123 × 456 mm £1 test, replying to the sandbox proposal. Prepared on `codex/instaplaque-pound-test-20261009` from the independently confirmed purchase-tracking production release plus docs-only checkpoint. Read [the scope, tests, missing test key and rollback limits](docs/one-pound-sandbox-2026-10-09.md).

This is an owner-authenticated test route, not a public price change. No live key change, real payment, customer email, manufacture or Ads launch. **STRIPE_TEST_SECRET_KEY is missing**: the API fails before writing an order, and the page stays disabled. GA4/Ads receipt is not established by the mocked return checks. Deployment result is recorded below when verified.

Published app `740c388a7a95aad4c7e6a53b50f67eb3f64e4fb7` to READY `dpl_4JT7pZiR1Whe55C6aW7mEhE9E2N8`; independent canonical inspect, hosted asset hashes/headers, owner-auth 401, unchanged live Stripe mode and health checks passed. Private setup is at `https://instaplaque.co.uk/checkout-test.html`. **Still waiting for STRIPE_TEST_SECRET_KEY in Vercel**; no actual sandbox payment has been made. Owner should add only the separate test key (Production/Sensitive) and tell Cody saved; redeploy guarded code and prove test checkout next. Existing live keys and Ads are unchanged.
