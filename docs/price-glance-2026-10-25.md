# Prices at a glance (25 Oct 2026)

## Why

- **Msg 6430:** "What about some neat price thing on the homepage that like shows you the prices and sizes by material?
  … Just seems price is kind of hidden a bit?"
- **Msg 6436:** "does that mean we need it on the ad pages?"
- **Msg 6442:** "Go ahead and with switch".

**What I found on the live site** (iPhone 13 and 1280 px, first visit):
- The homepage showed no price on a phone's first screen. Its tile prices sat under the cookie notice, and the whole
  page had only 4–5 "from" prices.
- `/plaque-sizes` had 0 GA4 views since it launched.
- PostHog: 3 of 13 homepage landers saw a price.
- On the category pages (where the ads land), the hero "from" price sat just below a phone's first screen, under the
  cookie notice. On /memorial-plaques the only price on that screen was the photo caption's £155, which includes the
  board.
- The size ladders showed one metal only.

## What changed

- **`components/PriceTable.tsx`:** one table of sizes × Stainless steel / Brass / Aged brass.
  - Three columns cover every finish: mirror steel and polished or orbital brass cost the same as brushed brass, and
    aged brass about 25% more than steel.
  - Each cell is the plain catalogue plaque (`merchantOffers`, no wood) of that size and metal. It shows that plaque's
    price and links to its page, so the amount never changes on the next page.
  - Rows show the name and size, an outline drawn to scale, and optionally what fits.
  - It is a real `<table>` with a hidden caption, and each link has an aria-label such as "A5 · 210 × 148 mm, brass:
    £105.50".
  - Prices use `TrackedPrice`, so `price_viewed` works as before.
- **Homepage:**
  - "Prices at a glance." sits right after the hero, with six sizes: bench 150×50, bench 225×75, A5, 200 round, A4,
    400×300.
  - Under the table: what the prices include, the A5 board price (`estimateWoodAddOn`, £59.50) and the ground stake
    (£35), a "See every size and price" button (/plaque-sizes) and "Compare materials & finishes" (/materials).
  - It replaces the "Brass or stainless steel?" section and its two photos.
  - On phones the "what fits" lines are hidden to keep the table short.
  - The hero kicker now reads "Free proof · UK delivery · from £58.50", using the bench product's from-price.
- **Category pages:**
  - `SizeLadder` now renders the table for the page's four sizes.
  - Under the table, the shared sentence `priceTableIncludes`, then each page's own note (wood, stake, quotes). The
    old "Prices are for brushed stainless steel…" notes are rewritten; bench has no extra note.
  - `CategoryHero` puts the price block before the inline photo, so on phones it shows above the photo and cookie
    notice. Computers are unchanged, because the inline photo is hidden there.
  - The phone photo margins are adjusted to match.
- **Hero captions:** "the plaque priced below" was wrong once the price moved, and was already wrong on computers.
  Captions now name the plaque's own price, e.g. "Shown: A5 brushed brass, £105.50. See this plaque".
- **Styles:** `.price-table*` and `.shop-home-prices*` at the end of `shopfront.css`, with phone rules. The unused
  `.shop-materials` styles are left in place.

## Checks

- Type check passes: `tsc -p output/tsconfig.stake.json`, which now includes the changed components.
- Vercel build and every postbuild check pass on the staged copy `instaplaque-k902y8x8f`.
- **Prerendered HTML of all 9 pages** (home plus 8 categories, `workspace/output/instaplaque-price-glance-20261025/check_static.mjs`):
  every row has 3 links, each to an existing plaque page showing that plaque's catalogue price, and no "priced below"
  remains.
- **Real built app in headless Chrome** (`shoot_prices.cjs`):
  - Phone, first visit: the price sits above the cookie notice on /, /memorial-plaques, /brass-plaques and
    /bench-plaques (top 133, 328, 290 and 328 px; the notice starts at 469).
  - Tables match the catalogue on phone and computer.
  - Nothing is wider than the screen, and there are no page errors.
- The bench page and the clean section pictures were shot from the prerendered pages with JavaScript off
  (`shoot_static.cjs`). With the gateway at about 2.1 GB, a full app run on a third page tripped the account memory
  watchdog.
