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
