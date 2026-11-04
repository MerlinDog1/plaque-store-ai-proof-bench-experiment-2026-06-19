# Stage 3: house, donor, church and practice pages — 4 November 2026

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
