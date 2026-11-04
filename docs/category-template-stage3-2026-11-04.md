# Stage 3: house, donor, church and practice pages — 4 November 2026

## Wording-matched card leads — revision 2, 4 November

**PREVIEW ONLY. Production, domains and aliases remain untouched.**

This correction supersedes the first preview’s card/photo selections below. The parent’s review found
memorial, pet and house-name inscriptions on the wrong occasion pages. Each default lead now uses the exact
requested existing catalogue configuration and its matching inscription: **house 3, donor 6, church 6,
practice 4**. No new product image or scene image was created. Earlier screenshots and preview evidence remain.

- House has only house/building-name leads. Its empty wood-board filter is removed; the same live finish-chip
  and swatch behavior remains. There is no shared-template/CSS change.
- Donor leads are dedications or named-room/opening examples, not personal memorials. The Meadows Community Hub
  keeps a stainless-steel lead. Small individual-name plates remain available in the size table/designer.
- Church leads use the requested pew/church/memorial examples. The 225 × 65 mm strip is added to the table and FAQ;
  old 225 × 75, landscape A5/A4 sizes remain in the table/designer. The social/schema image now uses Ivor Pugh.
- Practice is brass only and leads with The Studio, followed by the three approved named rooms/library.
  **There are still no actual professional-practice-name examples**: these are the explicitly requested fallbacks.
  All four cards have wood backing, so the live template derives 10 working days in the facts line and 10/15 on
  the cards. The available unbacked 150 × 50 mm size keeps the page’s £63.50 From price truthful.
- House/donor/church still start at £58.50 for the available 150 × 50 mm stainless option. Removed grid sizes are
  retained in the tables and designer; no product, price, lead time, or designer default was changed.
- `check-category-template.mjs` now reads `services/catalogueExamples.ts` for every default lead on these pages.
  It rejects person/pet memorials, in-memory/planting wording on house/donor/practice; pets, openings and planting
  on church; and a catalogue use that does not fit the page. Thirteen actual incompatible catalogue examples
  exercise the guard. Swatch and chip alternatives deliberately retain the live behavior, as requested.

### Every default card and its photo wording

#### /house-name-plaques

1. **200 × 150 mm — Polished brass**: HOLLY / HOUSE
2. **250 × 150 mm oval — Brushed brass**: LARCH / HOUSE
3. **200 mm round — Brushed steel**: THE OLD / SCHOOL / 1874

#### /donor-recognition-plaques

1. **300 × 200 mm — Orbital brass**: This garden is dedicated to / THE NURSES / of Slad Valley Hospital
2. **A4 · 297 × 210 mm — Brushed steel**: THE MEADOWS / COMMUNITY HUB / was officially opened by / Councillor Anne Fielding / on 14 March 2026
3. **200 × 150 mm — Aged brass on light wood**: THE GILLIAN / GREENWOOD ROOM / Opened on 14 April 2024
4. **A4 · 210 × 297 mm — Orbital brass on dark wood**: THE ERIC / PICKERING / ROOM / Opened on 13 November 2025
5. **A5 · 148 × 210 mm — Orbital brass on light wood**: THE ART / ROOM / Opened on 20 June 2023
6. **400 × 300 mm — Polished brass on dark wood**: THE LIBRARY / Opened on 24 September 2025

#### /church-plaques

1. **150 × 50 mm — Polished brass**: In loving memory of / VICTOR HOLLINS / 1933 – 2015
2. **225 × 65 mm — Polished steel**: In loving memory of / REVD JOHN ASHWORTH / 1929 – 2012 / “Come ye apart and rest a while” Mark 6:31
3. **200 × 150 mm — Polished brass on light wood**: In loving memory of / IVOR PUGH / 1938 – 2017 / Lay reader in this church / for thirty years, / a good and faithful servant
4. **A5 · 148 × 210 mm — Polished brass on light wood**: In loving memory of / SAMUEL / HARGREAVES / 1924 – 2011 / Bell ringer at St Mary's / for seventy years / Ring on
5. **250 × 150 mm oval — Polished brass**: In loving memory of / IRENE BAXTER / 1933 – 2022 / who arranged the flowers here / for more than fifty years
6. **A4 · 210 × 297 mm — Brushed steel**: In loving memory of / ROBERT / ILLINGWORTH / 1937 – 2008

#### /professional-brass-plaques

1. **200 × 150 mm — Orbital brass on dark wood**: THE STUDIO / Opened on 23 October 2023
2. **A5 · 210 × 148 mm — Aged brass on light wood**: THE CLIFFORD / ACKROYD ROOM / Opened on 22 March 2025
3. **A4 · 297 × 210 mm — Polished brass on light wood**: THE AUDREY / GODFREY ROOM / Opened on 21 February 2024
4. **400 × 300 mm — Polished brass on dark wood**: THE LIBRARY / Opened on 24 September 2025

### Revision-two verification and delivery

Evidence is in workspace `output/instaplaque-stage3-pages-20261104/wording-r2/`; all new review JPEGs have
`wording-r2` in their filenames, preserving the first set. The build’s `lead-wording.json` / `lead-wording.md`
record the exact default product slugs, image paths and wording from the built HTML and catalogue.
Both TypeScript checks and the full local build/postbuild passed. The wording guard accepted all 19 default
leads and rejected all 13 incompatible catalogue regression examples. The unchanged-live scope check passed
for all 203 existing HTML files: no title/canonical/content changes except the three previously added incoming
link paragraphs (bundle hashes excluded). Portrait comparison passed at 390 and 1440 px. Independent read-only
review inspected all 18 unique studio images and confirmed all 19 requested leads, catalogue facts and size
retention, with no blockers. The full category-browser run passed all 24 existing-page cases, then caught a 2.45 px donor desktop
cookie-bar overlap: its two-line intro plus a wood-backed card stretched the first row. Shortening only that
page's intro keeps all six requested leads and the shared template unchanged. The final rebuild/postbuild
passed again, and all four revised pages passed all 12 browser cases / 19 card interactions. Combined with
24 passing unchanged-live-page cases, this is **36 cases / 77 card interactions**; evidence is
`browser-results-verified.json`. No overflow, page errors or cookie-bar overlaps remain. First phone cards
start at 296 px; phone lengths are house 5.91, donor 6.40, church 6.38, practice 6.06 screens.

All four pages were captured at 390 × 844 and 1440 × 900; the final phone contact sheet and desktop layout
sheet were visually inspected. `stage3-wording-r2-phone-contact-sheet.jpg` is 706 × 1600, about 253 KiB.
The new preview receipt follows after deployment. Production before this correction remains
`dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`.

---

## First preview record (superseded card selections)

**PREVIEW ONLY. No production deployment, promotion, alias or domain change.**
Branch: `codex/instaplaque-stage3-pages-20261104`, based on live source `86188c9`
(`codex/instaplaque-consent-stats-20261102`). Production was independently inspected as
`dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN` before this work.

## Pages and sources

| Route | Search title | Products / from-price |
| --- | --- | --- |
| `/house-name-plaques` | House Name Plaques \| Engraved Brass & Steel \| InstaPlaque | 200 × 150, oval, strip, A5 upright, round, A5 on wood; from £58.50 |
| `/donor-recognition-plaques` | Donor & Recognition Plaques \| Brass Sponsor Plaques \| InstaPlaque | Two individual donor strip sizes, A5 upright, A4, 300 × 200 on wood, 400 × 300; from £58.50 |
| `/church-plaques` | Church Pew & Dedication Plaques \| Engraved Metal \| InstaPlaque | Two pew strips, A5 on wood, A5 upright, A4 upright and landscape; from £58.50 |
| `/professional-brass-plaques` | Brass Plaques for Professional Practices \| InstaPlaque | Brass only: 200 × 150, office strip, A5, A4, A5 and 200 × 150 on wood; from £63.50 |

These are the four drafts from `codex/instaplaque-seo-landing-pages-20261031`
(`services/occasionLandingPages.ts`, `docs/seo-landing-pages-2026-10-31.md`), rewritten to the
live template's length and order. Implementation follows [the live category release](category-template-release-2026-11-01.md)
and its historical stage 1 / stage 2 docs on `codex/instaplaque-category-template-20261101`.
The rejected combined-preview layout and its other changes are not imported.

- `components/OccasionTemplatePages.tsx`: four configs registered with the existing `CategoryTemplatePages`.
  Six catalogue cards each; finish / backing chips, facts line, six FAQs, scale drawings and prices,
  free-proof steps and sample PDF, separate tap-to-play film, finishes, wording ideas and internal links.
- `services/occasionLandingPages.ts`: shared metadata, concise folded guidance and FAQs. No new product records.
  All prices and card lead times come from `merchantCatalogue.mjs` / the existing pricing code;
  the timing FAQ is `productionTiming.faq`. All four facts lines say five working days; cards show longer times.
- H1s: House name plaques; Donor & recognition plaques; Church plaques; Brass practice plaques.
  Titles/descriptions retain the draft's search intent. Canonicals are the corresponding `https://instaplaque.co.uk/` routes.
- Prerendering supplies WebPage, CollectionPage, BreadcrumbList, matching FAQPage and an ItemList of linked real
  products, not Product offers or reviews. The live homepage's existing category schema is deliberately unchanged.
- Four sitemap entries, dated 4 November. Existing entries/dates and the product sitemap are unchanged.
  Incoming links only: memorial → church; brass → house / practice; opening → donor / church. No footer expansion.
- Exact `/design?plaque=` defaults work without JavaScript and match the hydrated landing defaults.
  Existing Design online / WhatsApp CTAs and free-proof flow are retained. No enquiry or order was submitted.

## Photos and honest gaps

Lead pictures use the existing approved `/site-images/studio-photo/` catalogue assets and finish crops.
No scene/in-place picture or new generated image was added. The underlying source calls these
**studio-style renders made from the designer's exact product layout**, with `trainedAlgorithmicMedia`
metadata (`services/studioPhotos.mjs`); this task does not claim they are newly photographed physical plaques.

- House: the first rectangle is **HOLLY HOUSE**, the oval **LARCH HOUSE**, and the round **THE OLD SCHOOL**.
  Strip / A5 examples use existing memorial wording; the board uses an existing named-room example.
- Donor: no dedicated donor/sponsor inscription photo. Existing small memorial plates and larger memorial/opening
  examples show the exact products. The A4 leads with the existing pavilion-opening example, not a pet memorial.
  The sample proof explicitly says it has example opening wording.
- Church: existing memorial inscription plates and wood-backed memorials; no church-specific on-site photograph.
- Practice: no dedicated solicitor/dentist/vet/practice photo. Existing name plate (**HOLLY HOUSE**), named-room,
  opening and strip examples show the appropriate brass sizes/finishes. Its OG image and labelled sample proof use
  **THE STUDIO**, the existing 200 × 150 mm orbital-brass plaque on dark solid wood.
- The bare landscape A5 steel offer has no eligible studio image. Mixed-metal A5 cards therefore use the actual
  **upright 148 × 210 mm** catalogue product, available in studio shots; brass-only A5 remains landscape.
- The 150 × 50 brushed-stainless option has no studio shot. Selecting that swatch shows the live template’s
  explicitly labelled **flat design view**, not a scene photo. Every default card still leads with a studio example.

Light/dark solid wood only in supplied-board descriptions (short labels remain light/dark wood, as on live).
A house's sample name is not a claim about the backing species. The owner's name is not added to any page.
Church copy asks the church to agree the proposal and permissions; it does not claim a universal exemption.
Practice copy asks for approved names/titles and does not claim regulatory compliance. Detailed regulator/diocese
rules from the old draft are omitted rather than reproduced as new unverified claims. No invented reviews,
statistics, commissions, steel grades, finish-match guarantee, payment terms or delivery guarantees.

## Verification

Evidence: workspace `output/instaplaque-stage3-pages-20261104/`.
The unchanged baseline was built first and retained at workspace `tmp/instaplaque-stage3-pages-20261104/base-86188c9-dist`.
The task worktree shares an unchanged-lockfile `node_modules` with the live-source worktree; no dependencies changed.

- Independent read-only copy/catalogue review: no copy, price, dimensions, fixings, designer-default or schema
  blockers. Its studio-gap notes are recorded above; its closer **THE STUDIO** practice example was adopted.
- `npm run typecheck` and `npx tsc --noEmit -p tsconfig.check.json`: PASS.
- Build / postbuild: the initial card guard correctly caught the landscape A5 steel photo gap; the cards above
  resolve it. A new assertion initially omitted the existing decorative arrow from the Design online label;
  corrected the test selector, not the CTA. Final full `npm run build` + every postbuild gate: **PASS**,
  `logs/release-build.log` (including all twelve category/static/price checks).
- `check-category-template.mjs` and `check-from-prices.mjs` extended to all twelve pages: exact metadata/FAQs/schema,
  real catalogue options, all card/swatch/size prices and production days, no scene photos, no-JS designer defaults,
  files and internal destinations. Existing 3,282 opening-planner calendar cases retained.
- `check-category-template-browser.cjs` extended to all twelve pages, using the supplied `playwright-core`
  installation and `/usr/bin/google-chrome`, with 390 × 844 phone and 1440 × 900 desktop viewports, plus no-JS.
  Trackers are blocked and the browser marked internal. Swatches, chips, card navigation, FAQs, notice clearance,
  overflow, first-paint product photos and tap-to-play video are checked. The full twelve-page run passed all
  **36 cases / 82 cards** (`logs/browser.log`). After the final house/practice studio selections, the four new pages
  passed all **12 final cases / 24 cards** again (`logs/browser-final.log`). The last donor A4 photo selection
  also passed its three cases (`logs/browser-donor-final.log`); final screenshots/results include that check.
  `CATEGORY_SLUGS` supports these targeted rechecks.
- Portrait regression browser check: **PASS** at 390 and 1440 px, exact baseline layout, metadata, images and links
  (`logs/portrait-browser.log`). No portrait work was imported.
- `check-category-stage3-scope.py BASELINE_DIST dist REPORT_JSON`: full built-HTML comparison, including hidden
  content and JSON-LD. **203 existing HTML files:** 197 bundle-only, 3 byte-identical, 3 changed only by the exact
  approved link paragraphs. Zero changed existing title/description/H1/canonical. Exactly four new routes,
  no removed files, all other non-bundle files identical. Existing sitemap entries unchanged; exactly four added.
  Merchant feed and robots unchanged. Portrait has no content change.

### Final screenshots and measurements

`browser-final/`: first screens, second phone screens, full pages and no-JS views of the final four pages.
Root `*-phone.jpg` files are exactly 390 × 844; `*-desktop.jpg` are 1440 × 900.
`stage3-phone-contact-sheet.jpg`: four first screens together, at most 800 × 1600 and phone-friendly file size.
`browser-results-verified.json` combines the unchanged eight-page results with the final four-page recheck.

| Final page | First phone card, notice open | Phone screens |
| --- | --- | --- |
| /house-name-plaques | 296 px | 6.33 |
| /donor-recognition-plaques | 296 px | 6.39 |
| /church-plaques | 296 px | 6.38 |
| /professional-brass-plaques | 296 px | 6.47 |

Zero overflow / page errors. Phone notice 56 px; desktop 62 px. Film waits for a tap and has zero measured layout shift.

## Release boundary

The eight live templates, homepage, portrait page, legal/cookie pages, consent/statistics code, designer,
checkout, prices, products, Merchant feed and backend are retained (only the three incoming link paragraphs above).
Neither `services/exportService.ts` nor `components/PlaquePreview.tsx` is touched; the parallel border fix is separate.
Git deployment is disabled for `codex/` branches in `vercel.json`; no workflow publishes this task branch.

This preview is **not** approval to release. The parent will combine/reconcile it with any independently checked
border fix against the then-current live source. No Search Console or Merchant Center submission was made.
A production rollback is not needed: this task never changes production.


## Ready preview receipt

- **Preview:** https://instaplaque-25t9gzp2s-dullaghan31-3959s-projects.vercel.app
- **Deployment:** `dpl_4hyxmWgzKf4iDC1qdkUsQ2yVWWF6`, independently inspected **Ready**, target **preview**.
- **Deployed source:** `5035d66b041f72ed1f5532c3e975aa8448e38bab`, pushed to `codex/instaplaque-stage3-pages-20261104` before deploying.
- Command: `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --yes --scope dullaghan31-3959s-projects`.
  The API probe returned 403 **application/json** at 14:43 UTC, so no checkpoint retry was needed.
  Cloud build and every postbuild gate passed. Logs and `preview-receipt.json` are in the evidence directory.
- Hosted smoke: **13/13 HTTP 200**, through `vercel curl`, spaced ten seconds apart. All four new pages,
  memorial/brass/opening, home, portrait and cookies match the browser-tested build for metadata, H1, body copy,
  links and JSON-LD. Sitemap, 175-item Merchant feed and robots are byte-identical to the tested files.
  Evidence: `logs/hosted-check.log`, `hosted-results.json`, `hosted/`.
- Production independently inspected **before and after**: still `dpl_6dZgz3ts9pDczDeXGcyQbKpz2GJN`, Ready, production.
  No production command, promotion, production alias/domain, environment, database, Ads or Merchant change was made.
- The local server on 127.0.0.1:4398 and task browsers are stopped. Screenshots were inspected locally;
  hosted interaction testing is not claimed. No message was sent to the owner or a customer by this task.
