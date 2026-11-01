# "Products first" category template, stage 2: six more pages, three review fixes and the film — 1 November 2026

**PREVIEW ONLY. Not merged into the live source, not live.** Owner msgs 8384 and 8402 (rebuild the category pages on
the template, studio shots only), 8437 ("Show me preview when fixes are in and then I'll give yes no"), 8440 (keep the
video somewhere on each page, no hero picture at the top) and 8537 (resume stage 2). Stage 1 (memorial, bench) is in
docs/category-template-2026-11-01.md, which still describes how the template works.

- **Branch:** `codex/instaplaque-category-template-20261101` (from `df652c9`, the 31 Oct combined preview).
- **Commits:** `095af01` the six pages; `b3cfed3` the three review fixes and the film; `6694a5d` checks for all eight
  pages, card lead times from the catalogue and the planner module; then this document.
- **Preview:** https://instaplaque-brn15lv9h-dullaghan31-3959s-projects.vercel.app (`dpl_7vnWWa9tZCW5QTeW3SnEwxk6WTsr`,
  target **preview**, **Ready**, built from `6694a5d`; one `vercel deploy` under the shared lock
  `tmp/instaplaque-vercel-deploy.lock`). Vercel login applies; Preview environment variables, so don't take orders on it.
- **Production unchanged:** `instaplaque.co.uk` is still `dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8` (`vercel inspect`, after
  the deploy).
- Vercel's security checkpoint blocked this server's API calls when first checked at 12:35 UTC; they were clear by
  12:51 (checked every 5 minutes) and the deploy ran then, with no new login. The live site went on answering this
  server with the checkpoint on and off, so live pages could be read only where it let them through (below).

## The six new pages

Each is a config in `components/CategoryTemplatePages.tsx` (registered in `templatePages`). Titles, meta descriptions,
H1s and canonicals are unchanged (equal to what production's source, `ec24ba1`, builds). Studio photos only; every
price from the catalogue (`merchantOffers`, `estimatePlaquePrice`); every question from the research's section (c) and
the site's own facts (workspace `output/instaplaque-competitor-research-20261101/FACTS-FOR-BUILD.md`). No VAT invoices,
invoice/PO terms, logo engraving, exact matches, late changes or curtains are promised: those say "ask us on WhatsApp".

- **/garden-plaques:** 8 cards (A5 upright, oval, round, 300 × 200, 200 × 150, A4, 150 × 50, A5 on oak or walnut);
  chips All · Brass · Stainless steel · On a wood board, plus link chips to the tree page (on a ground stake) and the
  bench page. Questions: outside all year, which metal, what size, fixing to a wall, fence or stone (screws, caps and
  holes per shape from the catalogue's fixing presets), near the sea (ask us), care. Finishes row with each metal's
  outdoor line from its product pages.
- **/tree-memorial-plaques:** 6 cards, every plaque priced and opened on the oak board and ground stake (the designer's
  stake preset, owner msg 6506), pictured by its plate on the oak board; a labelled kit drawing to scale (plate, oak
  board, black steel stake) after the questions; sizes drawn on board and stake; the plate on its own folded below.
  New questions: permission in a churchyard, park or woodland; just the plate for a post or fence. Facts line: 10 days.
- **/brass-plaques:** 8 brass cards; chips Polished · Brushed · Orbital · Aged (with the aged brass note) · On a wood
  board; intro of from-prices by size; the four brass finishes side by side straight after the questions. Questions:
  which finish, tarnish outside, how long, matching an old plaque (photo on WhatsApp, no exact-match promise), logo or
  crest (ask us), VAT (not registered: the price shown is the full price).
- **/stainless-steel-plaques:** 8 stainless cards; chips Brushed · Polished · Bench sizes · Wall sizes · On a wood
  board; intro of from-prices (bench, A5, on a board, on a tree stake); brushed or polished side by side. Questions:
  outdoors, near the sea (ask us), brushed or polished, care, logo (ask us), how long. No steel grade is claimed.
- **/opening-plaques:** 6 cards (A4 "the usual size", A4 on a board, 300 × 200, A5 on a board, 400 × 300 on a board,
  round); "When is your opening?" after the questions (below); proof steps for colleagues and a note for schools,
  councils and companies (card payment, no VAT to add, other ways to pay or several plaques: ask us). New questions:
  invoice or purchase order (ask us), outdoors, fixings.
- **/custom-plaques:** 6 cards (oval, round, 400 × 300, 300 × 200, A4 upright, 400 × 300 on a board) and a full-width
  "Another size or shape?" tile (50 to 600 mm from checkoutPolicy: send the measurements on WhatsApp or use the design
  form for a free proof with the price); shapes drawn to scale. Questions: sizes and shapes, price for another size,
  instant proofing, own design, how long, plus the shop's "Can I see my plaque before I pay?".

**Opening date planner** (`services/occasionPlanner.ts`, pure): for a date it names, per kind of plaque on the page, the
last day to approve the proof and pay: the catalogue's production days (5, aged brass 7, A4 and A5 on a board 10,
400 × 300 on a board 15) plus one working day's delivery (as checkout and Merchant Center state) and a working day to
spare, counted back over weekends and England and Wales bank holidays. A day already gone says "Too close to promise:
ask us first"; dates after 2027 (the last listed bank holidays) are not counted; "estimates, not guarantees".

## The three review fixes (shared template: all eight pages)

1. **Cookie notice:** one slim bar, 52 px on a 390 × 844 phone (58 px on a computer), with Accept and Reject styled
   the same and a Settings link. Phones show it just above the Design/WhatsApp/Email bar (at the top in the designer, so
   Continue stays clear); computers along the bottom. It covers neither the H1, the first row of products nor the bar.
   Phones show "Cookies: allow analytics that record site use, and ads? Settings"; computers, the cookies page and the
   privacy page keep "We count visits anonymously even if you Reject" (decided in review). Consent behaviour unchanged.
   Site-wide (components/MetaConsent.tsx, shopfront.css).
2. **Facts line:** two phone lines, "From £58.50 · engraving, fixings & UK delivery included · free proof before you
   pay · made in 5 working days" (tree: "oak board, stake, engraving & UK delivery included … made in 10 working
   days"). Longer times are on the cards: a card says when a plaque behind it takes longer than the standard 5 days,
   naming the slowest ("Aged brass: 7 working days", "Made in 10 working days", "Made in 15 working days"); no line
   means every plaque on it is made in 5. The timing question gives every figure on memorial, bench, brass, stainless
   steel and custom; garden, tree and opening have no timing question (their cards carry the days; opening's planner too).
3. **Count:** "10 sizes · 6 finishes", from the cards shown, following the chips.

**The film (owner msg 8440):** the promo film is back on every template page inside "Free proof before you pay", tap
to play: `PromoFilm tapToPlay` shows a lazy poster image under a large play button, the `<video>` has no source, no
poster, `preload="none"` and no autoplay until tapped, and the same watch tracking runs (a tap counts as started from
the button). Its small print and "Watch it larger, with a written version" (`/video`) sit beside it. Nothing at the
top: the first row of studio product cards is the hero and the largest paint.

## Results (browser check on the local build; the preview gave the same first-screen numbers)

| Page | Phone: first card with notice / after Accept | Phone length | Computer first card | Before (live) |
| --- | --- | --- | --- | --- |
| memorial | 296 / 296 px | 6.63 screens | 291 px | 11.96 screens (stage 1 record) |
| bench | 296 / 296 px | 5.46 | 291 px | 10.14 |
| garden | 296 / 296 px | 6.28 | 291 px | ≈ 11.1 |
| tree | 296 / 296 px | 6.25 | 291 px | ≈ 9.8 |
| brass | 296 / 296 px | 5.92 | 313 px | ≈ 9.5 |
| stainless steel | 325 / 325 px (two-line H1) | 5.79 | 291 px | ≈ 9.7 |
| opening | 296 / 296 px | 6.50 | 291 px | ≈ 10.1 |
| custom | 296 / 296 px | 6.09 | 313 px | 9.39 (production source build) |

Notice 719–771 px on the phone (52 px; the contact bar starts at 777). Largest paint: a card's studio photo on every
page at both widths. Film: no download before the tap, box unchanged when the poster loads and while it plays, layout
shift 0, one download after the tap. Memorial 6.63 and opening 6.50 phone screens were accepted as "about 6.5" in review.

## Checks

- `npx tsc --noEmit -p tsconfig.check.json`: pass.
- `npm run build` (local) and every postbuild check: pass. The chain stopped once at a formatting bug in the new
  from-price code (a missing price crashed its message); fixed, then `npm run postbuild` passed in full. The Vercel
  preview build ran every postbuild check too: pass. Logs: `output/…/stage2/logs/` (build1, postbuild1, deploy-clean).
- `check-category-template.mjs` (postbuild), **extended to all eight pages:** titles, descriptions, H1s and canonicals
  as production's source `ec24ba1` builds them (memorial and bench, recorded from live in stage 1, and opening and
  custom, read from live at 13:01, equal that build exactly; garden, tree, brass and stainless steel could not be read
  from live today because of the checkpoint: `output/…/stage2/live-seo-metadata.json`); FAQPage schema equals the six visible questions;
  cards lead with studio photos and link to built pages (tree: the designer on the plate, on the board and stake);
  **each card's lead-time line matches the slowest `offer.productionDays` of the plaques behind it (`data-offers`), no
  line only when all are 5; the facts line says 5 (tree 10)**; the opening planner states the catalogue days, and its
  date maths is checked against the script's own calendar for every date it accepts from two "todays": 3,282 approval
  days, each arriving by the working day before the event and each the latest such day; days gone are refused; dates
  after 2027 not counted. One tap-to-play film in the proof block; no scene photos. **Pass.**
- `check-from-prices.mjs` (postbuild), **changed (intended):** the template rules now cover all eight pages (each
  swatch at its catalogue price, card from-price = lowest swatch, card leads to one of them, each size drawn to scale
  links to the cheapest plaque of its size in the page's metals at its price). Tree prices are the plate on its light
  oak board plus the £35 stake; the 200 mm round has no oak-board version in the catalogue, so its strip price is
  compared with the page's own price table. Removed with the old layout: the garden and custom setting/shape tiles and
  the garden, opening, brass and stainless product photo cards (the same choices are now cards, checked above).
  **Pass (250).**
- `check-category-template-browser.cjs` (local), **changed (intended):** all eight pages, phone and computer, plus the
  rules above (slim notice ≤ 64 px clear of the H1, first row and bar; largest paint a card photo; tap-to-play film;
  planner dates from `occasionPlanner.ts`, too-close and too-far dates; tree designer links). Its phone-length limit is
  now 6.7 screens ("about 6.5": the review accepted memorial at 6.61 and opening at 6.50; Cody's lead-time rule adds a
  line to one more memorial row, 6.63). **Pass** (24 runs; `output/…/stage2/browser-results-local.json`).
- `check-category-pages-browser.cjs` (local), **changed (intended):** only /portrait-plaques keeps the category layout,
  so only it is checked here (the six pages moved to the template and are checked, more strictly, above). **Pass.**
- `check-cookie-banner-clear.cjs` (local): home, memorial, bench, opening (template), house name and professional
  (occasion), a product page and the designer: notice 52 px (designer at the top), clear of each H1, first product
  row, hero buttons, contact bar and Continue; Accept and Reject store yes/no for analytics, recordings and ads;
  Settings opens /cookies. **Pass.**
- `check-promo-video-tracking.cjs` and `check-posthog-analytics.cjs` (`npm run check:posthog`, in postbuild): pass.
- Hosted (`vercel curl` on the preview): the eight pages answer 200 with 10/6/8/6/8/8/6/6 cards, the lead-time lines,
  one film, unchanged H1s, the facts line's days and the new notice; studio photos served through Vercel's image
  optimiser.

## Screenshots

Workspace `output/instaplaque-category-template-20261101/stage2/`:
- `after/`: the **preview** (phone 390 × 844, 2×): screen 1 with the notice, screen 1 after Accept, the whole page.
- `before/`: live, taken this morning before the checkpoint (garden, tree, brass, stainless, opening); custom from a
  local build of production's source `ec24ba1` (the live site served this server's browser the checkpoint; its live
  title, description, H1 and canonical equal that build).
- `fixes-before-after-first-screens.jpg` (memorial, bench: stage 1 preview vs now), `stage2-before-after-first-screens.jpg`
  (the six pages: live vs now) and `after-<slug>-whole-page-phone.jpg` (each page at 1× in three columns).
- `telegram/`: JPEG copies of those ten sheets, 1600 px or less, 600 KB or less.

## Rollback

Nothing is live. To take a page off the template, remove its slug from `templatePages` in
`components/CategoryTemplatePages.tsx` (on this branch it falls back to its category pages v2 config, not to live's
layout) and restore its old expectations in `check-from-prices.mjs` and `check-category-pages-browser.cjs` from `12e2b8c`.
To drop stage 2, deploy `12e2b8c` (stage 1); to drop everything, production stays as it is.

## Release note: what a production deploy of this branch would change

This branch is based on `df652c9` (the 31 Oct combined preview: category pages v2, the four occasion pages, anonymous
visit statistics), not on the live source. Production `dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8` was deployed with the CLI, so
Vercel records no commit for it; HANDOVER.md and docs/combined-preview-2026-10-31.md name its source as `ec24ba1`.
Local builds of `ec24ba1` and `6694a5d`, compared file by file (bundle hashes ignored;
`output/…/stage2/route-diff-vs-production-source.json`):

- **Every page (188 routes) changes only in the cookie notice:** the slim bar, with the combined preview's wording and
  its cookieless visit counting (Vercel Web Analytics counted by default under the PECR statistics exception, with a
  switch on /cookies). That is the combined preview's change plus this branch's bar; it ships with any release of this
  branch.
- **Content changes on 12 routes:** the eight template pages; /portrait-plaques (category pages v2); / (only its
  structured-data list of categories, which adds the four occasion pages); /cookies and /privacy (the visit statistics
  wording and switch).
- **4 new routes:** /house-name-plaques, /donor-recognition-plaques, /church-plaques, /professional-brass-plaques; the
  sitemap adds them (25 → 29 URLs; lastmod of memorial, brass and opening moves from 28 to 31 Oct). 16 new finish
  images in `site-images/finish/`. Nothing removed.

To ship only approved parts: the `templatePages` switch keeps unapproved slugs off the template, but on this branch they
then show category pages v2, and the occasion pages, statistics and notice wording come with it. A release of only the
template pages needs them ported onto `ec24ba1` (template files, the CSS block, the commerce.ts questions, the finish
images, the ShopProduct switch) with the cookie bar redone on live's notice; that port has not been tried. Research
memorial (e) item 10: watch Search Console for 2–3 weeks after changing these pages.
