# Tree page priced on the oak board and ground stake (26 Oct 2026)

## Why

The owner (msg 6506, with a screenshot of the tree page's "Choose a size for the tree." table): "do we want on the
tree one at least to show that each has a board and also lets include the stake becasue you kinda need it for thsi
product".

Before this change, the table showed the plate alone (A5 stainless £95.50). Its note said "An oak board is priced on
each plaque, and the ground stake adds £35", so the price of what a tree plaque actually is (plate, oak board and stake,
as in every tree photo and in the Nicola order) appeared nowhere on the page.

## What changed

- **Size table** (`PriceTable` with `mount="stake"`, set by `sizes.mount: 'stake'` in `CategoryPages.tsx`):
  - every price is the plaque on the light oak board (bevel edge) with the black steel ground stake, from
    `estimatePlaquePrice`, the same function the designer and the server checkout use;
  - each plate is drawn to scale on its oak board (25 mm larger each way, round for the round plate), with the visible
    part of the 30 mm stake under it (`groundStakeVisibleMm`, as in the designer). Every drawing shares one scale, and all
    the stakes stand on one ground line;
  - each price links to `/design?backing=stake&plaque=<catalogue slug>` (`designWithStakeHref`), which opens the
    designer on that plaque on the board and stake at the same price. The plaque pages themselves have no stake, so
    they would have shown a different price;
  - the small print reads "Prices include the oak board, the black steel ground stake, engraving, fixings and UK
    delivery…", then "Fixing it to a post, wall or fence instead? The plate alone is from £94: take the board and
    stake off at the designer's Backing step."

  | Size | Stainless steel | Brass | Aged brass |
  |---|---|---|---|
  | 200 × 150 mm | £187.50 | £197 | £209.50 |
  | A5 210 × 148 mm | £190 | £200 | £213 |
  | 200 mm round | £214.50 | £227 | £243 |
  | A4 297 × 210 mm | £265 | £281.50 | £302.50 |

  Mirror steel and polished or orbital brass cost the brass price, as on the other tables.
- **From-price and "Design online":**
  - The tree landing page has `mount: 'stake'` (`services/commerce.ts`). `landingDesignProduct()` returns the related
    memorial product (A5 brushed stainless) on the board and stake, priced "from £190".
  - The hero, the "Design online" buttons (hero, closing section and phone bar) and the memorial and garden pages'
    "By a tree" tiles all use it.
  - Owner msg 5906 still holds: the from-price is the plaque that "Design online" opens, so the price doesn't jump.
  - The hero note reads "A5 stainless steel on an oak board and black steel ground stake, with engraving and UK
    delivery".
- **Photo caption:** "Shown: A5 brushed brass on an oak board and ground stake, £200. Design this one". The link opens
  that plaque (`brushed-brass-210x148-rect-light-wood-plaque`, keeping its own board) with the stake.
- **Copy:**
  - The "in place" intro now ends "Both are included in every price on this page. Design one online."
  - "Fix it beside the tree": "Our tree plaque prices include the board and the stake, and the designer starts with
    both."
  - FAQ "Can I fix a plaque to a tree?": "(both are included in our tree plaque prices)". This also changes the FAQ
    schema, which is built from the same list.
- **Designer** (`App.tsx`): `/design?backing=stake` still opens the memorial preset on the board and stake.
  - An optional `&plaque=<slug>` opens that catalogue plaque instead.
  - `onBoardAndStake()` (`services/groundStake.ts`) adds the light oak board unless the plaque already has wood, then
    the stake.
  - Both parameters are removed from the address on arrival.
- `WOOD_BACKING_EXTRA_MM` is now exported from `checkoutPolicy.mjs` (via `services/pricing.ts`) for the drawings. Its
  value and every price rule are unchanged.

## Not changed

- No price changed anywhere: the plate, board and £35 stake prices are the same. Server checkout, orders, emails,
  product pages, the Merchant feed and the sitemaps are unchanged.
- The other eight category pages and the homepage keep their plate-only tables.

## Checks

- `tsc -p output/tsconfig.stake.json` passes.
- **Candidate** `instaplaque-5rlsj2we1` (dpl_8cNFnsp71iWeN1vUAWXiqq55y6pD), staged with
  `vercel deploy --prod --skip-domain`: the Vercel build and every postbuild check pass.
- **Prerendered HTML of 9 pages** (`workspace/output/instaplaque-tree-stake-prices-20261026/check_static.mjs`) passes:
  - On the tree page, all 12 prices equal `estimatePlaquePrice` with board and stake, worked out in the check itself,
    and each links to its designer address.
  - Every tree row draws a board and a stake.
  - The hero, caption, intro, small print, section and FAQ texts are new. None of the old "stake adds £35 / Backing
    step" wording is left on the page or in its schema.
  - The memorial and garden "By a tree" tiles read "from £190".
  - The other 7 pages' tables are unchanged: plate prices, links to plaque pages, no boards drawn.
- **Real built app in headless Chrome** (`check_tree.cjs` via `run_check.sh`), computer and iPhone 13, both pass:
  - the hero reads "from £190 …";
  - all 12 table prices are correct;
  - each drawing has the plate inside its board and a centred stake, at one scale and on one ground line;
  - nothing is wider than the screen.
  - "Design online" opens the A5 on its board and stake at £190.
  - The A4 aged brass (£302.50), round brass (£227) and 200 × 150 steel (£187.50) prices, and the caption link
    (£200), each open the designer on that plaque on its board (round for the round plate) with the stake drawn. Each
    shows the same price, on the wording step, with the address cleaned to /design.
  - No page errors.

## Google Ads

The live tree ad (Search 24385756716, ad group "Tree memorial plaques", ad 829531242892) has the headlines "Tree
Plaques From £95.50" and "Oak Board & Stake Options".

- They must change with the release, so the ad doesn't quote a lower price than the page.
- `projects/instaplaque-google-ads-memorial-20261009/scripts/tree-ad-price-20261026.py` swaps them for "Tree Plaques
  From £190" and "Oak Board & Stake Included", keeping the other headlines, pins, descriptions and URL.
- `validate` passed on 26 Oct.
- `apply` refuses to run until the live page shows £190.
- `undo` restores the old headlines; run it together with a site rollback.
- **Applied** at 09:20:17 UTC on 26 Oct, after the release: the read-back shows "Tree Plaques From £190" and "Oak
  Board & Stake Included", with the other 13 headlines, the 4 descriptions and the URL unchanged. Google's review
  finished within minutes: APPROVED (REVIEWED). The group's other ad (829423213885) is paused, and no other enabled
  ad or sitelink quotes a tree price.

## Release

- **Promoted:** the owner said "yeah go live i like iot" (msg 6519). `vercel promote` set `instaplaque.co.uk` to
  dpl_8cNFnsp71iWeN1vUAWXiqq55y6pD (instaplaque-5rlsj2we1) at 09:17 UTC on 26 Oct.
  - Production was still dpl_ArHjbD1APPwCh2v82YFsTZt5XhZV, so nothing newer was overwritten.
  - All 9 live pages serve `index-BaBqo9MQ.js`. It and `index-Co8x8iq_.css` are byte-identical to the files the
    browser check ran on, so that check stands for the live site; no second browser run was made (the account was
    at 3.4 GiB).
- **Live checks, all passing:**
  - `check_static.mjs` with `CACHE=live-cache` (the live HTML fetched with curl): the tree table's 12 board-and-stake
    prices and their designer links, the new wording, the memorial and garden tiles "from £190", and the other 7
    pages' tables unchanged.
  - `verify_live.py` (`BUNDLE=index-BaBqo9MQ.js`): 175 product pages and 771 linked assets identical to `public/`;
    sitemaps, feed (175 items), redirects and the IndexNow key are fine.
  - `/design` and a designer link from the table both return 200 with the new bundle.
- **Google Ads:** the tree ad change above.
- **IndexNow:** told about the tree, memorial and garden pages (HTTP 200).
- **Rollback:** with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, run
  `vercel promote https://instaplaque-k902y8x8f-dullaghan31-3959s-projects.vercel.app --yes`
  (dpl_ArHjbD1APPwCh2v82YFsTZt5XhZV), then `python3 -I scripts/tree-ad-price-20261026.py undo` in the ads project.
