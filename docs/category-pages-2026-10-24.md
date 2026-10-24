# Category pages brought up to the memorial page's standard (24 Oct 2026)

Owner msg 5927 (15:17 UTC): "OK now bring every other page up to that standard. Sense check each Pic and redo if
dumb. Remember to use mixture of materials, borders, woods etc".

Pages: bench, garden, brass, stainless steel, memorial tree, opening and custom, plus a smaller update to the
portrait page. Memorial is unchanged; its static render is byte-identical after the refactor.

## The sense check

Every picture on the eight pages was checked by eye, along with the other catalogue photos the picks draw from (all
173 product photos in `output/instaplaque-pages-standard-20261024/cat/`). Most were sensible.

**Didn't make sense (redrawn):**

| Product | Photo showed | Redrawn as |
|---|---|---|
| `brushed-stainless-200x150` | "This cherry tree was planted…" on a bare brick wall | Wall beside a cherry tree in blossom |
| `polished-brass-210x148` | "This oak tree was planted…" on a bare brick wall | Stone beside a young oak |
| `polished-brass-148x210` | "This apple tree was planted by the pupils…" on a bare brick wall | School garden wall beside an apple tree |
| `polished-stainless-210x297` | "This orchard was planted…" on a bare brick wall | Orchard gateway |
| `aged-brass-297x210` | "This hedge was planted…" on a bare brick wall | Village hall wall above a newly planted hedge |
| `orbital-brass-200x200-circle` | "Planted by Year 6" with nothing planted | School wall beside a newly planted tree |
| `polished-brass-200x200-circle` | "Here lies Willow, the sweetest cat" on a house wall | Garden border, by a stone |

These photos are linked with `?v=2` (`cataloguePhotoVersions` in `services/commerce.ts`), so phones fetch the new copy.

**Also fixed:**
- The A5 brushed stainless plaque had only a grey studio picture. It now has an in-place photo: a square crop of the memorial page's hero, which shows that plaque.
- Duplicated or misleading top photos:
  - brass and opening shared the Maplewood photo
  - stainless and custom shared the oval on a door
  - the bench page repeated its hero as its last pick
  - five heroes showed a dearer plaque than the "from" price beneath them
- The garden page reused the tree page's photos.
- The tree page's picks were the wall plaques described above.
- The opening page had a single photo.

## New photos

All new photos come from the designer's built-in realistic preview, as the owner asked in msg 5796:
- `scripts/generate-tree-closeups.mjs`, with a scene brief per photo
- designer stencils made by `output/stencil-app` (no Vite)
- caps and screws repainted in metal by `metal_caps.py` / `metal_screws.py` in the work folder
- one version of each, a second only where needed

**Heroes** (4K). Each shows the plaque its "from" price is for:

| Page | Plaque | Setting |
|---|---|---|
| Bench | Brushed stainless 150×50, George Holland | Teak bench on a hilltop |
| Garden | A5 brushed stainless with a scalloped border, Susan Marsh | White cottage wall above hydrangeas |
| Stainless | A5 brushed stainless with a single border, Riverside Garden | Pale render behind grasses |
| Opening | A4 brushed stainless with a double border, The Meadows Community Hub | Buff brick by a glass entrance |
| Custom | 250×150 oval brushed stainless, Hawthorn House | Cotswold stone by a sage door |

**Heroes reused from earlier photos:**
- Brass: Fred & Elsie Bond, A5 brushed brass on red brick
- Tree: Jim Partridge, A5 brushed brass on an oak board and stake

**Tiles and catalogue redraws** (2K):
- the garden "On a fence" tile: orbital brass 200×150, Biscuit the cat. A polished-steel version looked like glass and was rejected.
- the 7 catalogue redraws listed above

**Cost:** about $1.97 on the Gemini key in total.

**Publishing:**
- `scripts/publish-category-page-images.py` writes the files.
- Sources are in `output/instaplaque-pages-standard-20261024/publish-sources.json`.
- Every file is tagged IPTC trainedAlgorithmicMedia (metadata only).

## The pages

- **Components:** `components/CategoryLanding.tsx` has the sections and the generic `CategoryLandingPage`. Each page's content is in `components/CategoryPages.tsx`. `ShopProduct` hands any page with a config to `CategoryLandingPage`.
- **Order:**
  1. hero (in-place photo, price, both buttons)
  2. optional photo routes:
     - garden: stone, fence, tree, bench
     - brass: the four finishes
     - stainless: brushed, polished, light oak, dark wood
     - custom: oval, circle, large, portrait
  3. tree in-place row
  4. picks
  5. sizes drawn to scale (ovals and circles drawn round), with every catalogue size of the category folded beneath (brass, stainless, bench)
  6. how it works
  7. portraits (tree)
  8. quality, sample proof, wording ideas
  9. questions with the buying guide folded in, plus related-page links
  10. closing buttons
- **Picks** (`productPicks` in Shopfront.tsx) mix metals, finishes, borders, shapes and oak or dark wood, with nothing shown twice on a page. Phones show the first four, so those are the most varied.
- **Designer opens on the plaque the price is for.** Changed presets:
  - brass: A5 brushed brass without wood (was dark wood, £165)
  - custom: 250×150 brushed stainless oval, £109 (was 400×300 on light oak)
  - A4, used by the opening page: no wood, £145 (was dark wood, £230)
  - Bench, stainless and memorial (used by garden and tree) were already right.
- **Prices shown:**
  - Custom shows "from £109" with ovals £109 and circles £113, computed from the catalogue.
  - Tree's caption names the board price (£165) and asks for the stake.
- **Portrait page:**
  - "from £95.50" and what it includes on the first screen
  - the four Portraits in Metal tree plaques in place
  - the compact quality block
- **Unchanged:** URLs, titles, descriptions, canonicals, H1s and FAQ lists (so the FAQPage schema is unchanged).

## Checks

- **Static render** (`output/ssr-check/category-entry.tsx`): every page renders and all images exist. Memorial is identical to its pre-refactor render.
- **Vercel build:** every postbuild check passed. Staged as instaplaque-56thjmipk (commit c3acf04).
- `check-product-policies` accepts `?v=N` photos.
- **Real built app, on phone and desktop:** via a local proxy of the protected candidate, all 9 pages loaded with no page or console errors and no failed requests. "Design online" opened at the right price on every page:

  | Page | Opens at |
  |---|---|
  | Bench | £58.50 |
  | Garden | £95.50 |
  | Brass | £105.50 |
  | Stainless | £95.50 |
  | Tree | £95.50 |
  | Opening | £145 |
  | Custom | £109 |
  | Memorial | £95.50 |

- **Yardstick** (phones):

  | Page | Height (px) |
  |---|---|
  | Bench | 6,991 |
  | Garden | 7,667 |
  | Brass | 7,361 |
  | Stainless | 7,474 |
  | Tree | 8,076 |
  | Opening | 7,010 |
  | Custom | 7,298 |
  | Portrait | 7,542 |
  | Memorial | 8,253 |

  - Every category page shows the in-place photo, price, both buttons, free proof and UK delivery on the first screen.
  - Priced product photos start at 1,040–1,810 px.
  - Heroes are 48–108 KB on phones.

## Release and undo

**LIVE at 16:09 UTC on 24 Oct** as **dpl_5SYpYyW9MfuuobLTRQCpXmkh7kTC** (candidate instaplaque-56thjmipk, commit c3acf04, bundle `index-FsPr5YSQ.js`).
- The owner asked for the live pages to be brought up to standard (msg 5927).
- Before promoting, production was confirmed to be dpl_W46YXp76C9Trjbq2o6rBNbVf8oAF.

**Live checks:**
- `verify_pages_live.py` passed for all 9 pages:
  - H1, canonical, FAQPage schema, no Product schema
  - the bundle, hero and sections
  - 134 linked assets served, with the 49 new or redrawn files byte-identical to the repo
  - the redrawn product pages linking their photos
- The overnight `verify_live.py` passed: 175 product pages, 1,052 linked assets identical to the repo, feed 175 items (174 with a catalogue photo, now including the A5 stainless plaque), sitemaps, redirects.

**Rollback:** `vercel promote dpl_W46YXp76C9Trjbq2o6rBNbVf8oAF --yes --scope dullaghan31-3959s-projects`.
