# The ground stake as it really is (26 Oct 2026)

## Why

Right after the tree page went live with every price on the oak board and stake, the owner wrote (msg 6523):
"like its just a 2mm thick kind of L shape bend thing - not these big chunky thing. its also 23.5" long but just put
that in the description we maybe dont need to show at that size".

The stake had been described and modelled from the Nicola order's illustration as "a chunky black powder-coated 30 mm
square steel stake on a bracket". The real stake is 2 mm black steel with an L-shaped bend, 23.5 in long.

When I said I would redo the photos' stakes (msg 6529), the owner replied (msg 6532): "you had the width ok so i dont
think you will need to change the face on pic". So the 30 mm face seen from the front, every photo and the 2D drawings
stay as they were.

## What changed

- **Sizes in one place** (`services/checkoutPolicy.mjs`, shared with the server, re-exported by `services/pricing.ts`):
  - `GROUND_STAKE_WIDTH_MM = 30` is unchanged.
  - New `GROUND_STAKE_THICKNESS_MM = 2`.
  - New `GROUND_STAKE_LENGTH = "600 mm (23.5 in)"`. 23.5 in is 597 mm.
- **Wording:**
  - The designer's Backing step, stake option: "A black steel stake, 600 mm (23.5 in) long, fixed to the back of the
    board, so the plaque stands in a lawn or flower bed, or beside a tree. Adds £35."
  - The tree page's "Fix it beside the tree, not to it": "we fix the plate to a solid oak board on a black steel ground
    stake, 600 mm (23.5 in) long, that pushes straight into the soil at the foot of the tree, as in the photos below."
    The word "chunky" is gone. It is nowhere else on the site.
- **3D proof** (`components/ThreePlaquePreview.tsx`):
  - The stake was a solid 30 × 30 mm box. It is now 2 mm sheet bent into an L:
    - a 30 mm face flat against the back of the board;
    - a 2 mm side pointing straight back from its left edge.
  - It runs the same length as before, up behind the lower half of the board and down below it.
  - Straight on, it looks as before. Tilted ("drag to tilt"), it is thin sheet, not a post.
  - The stake's materials use a polygon offset. Without it, the inside of the L, which is edge-on in the straight-on
    view, showed through the board as a hairline on the plate (seen in SwiftShader on the first test copy).
- **The owner's order emails** (new paid order, production pack): "with black steel ground stake (2 mm L-shaped,
  30 mm wide, 23.5 in long)" instead of "(30 mm square)".

## Not changed

- The 2D designer drawing and the tree page's size-table drawings (still 30 mm wide).
- Every photo, including the 5 tree photos and the 2 memorial portraits on stakes (owner msg 6532).
- The AI realistic preview's prompt (`services/geminiService.ts`) still describes a "chunky ... 30mm square" stake.
  It draws the same front view the owner has accepted in the photos, and it was not tested with a changed prompt.
  Change it only with a test generation.
- Prices, checkout, orders and the proof PDF.

## Checks

- `tsc -p output/tsconfig.stake.json` passes. `scripts/check-server-checkout.mjs` passes.
- `workspace/output/instaplaque-stake-length-20261026/check_email.mjs` passes:
  - both owner emails give the new stake line;
  - "Wood:" lines are unchanged for a board without a stake, and for no board;
  - "30 mm square" appears nowhere.
- **Test copies.**
  - `instaplaque-bzgx8am2o`: build and postbuild checks passed, but its 3D view had the hairline.
  - `instaplaque-9uru8t8h6` (dpl_Bcm4CG9NfcFS1PLsnkUr9WmTDjLL, `index-BKV4C7q8.js`) has the fix. Build and
    postbuild checks pass.
- **`check_static.mjs`** on the prerendered HTML of 9 pages passes:
  - every table and price is as before;
  - the tree page has the new "Fix it beside the tree" sentence;
  - "chunky" is not on the page or in its schema.
- **`run_check.sh` → `check_slim.cjs`** (the real built app in headless Chrome) passes:
  - **designer:**
    - `/design?backing=stake` opens the A5 on the board and stake at £190, with the address cleaned;
    - the 2D stake is still 30 mm wide, centred under the 235 × 173 board;
    - the stake option has the new wording and reads "Added £35";
    - no page errors.
  - **three** (SwiftShader WebGL):
    - the stake is the two named pieces, 30 × 2 mm and 2 × 28 mm, the same length, behind the board;
    - the old box is gone;
    - board and stake are framed together;
    - no page errors.
  - Screenshots straight on and tilted both ways are in `shots/`.
- **Hairline:** `diag_three.cjs` found it came from the side of the L only. Setting the polygon offset on the first test
  copy removed it, and the second test copy's straight-on 3D view has no hairline.

## Release

The owner asked for it to go live (msgs 6519, 6523). `vercel promote` set `instaplaque.co.uk` to
dpl_Bcm4CG9NfcFS1PLsnkUr9WmTDjLL (instaplaque-9uru8t8h6) at 09:48 UTC on 26 Oct. Production was still the tree
board-and-stake release (dpl_8cNFnsp71iWeN1vUAWXiqq55y6pD), so nothing newer was overwritten.

- **Live checks, all passing:**
  - All 9 live pages serve `index-BKV4C7q8.js`.
  - All 11 files the browser check loaded are byte-identical live, including `ThreePlaquePreview-BifjqpPw.js` with the
    L-shaped stake, so that check stands for the live site.
  - `check_static.mjs` with `CACHE=live-cache` (the live HTML fetched with curl) passes on the 9 pages.
  - `verify_live.py` (`BUNDLE=index-BKV4C7q8.js`): 175 product pages and 771 linked assets identical to `public/`;
    sitemaps, feed, redirects and the IndexNow key are fine.
- **IndexNow:** told about the tree page (HTTP 200).

Rollback: with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, run
`vercel promote https://instaplaque-5rlsj2we1-dullaghan31-3959s-projects.vercel.app --yes`. No ad depends on this change.

## Follow-up: the 3D stake fades out, and its head leans back (owner msg 6541)

### Why

After the release above the owner wrote (msg 6541): "great job - can we kind of fade it out in 3d so doesnt look like
its short? also the stake head is like angled back a touch not totally straight so as to present the plaque better".

In the 3D proof the stake stopped dead a little below the board, so it looked short. It also leaned back with the
plaque, because the whole plaque leans back about 10° in the 3D view (`group.rotation.x` eases to -0.18). The real
stake goes straight down into the ground, and its head is bent back so the plaque leans back.

### What changed (`components/ThreePlaquePreview.tsx` only)

- **Head and shaft.** The stake is now two L-shaped parts of 2 mm sheet with a 30 mm face, hinged on a bend along the
  bottom edge of the back of the board.
  - The head runs up behind the lower 45% of the board and leans back with it, by the view's lean of 10.3°, "a touch".
  - The shaft hangs from the bend. `animate()` sets its `rotation.x` to the opposite of the plaque's lean every frame,
    so it stands upright, also while the plaque eases into its lean.
- **Fade.**
  - The shaft shows 1.25 times the 2D proof's visible stake (`GROUND_STAKE_SHAFT_SHOWN`).
  - Its sides use an alpha map (`makeGroundStakeFade`): solid for the first 35% below the board
    (`GROUND_STAKE_SHAFT_SOLID`), then easing out (smoothstep) to nothing at its foot, like the 2D proof's stake going
    into the ground.
  - Its top face is solid and hidden in the bend. Its foot is not drawn.
- **Unchanged:**
  - the polygon offset against the hairline;
  - the view's lean and turn, now named `VIEW_LEAN_X` and `VIEW_ROLL_Z`, at the same values;
  - plaques without a stake.
- `disposeMaterial` now disposes alpha maps as well as maps.
- 2D drawings, photos, wording, prices and emails are unchanged.

### Checks

- `tsc -p output/tsconfig.stake.json` passes.
- **Test copy** `instaplaque-hdusrgc6v` (dpl_9JbKwkHiX4takXcyKpfxJAdfDvyp, `index-DgR9BCsh.js`,
  `ThreePlaquePreview-DYrWQFQw.js`): build and postbuild checks pass.
  - `check_static.mjs` passes on 9 pages.
  - `workspace/output/instaplaque-stake-3d-20261026/run_check.sh` with `check_fade.cjs` passes, in headless Chrome with
    SwiftShader WebGL, once the plaque has settled into its lean:
    - **designer:** as before: £190 on the board and stake, the 2D stake 30 mm wide, and the stake wording.
    - **three:**
      - the head leans back 10.25° with the plaque;
      - the shaft is 0.84° from upright, which is the view's slight turn, and 0.00° back;
      - both parts are 30 × 2 mm and 2 × 28 mm sheet;
      - the head is solid;
      - the shaft's sides fade, its top is solid and its foot is not drawn.
    - **Opacity on the rendered canvas**, down the middle of the shaft (0 = the bend, 1 = the foot):
      - 255 to 30%, then 249 at 40%, 168 at 60%, 113 at 70%, 17 at 90%, 3 at 97%, and 0 beyond;
      - the largest step between samples is 13 of 255, so there is no hard edge.
    - **plain:** a plaque without a board has no stake in 2D or 3D and keeps its usual lean.
    - No page errors in any stage.
  - Screenshots from the front, both sides and above (`shots/fade-3d-*.png`) show the bend, the fade and no hairline.

### Release

`vercel promote` set `instaplaque.co.uk` to dpl_9JbKwkHiX4takXcyKpfxJAdfDvyp (instaplaque-hdusrgc6v) at 10:08 UTC.
Production was still dpl_Bcm4CG9NfcFS1PLsnkUr9WmTDjLL, so nothing newer was overwritten.

- All 9 live pages serve `index-DgR9BCsh.js`. All 11 files the browser check loaded are byte-identical live,
  including `ThreePlaquePreview-DYrWQFQw.js`, so that check stands for the live site.
- `check_static.mjs` with `CACHE=live-cache` passes.
- `verify_live.py` (`BUNDLE=index-DgR9BCsh.js`) passes: 175 product pages and 771 linked assets identical to
  `public/`; sitemaps, feed, redirects and the IndexNow key are fine.
- No page text changed, so IndexNow was not pinged.

Rollback: with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, run
`vercel promote https://instaplaque-9uru8t8h6-dullaghan31-3959s-projects.vercel.app --yes` (dpl_Bcm4CG9N).
