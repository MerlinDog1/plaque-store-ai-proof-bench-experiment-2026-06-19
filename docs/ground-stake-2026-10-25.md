# Ground stake option in the designer (25 Oct 2026)

## Why

The owner (msg 6378): "Add a ground stake on the backing section of designer but only show it if they have
already selected a backing board. Make sense? Just show it like in Nicolas order".

The Nicola order (WhatsApp IP-2778619BBA, 21 Oct) was:
- an A5 plate on a 235 × 173 mm oak board, standing on a chunky black powder-coated 30 mm square steel stake;
- priced at £155 (the site's A5 stainless on a board) plus £35 for the stake, so £190.

The owner set those prices: "on a wooden backing board with ground stake- add £35 for that" (msg 5360) and
"NO THE WOOD IS SEPARATE" (msg 5395). Until now the site said "ask us for the stake on WhatsApp".

## What changed

- **Designer, backing step.**
  - Once a wood board is added, a "Ground stake" card appears under the board: "A black steel stake fixed
    to the back of the board, so the plaque stands in a lawn or flower bed, or beside a tree. Adds £35."
  - "Add £35" / "Added £35" toggles it.
  - It is not offered without a board, which already excludes heart and bench plaques.
  - Removing the board removes the stake (`App.tsx` `handleStateChange`).
- **Price.**
  - `services/checkoutPolicy.mjs`, shared by the browser and the server, sets `GROUND_STAKE_PRICE = 35`.
  - `hasGroundStake(state)` is true only with `wood` and `groundStake` and not a heart.
  - The total adds £35. The breakdown gains `stake`, and `base` and `wood` are unchanged by it.
  - `validateCheckoutPlaqueState` accepts a missing `groundStake` (older designs and orders), rejects a
    non-boolean, and drops a stake that has no board rather than charging it.
- **Server checkout.**
  - `productionSpec` gains `groundStake: true` only when chosen, so orders started before the release still
    pass the payment check.
  - The server prices the stake itself: a page showing the price without the stake is refused with
    `checkout_price_changed`.
- **Where it shows.**
  - The designer's review summary has a "Black steel ground stake £35" row.
  - The checkout page lists the stake line.
  - The admin order view has a new "Backing" row, e.g. "Light wood board + ground stake".
  - The owner's new-paid-order and production-pack emails say "Wood: Light wood, Bevel edge, 235 x 173 mm
    board, with black steel ground stake (30 mm square)".
  - The proof PDF's spec row reads "Light wood, bevel edge, black steel ground stake".
- **Preview, drawn like the Nicola order.**
  - In 2D, `GroundStakeFrame` in `components/PlaquePreview.tsx` draws a 30 mm black steel stake centred under
    the board. About 60% of the board's height shows (90–160 mm, from `services/groundStake.ts`), fading
    out where it goes into the ground.
  - The plaque's own `<svg>` (the ref every proof PNG, PDF and production SVG clones) sits inside the frame
    unchanged, so the stake never reaches artwork or production files.
  - Without a stake the markup is exactly as before.
  - The 3D proof adds a black box stake behind the board and frames board and stake together.
- **AI realistic preview.** With a stake, the prompt describes it: one black 30 mm square stake on a bracket
  at the back, standing in the ground. The scene becomes an outdoor close-up with a blurred garden and no
  people, like the Nicola illustration. Without a stake the prompt is unchanged.

## Checks

- `node scripts/check-server-checkout.mjs` has new stake cases, and passes:
  - £35 is added only with a board, and the board and plate prices are unchanged;
  - the stake is stored on the order and in `productionSpec`;
  - a missing stake in the shown price is refused;
  - a stake without a board is dropped;
  - a non-boolean is rejected;
  - an order made before the release (no `groundStake` anywhere) still passes `assertServerCheckoutOrderIsPayable`.
- `check-one-pound-test`, `check-audit-checkout`, `check-admin-order-list` and `check-fail-closed-security`
  pass. `check-long-inscription-checkout` needs a running app server; it fails the same way without this
  change.
- The email text was checked for board with stake, board only, and no board.
- Type check: `tsc` on the app's entry files (`output/tsconfig.stake.json`, ignored) passes in 16 s.
  The bare `tsc --noEmit` times out here because it also scans `output/` and `scripts/`.
- **Browser check on the staged copy** `instaplaque-7520sejk3` (Vercel build and postbuild checks passed).
  The script is `workspace/output/instaplaque-ground-stake-20261025/run_check.sh /design` with
  `check_stake.cjs`; the real built app runs from local files, with /api and analytics blocked.
  - **Desktop:**
    - no stake option or drawing before a board;
    - adding the light board (£59.50) shows the option and moves the price from £95.50 to £155;
    - "Add £35" gives £190, the same as the Nicola order, and reads "Added £35";
    - the stake is drawn 30 mm wide, centred, from the board's bottom edge;
    - the plaque's own SVG stays `0 0 235 173` with the board and no stake;
    - the review summary lists "Black steel ground stake £35" with a total of £190;
    - removing the board removes the option, the drawing and the £35;
    - adding the board again leaves the stake off;
    - no page errors.
  - **iPhone 13:** the same option and drawing, with no page errors.
  - **Not clicked through:** the 3D view (WebGL is too heavy beside a 2 GB gateway here) and the AI
    preview (a paid Gemini call). Both changes are small and were reviewed by hand.

## Tree page points to the designer (owner msg 6394, "Make that change then put it live")

- The tree page no longer says "ask us for the stake on WhatsApp":
  - **Top photo caption:** "… on an oak board, £X, plus £35 for the ground stake."
  - **Price note:** "the oak board and the £35 ground stake are extra".
  - **"Beside the tree" intro:** "Add both in the designer’s Backing step; the stake is £35. Design one on a board
    and stake."
  - **Sizes note:** "… and the ground stake adds £35: design one on a board and stake."
  - **"Fix it beside the tree" section:** "In the designer, add the oak board and then the stake (£35) at the
    Backing step."
  - **FAQ "Can I fix a plaque to a tree?":** "(add both in the designer’s Backing step; the stake is £35)", the same
    in its FAQ schema.
  - The £35 comes from `GROUND_STAKE_PRICE`, so the copy follows the price.
- **"Design one on a board and stake"** links to `/design?backing=stake` (`DESIGN_WITH_STAKE_HREF` in
  `services/groundStake.ts`).
  - On arrival, `App.tsx` opens the designer the way the page's "Design online" does: the memorial preset, which
    is A5 brushed stainless with caps and a double border, on the wording step.
  - That preset is shown on the light oak board (bevel edge) with the stake, at £190, the Nicola order's price.
  - The parameter is then dropped from the address, so a reload or a later edit keeps the customer's own choices.
  - Proof (`?proof=`) and checkout (`?order=`) links take precedence.
  - The /design page's canonical stays `/design`.
- The tree page's own "Design online" still opens on the plain A5 plate its from-price is for (owner msg 5906).

## Release

- Branch `codex/instaplaque-ground-stake-20261025`: `e2f2fc7` (stake), `2b350f3` (tree page), docs.
  It is based on the live QR release `b381cdf`.
- **Candidate:** `instaplaque-2si40x3v9` (dpl_2xRXbiQMMK3ZNt3GeJYLGcaNjW2p). The Vercel build and postbuild checks
  passed.
- **Browser checks on the candidate,** all passing (`run_check.sh "/design /tree-memorial-plaques" tree treephone
  desktop three`):
  - **Tree page, computer and iPhone:**
    - none of the old wording is on the page or in its schema;
    - all six new texts are there, with two links;
    - the link opens /design and drops the parameter;
    - the designer shows the board with the stake drawn, £190, on the wording step, with the Backing step showing
      "Added £35";
    - no page errors.
  - **Designer, computer:** the full stake run above passes again.
  - **3D proof:** with SwiftShader WebGL, it renders the board on one square black stake behind and below it
    (`BoxGeometry` 30 × 30 mm, group centred), with no page errors. Screenshot inspected.
- **Live** at 18:57:13 UTC on 25 Oct: `vercel promote` set `instaplaque.co.uk` to dpl_2xRXbiQMMK3ZNt3GeJYLGcaNjW2p,
  with bundle `index-D5_H_vMM.js` and CSS `index-DoULLCw3.css`. The candidate's tested HTML named the same bundle.
- **Live checks:**
  - `verify_live.py` (`BUNDLE=index-D5_H_vMM.js`) passes: 175 product pages, and all 771 linked assets are identical
    to `public/`.
  - The live browser run (`run_live.sh tree desktop`, with the API, Vercel insights and analytics blocked) passes
    the tree page, the link and the full stake run.
- **IndexNow:** told about `/tree-memorial-plaques` only (HTTP 200). The sitemaps and the feed are unchanged.
- **Rollback:** dpl_JDHcpsNf3gxTY6m5ZuQmBzAwtPrQ, the WhatsApp QR release. With `VERCEL_ORG_ID` and
  `VERCEL_PROJECT_ID` set, run `vercel promote https://instaplaque-d69xdmlx7-dullaghan31-3959s-projects.vercel.app
  --yes`. Orders placed with a stake would still be charged and made correctly after a rollback: the stake stays
  on the stored order. Only the option disappears.

## Not changed

- Plaque prices, board prices, delivery, production times, the Merchant feed and the product pages.
