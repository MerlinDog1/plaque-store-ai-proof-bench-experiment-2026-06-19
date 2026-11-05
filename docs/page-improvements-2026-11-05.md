# Page-1 improvements: garden, brass, stainless steel, opening and tree — 5 November 2026

**PREVIEW ONLY until the owner says go live.** Owner msg 10173: "go with improvements", agreeing the plan sent at
21:26 UTC (Search Console 6 Oct-2 Nov, workspace `output/instaplaque-page1-20261105/`). The branch also carries the
four stage-three pages (`codex/instaplaque-stage3-pages-20261104`, merged unchanged in `93ef7d5`), because the plan
links to the new donor, church, house-name and practice pages.

## What changes

| Page | Change | Why |
| --- | --- | --- |
| /garden-plaques | H1 "Personalised garden plaques" -> **"Garden memorial plaques"** | "memorial plaques for garden" 15th, "garden memorial plaques" 18th |
| /garden-plaques | New section **Memorial gardens and gardens of remembrance** (garden of remembrance, own garden, memorial tree, memorial bench) | the searches above |
| /garden-plaques | New section **Garden dedication signs** (naming a garden, school/community garden, opening) | "garden dedication signs" 6th, no clicks yet |
| /garden-plaques | Links to /tree-memorial-plaques by name (section heading and related line); `about` schema says "garden dedication signs", not "tree dedication plaques" | "memorial tree plaques" showed this page 43rd instead of the tree page |
| /stainless-steel-plaques | New **What stainless steel plaques are used for** (7 uses, 5 linking to their pages) and **wording ideas** | "stainless steel plaques" 13th; the thinnest page |
| /brass-plaques | New **What brass plaques are used for** (7 uses, all linked), **wording ideas** and **Aged brass plaques** (finish, prices, making time, outdoors, care, every aged brass size) | "brass plaques" 33rd, "custom brass" and "aged brass" about 16th |
| /opening-plaques | Three more wording ideas (support, a title such as MBE, an anniversary): six in all | "opening plaques" 12th; donor and church pages already link here |
| All five | Search summary (meta and og:description) leads with the page's own from-price | clearer Google results |

The tree page's content is unchanged; only its summary changes. No URL, title, canonical, product, price, photo,
FAQ or other page changes. The wording ideas on brass, stainless steel and opening are ones already used on the
earlier live pages (`components/CategoryPages.tsx`), apart from the anniversary example. Every fact in the new copy
comes from the site's existing copy (finish notes, FAQs, size tables, the catalogue's production days).

From-prices in the summaries are filled in from the same value as each page's "From" line (`services/commerce.ts`,
`searchSummaries`), so they cannot drift: garden £58.50, stainless £58.50, brass £63.50, opening £95.50, tree £187.50
(plate, light solid wood board and stake). The prerender now takes brass and stainless steel titles and summaries
from the catalogue, like memorial (titles unchanged), so the static HTML and the app agree.

## Code

- `components/CategoryTemplate.tsx`: optional `guides` on a template config, rendered after the wording ideas as
  `section.cat-tpl-guide` with an H2, an intro and linked notes (anchors `${prefix}-${key}`).
- `components/CategoryTemplatePages.tsx`: the garden, brass, stainless steel and opening content above.
- `services/commerce.ts`: `searchSummaries`; garden `relatedSearches`.
- `scripts/prerender-product-pages.mjs`: catalogue metadata for brass and stainless; garden `about`.
- `shopfront.css`: `.cat-tpl-guide-list` (phone stacked, computer auto-fill columns).

## Checks

- `npx tsc --noEmit`; full `npm run build` with every postbuild guard (383 PASS lines, exit 0), including
  `check-category-template.mjs`, now asserting the new H1, the five summaries against the facts line's own
  from-price (meta and og), each new section heading, six opening wording ideas, and that every guide link reaches a
  built page; `check-from-prices.mjs` (hero = cheapest in the price table on all eight pages).
- `scripts/check-page-improvements-scope.py BASELINE_DIST dist REPORT`: against a build of the parent `93ef7d5`,
  4 pages improved, the tree page differs only in its summary, 199 pages differ only in bundle hashes, 3 identical,
  no other file changed (sitemap, robots, Merchant feed byte-identical), nothing added or removed.
- Phone length: the new sections are sideways rows on phones (like the wording ideas), stacked columns on computers.
  Measured on the local build (390 x 844): garden 7.63, brass 7.69, stainless steel 7.24, opening 7.07 phone screens.
  `check-category-template-browser.cjs` now allows 7.8 (was 7.6, set for the film section in owner msg 8603).
- `scripts/check-category-template-browser.cjs` on the local build (phone 390 x 844 and computer 1440 x 900) for the
  changed pages: results are recorded in the handover once the run finishes.

## Release (on the owner's go only)

`flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --prod --skip-domain`, check,
then `vercel promote`. Rollback: promote the deployment live before the release (`dpl_EN5TJhoAY3gizahUEiQG9hji4mr2`
on 5 Nov). After release: resubmit the sitemap, and request indexing again for garden, brass, stainless steel and
opening (the eight category pages were last crawled 26-30 Oct). Measure in two to four weeks: positions and clicks
for the searches in the table, and whether "memorial tree plaques" moves to the tree page.
