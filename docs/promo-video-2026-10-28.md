# Promo film on the homepage and the category pages — 28 October 2026

## Why

- The owner asked for a snappy Remotion video (msg 6954), liked draft 1, and asked where to use it (msg 6970).
- Cody's answer: a Meta Reels/Stories ad, a muted loop near the top of the homepage and the Google ad landing pages,
  and free posts.
- The owner's reply (msg 6977): "Yeah do all 3". That covered an ad-safe 9:16 cut, a 4:5 feed cut, and the website
  copy, which the answer had flagged as a live-site change waiting for their go.
- The film's source and both ad cuts are in `projects/instaplaque-promo-video-20261028` (Remotion, local git, branch
  `codex/instaplaque-promo-safe-formats`).

## What changed

- **`components/PromoVideo.tsx`** (new): `PromoVideoSection` with the kicker "See it in 20 seconds", the heading
  "Design your plaque in seconds.", the film, one paragraph and the small print.
  - **Small print:** the film's own small print (5 working days, aged brass 7, wood-backed 10–15, from
    `services/productionTime.mjs`), "the video is sped up: real layouts take about 30–60 seconds" and "the WhatsApp
    chat is an example". It is repeated in the page because the film's 25 px footnote is too small to read at
    400 px wide.
  - **Loading:** nothing loads with the page.
    - The `<video>` has no `src` or `poster` and `preload="none"` until an IntersectionObserver sees it within 400 px
      of the screen. Then the poster (55 kB) and the source are set.
    - It plays (muted, looped, inline) only while at least 35% of it is on screen, and pauses off screen.
  - **Controls:** a 44 px pause/play button (WCAG 2.2.2).
    - Visitors with `prefers-reduced-motion: reduce` get the poster and a play button, never autoplay.
    - The video has an `aria-label` that describes the film.
  - The 4:5 box is sized by CSS `aspect-ratio`, so nothing moves when the film loads.
- **Where:**
  - The homepage, straight after the hero (`components/Shopfront.tsx`).
  - Every category page straight after its hero (`components/CategoryLanding.tsx`): memorial, bench, garden, brass,
    stainless steel, opening and custom.
  - **Not** the tree page: every plaque there is on an oak board and stake (10–15 working days), and the film says
    "Made in 5 working days*".
- **Layout (`shopfront.css`):**
  - Computers: the film (400 px) on the left, the copy on the right.
  - Phones: heading, film (up to 420 px), then the copy.
- **Files:**
  - `public/videos/instaplaque-design-in-seconds-20261028.mp4`: the 4:5 cut at 720 × 900, H.264 High (CRF 25, preset
    slow), faststart, no audio, 21.93 s, 1,268,382 bytes.
  - `public/videos/instaplaque-design-in-seconds-20261028-poster.webp`: 720 × 900, from 1.0 s, 55,018 bytes.
- **`vercel.json`:** `/videos/(.*)` is cached for a year (`immutable`). The names carry the date, so a new cut must get a
  new name.

## Checks

- Scoped `tsc` (`tsconfig.check.json`) passes.
- `npm run build` passes with all postbuild checks: consent, live SEO, designer SEO, product policies, merchant
  catalogue and feed.
- The prerendered HTML has the section on `/`, memorial, bench, brass, stainless steel and garden, and not on the tree
  page.
- `scripts/check-promo-video.mjs` (new) passes against the build served locally, in Google Chrome:
  - Phones (`/`, `/memorial-plaques`): no film or poster request on the first screen, a 4:5 box, and no sideways
    overflow. On screen it loads and plays muted; the button pauses and plays it; off screen it pauses.
  - Reduced motion: poster, no autoplay, and the play button works.
  - Computers (`/`, `/brass-plaques`): the film is 400 px wide beside its copy, with no overflow.
- Screenshots at 390 and 1440 px are in `output/promo-video-section/` (not committed).

## Release

- **Candidate:** built on Vercel with `vercel deploy --prod --skip-domain` from commit de1477f:
  https://instaplaque-j69fq1m7u-dullaghan31-3959s-projects.vercel.app (dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy,
  `index-eAQF_wEa.js`). Vercel's build and every postbuild check passed. Through `vercel curl` (protection bypass sent to
  the candidate only, never printed): `/` and `/memorial-plaques` had the section, the tree page didn't, and the film was
  byte-identical to the repository, `video/mp4`, `public, max-age=31536000, immutable`.
- **LIVE: 28 October 2026, 08:30:13 UTC** (owner msg 6977). Before promoting, production was still
  dpl_2tbktHyiKAX62KXH3DZ9AGxZ2fse and no newer deployment existed. `vercel promote` took 3 s; instaplaque.co.uk and www
  point to dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (`vercel inspect`); www returns 308 to the apex.
- **Live checks:**
  - Plain HTTP: `/`, memorial, bench, brass, stainless steel and garden have the section and `index-eAQF_wEa.js`; the
    tree page and `/design` don't have the section.
  - The film and poster are byte-identical to `public/videos/`; a range request returns 206.
  - `BASE=https://instaplaque.co.uk node scripts/check-promo-video.mjs`: RESULT PASS (all six checks), with Google,
    Meta, PostHog and Vercel analytics aborted and consent refused.
  - `verify_live.py` (`BUNDLE=index-eAQF_wEa.js`): RESULT PASS, with 633 product-page assets identical to `public/`.
- **Rollback:** `vercel promote https://instaplaque-qxw1hjk89-dullaghan31-3959s-projects.vercel.app --yes --scope
  dullaghan31-3959s-projects`, with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` set. That is the production-times release
  (dpl_2tbktHyiKAX62KXH3DZ9AGxZ2fse), identical apart from this section.

## Film at the top, buttons glowing in turn (owner msg 6986): STAGED, not live

- **Why:** the owner (msg 6986): "would the video work better at the top of the page? imagine the button for design
  online glows as video plays that and then the whats app one does?"
- **Branch:** `codex/instaplaque-hero-film-20261028`, based on the live promo-film release (f4d52a5).
- **What changed:**
  - `components/PromoVideo.tsx`:
    - `PromoFilm` now has the poster in the static HTML and adds a high-priority preload for it.
    - The 1.3 MB video is requested only after the page's load event, once the film is near the screen. A hidden copy
      never loads.
    - Reduced motion or Save-Data: no autoplay.
    - While the film plays on screen, it sets `data-promo-cue` on the page's `.shopfront`, from `promoCueAt()`: `design`
      until the chat (frame 332), `whatsapp` until the end card (frame 566), then `both`. Paused or off screen, the
      attribute is removed.
    - `PromoFilmFigure` adds the small print as a caption.
    - The separate "See it in 20 seconds" section is gone.
  - **Homepage:** the film replaces the bench photo beside the copy on computers. On phones it sits straight under the
    two buttons.
  - **Category pages** (`CategoryHero` with `film`): the film replaces the hero photo, again beside the copy on
    computers and under the buttons on phones.
    - The category's own photo and its "Shown: …" caption follow the hero (`ShownPhoto`, lazy-loaded).
    - The tree page keeps its photo at the top and has no film, as before.
  - `shopfront.css`: `.promo-film*` and the hero slots.
    - The cued hero buttons, and the phone bar's once it is up, get a gold ring (`#d6aa52`).
    - The ring pulses (`promo-cue`) only for visitors who haven't asked for less motion.
  - `scripts/check-live-seo.mjs`: the homepage hero assertion now looks for the film and its poster instead of the bench
    photo.
- **Checks:**
  - Scoped `tsc` passes.
  - `npm run build` passes with all postbuild checks.
  - `scripts/check-promo-video.mjs`, rewritten for the hero: RESULT PASS on the local build. It checks:
    - phones (`/`, `/memorial-plaques`): the film is straight under the buttons, all on the first screen;
    - the poster is in the static HTML, and the video is requested after the load event by one copy only;
    - it plays muted; "Design online" glows at 5 s, "Design on WhatsApp" at 14 s and both at 20 s;
    - pausing, or scrolling it away, stops the glow;
    - reduced motion: no autoplay, and a steady ring once played;
    - computers (`/`, `/brass-plaques`): the film is beside the copy and glows the same way;
    - the photo follows the hero on five ad pages, and the tree page is unchanged.
  - The local check needs a server with HTTP Range support, or Chrome can't seek in the video. Vercel has it; Python's
    `http.server` doesn't.
- Phone and computer recordings, and screenshots, are in `output/hero-film-preview/` (not committed).
- **Candidate (not live):** built on Vercel with `vercel deploy --prod --skip-domain` from dae7435:
  https://instaplaque-844r6bzyp-dullaghan31-3959s-projects.vercel.app (dpl_99DTUXDvZuUy6Yibw8ASAsqrVGnk,
  `index-Bdw47sbu.js`).
  - Vercel's build and every postbuild check passed.
  - Through `vercel curl`: `/` and `/memorial-plaques` have the film in the hero; the memorial photo follows the hero; the
    tree page still has its photo hero and no film.
  - instaplaque.co.uk is still dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (`vercel inspect`, before and after).
- **To go live (on the owner's go):**
  1. Check production is still dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy.
  2. Run `vercel promote https://instaplaque-844r6bzyp-dullaghan31-3959s-projects.vercel.app --yes --scope
     dullaghan31-3959s-projects`, with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` set.
  3. Run `BASE=https://instaplaque.co.uk node scripts/check-promo-video.mjs` and `verify_live.py` with
     `BUNDLE=index-Bdw47sbu.js`.
  - Rollback: promote dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (instaplaque-j69fq1m7u).

## Video schema and a watch page (owner msg 6988): STAGED with the hero film, not live

- **Why:** the owner (msg 6988): "also we have all the bells and whistles video schema that goes with this?" There was
  none.
- **Google's rules, read on 28 Oct 2026** (developers.google.com/search/docs/appearance/video and
  /structured-data/video):
  - Video results, Video mode and key moments come only from a **watch page**, whose main purpose is one video. A
    homepage or product page where the video complements the content isn't one.
  - VideoObject needs `name`, `thumbnailUrl` and `uploadDate`. `contentUrl`, `description` and `duration` are
    recommended.
  - Thumbnails must be crawlable and at a stable URL, and the same across all metadata. A video sitemap entry belongs only
    on the page where the video is the main content.
- **What changed:**
  - `services/promoVideo.mjs` (new) holds the film's facts in one place. That covers the name, description, disclosure,
    footnote, file, poster, thumbnails, duration, the first-publication date (2026-10-28T08:30:13Z, the first release)
    and the seven on-screen moments. It also builds the VideoObject (`promoVideoObject`) and the sitemap entry
    (`promoVideoSitemapEntry`).
  - **`/video`, the watch page** (`ShopVideoPage` in `components/PromoVideo.tsx`):
    - The film leads it, large: 480 px beside the heading and buttons on computers. On phones it sits under the heading,
      with the buttons straight under the film. The buttons glow as on the heroes.
    - The `<video>` source is in the static HTML. `preload="none"` still means nothing downloads until it plays.
    - A timestamped written version, "What's in the video.", lists the seven moments with the on-screen text. This is the
      text alternative for a video with no sound (WCAG 1.2.1).
    - It uses the app's `video` view (`App.tsx`, `SiteExperience.tsx`, `SiteView`) and PostHog's public paths.
  - **Structured data** on `/video`:
    - WebPage, VideoObject (name, description with the disclosure, four thumbnails, uploadDate, `PT22S`, contentUrl,
      encodingFormat, inLanguage, isFamilyFriendly, creator/publisher, transcript) and a BreadcrumbList.
    - No FAQPage, since the page shows no FAQs (`scripts/prerender-product-pages.mjs`).
    - The validator.schema.org check of the built page reported 0 errors and 0 warnings.
  - **Open Graph:** the share image is the 16:9 thumbnail, plus `og:video`, `og:video:secure_url`, `og:video:type`,
    `og:video:width` and `og:video:height`.
  - **Video sitemap:** `/video` is in `sitemap.xml` with `video:thumbnail_loc` (the 16:9 thumbnail), title, description,
    content_loc, duration 22, publication_date, family_friendly, requires_subscription and live. The urlset gains the
    video namespace. The build fails if `public/sitemap.xml` changes shape.
  - **Thumbnails:** `public/videos/instaplaque-design-in-seconds-20261028-{16x9,4x3,1x1}.jpg` (1920×1080, 1440×1080
    and 1080×1080). Each is the film's frame at 1 s, full height, centred on a blurred copy of itself.
  - **Links:** the hero film captions on the homepage and category pages link to `/video` ("Watch it larger, with a
    written version").
  - **Sitemap dates:** `lastmod` is 2026-10-28 for the pages this release changes (home, memorial, bench, brass,
    stainless steel, custom, garden, opening) and for /terms, which changed with this morning's production-times
    release.
- **Not used:**
  - Key moments (Clip/SeekToAction): pointless for a 22-second film.
  - `embedUrl`: there's no separate player page.
  - `interactionStatistic`: there are no view counts to report.
- **Checks:**
  - `scripts/check-live-seo.mjs` (postbuild) now asserts:
    - the watch page's VideoObject fields, breadcrumb and no FAQPage;
    - its heading, video source and written version;
    - og:video and og:image;
    - the video sitemap entry and namespace;
    - that every video file and thumbnail is in dist, and robots.txt doesn't block `/videos`;
    - the hero links to `/video`;
    - 25 sitemap URLs.
  - `scripts/check-promo-video.mjs` adds three checks:
    - `/video` on a phone: the film leads, the buttons sit straight under it on the first screen and glow in turn, and the
      written version has 7 moments;
    - `/video` on a computer;
    - the sitemap entry, the three thumbnails as `image/jpeg`, and the hero links.
  - Scoped `tsc`, the build with every postbuild check, and the browser check (9 of 9) all pass locally.
- **Candidate (not live), superseding instaplaque-844r6bzyp:** built on Vercel with `vercel deploy --prod
  --skip-domain` from ecf4c8e: https://instaplaque-rd8msp6l3-dullaghan31-3959s-projects.vercel.app
  (dpl_4MYqFi8ExJbiX9DRCwz4MVyTU9EP, `index-BPx8Mq_0.js`).
  - Vercel's build and every postbuild check passed, including the new watch page assertions.
  - Through `vercel curl`:
    - `/` and `/memorial-plaques` have the hero film and link to `/video`; the tree page has neither.
    - `/video` has the film, VideoObject and og:video.
    - `sitemap.xml` has 25 URLs, the video namespace and one `<video:video>` entry.
    - All three thumbnails return 200 `image/jpeg`.
  - instaplaque.co.uk is still dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (`vercel inspect`, before and after).
- **To go live (on the owner's go):** same steps as above, with this candidate.
  1. Check production is still dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy.
  2. Run `vercel promote https://instaplaque-rd8msp6l3-dullaghan31-3959s-projects.vercel.app --yes --scope
     dullaghan31-3959s-projects`.
  3. Run `BASE=https://instaplaque.co.uk node scripts/check-promo-video.mjs` and `verify_live.py` with
     `BUNDLE=index-BPx8Mq_0.js`.
  4. Afterwards, the owner can submit the sitemap again in Search Console, or Cody can ping it. Search Console for
     InstaPlaque isn't shared with Cody's service account.
  - Rollback: promote dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (instaplaque-j69fq1m7u).
- **LIVE (owner msg 7004, "ok push all this live"):** promoted instaplaque-rd8msp6l3 at 10:08:33 UTC on 28 Oct.
  - Pre-flight: production was still dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy, and no newer deployment or branch existed.
  - `vercel promote` took 3 s. instaplaque.co.uk and www point to dpl_4MYqFi8ExJbiX9DRCwz4MVyTU9EP (`vercel inspect`);
    www returns 308 to the apex.
  - `verify_live.py` (`BUNDLE=index-BPx8Mq_0.js`): RESULT PASS. It covers 175 product pages, 633 assets identical to
    `public/`, both sitemaps (25 and 175 URLs) and the feed (175 items).
  - Live HTTP checks pass:
    - the homepage and memorial page lead with the film and link to `/video`;
    - `/video` has the video source, VideoObject and og:video;
    - the sitemap has the video entry, and the three thumbnails are `image/jpeg`;
    - the video answers range requests (206);
    - the tree page keeps its photo.
  - The browser check (`check-promo-video.mjs`) wasn't run against the live site. The account was at 3.9 GiB, over the
    3 GiB limit for starting a browser job. The same build passed it locally (9 of 9) before it was staged.
  - Rollback: promote dpl_8xt1RFoJw5E2h4Dz5sNuQE7qLWPy (instaplaque-j69fq1m7u).

## Watch tracking in PostHog: LIVE — 28 October 2026, 10:24 UTC

- **Why:** the owner (msg 7004): "track video views percentage in posthog or whatever".
- **Branch:** `codex/instaplaque-video-tracking-20261028`, based on the hero film release (627e529), which was the live
  source. Draft PR #21 (base: the hero film branch) exists only to run CI.
- **Events** go to PostHog EU project 303026 through `trackSiteEvent`. So they're sent only with analytics consent and
  only on public pages, never go to GA4, and are marked `is_test` from the owner's own browsers (`?internal=on`).
  - `ip_video_started`: the film started playing. `autoplay` is true when it started by itself, and false when the
    visitor pressed play (reduced motion, Save-Data, or autoplay blocked, e.g. iPhone Low Power Mode).
  - `ip_video_progress`: the film played to `percent` 25, 50, 75 or 100. 100 means it reached its last half second
    (the still end card) or looped back to the start.
  - Both carry `video` (`design-in-seconds-20261028`, `promoVideo.id`; a new cut gets a new id), plus the usual `page`,
    source/medium/campaign, device and `is_test`.
  - Each is sent at most once per visit and page. The visit keeps the keys `video:<path>:<started|25|50|75|100>`.
- **What "watched" means:** the film plays only while at least 35% of it is on screen and its tab is showing. It has no
  seek bar, so how far it has played is how far it got on someone's screen. Because it autoplays, `ip_video_started`
  counts films that started playing on screen, not deliberate plays.
- **Small behaviour change:** the film now also pauses while its tab is hidden and resumes when the tab shows again.
  Before, that was up to the browser.
- **Code:**
  - `services/promoVideoTracking.ts` (new): `watchPromoFilm` and `promoMilestonesAt`.
  - `components/PromoVideo.tsx`: attaches the tracker, adds the tab check, and flags a press of the play button.
  - `services/posthogAnalytics.ts`: allows `video_started` and `video_progress`, with only `video` (a slug), `percent`
    (25/50/75/100) and `autoplay` (true/false).
  - `services/promoVideo.mjs`: the film's `id`.
- **Privacy:** the privacy notice's list of what PostHog measures now includes "how much of our video plays". Privacy
  updated 28 October 2026, and the sitemap's `/privacy` lastmod matches.
- **Checks:**
  - `npm run check:posthog` also runs `scripts/check-promo-video-tracking.cjs` (new). It plays a stand-in `<video>` the
    way browsers report it and checks:
    - one start (autoplay or tapped);
    - 25/50/75/100% once each, in order, with the loop and `ended` counting as the end;
    - nothing while paused or seeking, before the length is known, or after unmount;
    - per-page keys.
  - `scripts/check-posthog-analytics.cjs` adds the watch events: no events before consent, once per key, private values
    dropped, odd values filtered out, never sent to GA4, and `is_test` for the owner's browsers.
  - Both pass locally and in CI (run 40671556175), and the full `tsc` typecheck passes in CI. CI then stopped at
    `check:google-purchase` ("Public pages retain one loader"). That failure is older than this change: it fails the
    same way locally, and none of its inputs (`index.html`, `services/googlePurchase.ts`, `public/google-purchase.js`)
    changed. It probably dates from the 26 Oct page-speed change to `index.html`, so it needs its own fix.
  - Vercel's build passed with every postbuild check. `vercel curl` showed the candidate's bundle has the events, film
    id and tab check, `/privacy` has the new wording and date, and the sitemap has the new lastmod.
  - **No browser run:** the account was at 3.7–3.9 GiB, over the 3 GiB limit for starting a browser job. The first real
    events in PostHog are the in-browser proof. `scripts/check-promo-video.mjs` doesn't cover tracking: analytics only
    run on https://instaplaque.co.uk, so a local build can't send them.
- **Live:** promoted instaplaque-gz1ge8cbh (dpl_QCbB8CX9ekQjg63py3Za3i6goQsG, `index-M8D_2WTP.js`) at 10:24:22 UTC. Both
  domains point to it (`vercel inspect`). Live HTTP checks pass: the new bundle is served with the events, `/privacy`
  has the wording, the sitemap has the lastmod, and the homepage film and `/video` VideoObject are unchanged.
  `verify_live.py` (`BUNDLE=index-M8D_2WTP.js`): RESULT PASS (175 product pages, 633 assets identical, sitemaps, feed).
- **First real events (the in-browser proof):** a phone (Chrome, Corby, direct, not marked as a test) at 10:25:43 UTC.
  On the homepage: started (autoplay) at 10:25:43.0, then 25% at +5.7 s, 50% at +11.0 s, 75% at +16.6 s and 100% at
  +21.6 s, matching the film's 21.93 s. Then on `/video`: started at 10:26:20 and 25% at +5.7 s.
- **Report:** `output/instaplaque-ads-plan-20261025/posthog_video.py` in Cody's workspace (read-only HogQL; `--tests`
  shows QA events). In PostHog itself: Trends, event `ip_video_progress`, broken down by `percent`, with `is_test` not
  true; or a funnel from `ip_video_started` through `ip_video_progress` at 25, 50, 75 and 100.
- **Rollback:** promote dpl_4MYqFi8ExJbiX9DRCwz4MVyTU9EP (instaplaque-rd8msp6l3, the hero film release).
