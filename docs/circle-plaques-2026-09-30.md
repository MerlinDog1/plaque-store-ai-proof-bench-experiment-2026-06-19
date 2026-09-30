# Circular plaque correction — 30 September 2026

Branch: `codex/circle-plaque-fixes`.
Application commit: `6cbac3678afeda7d2fd465ba8fc57237c5a77784`.
Based on the released memorial page and its release handover at `98a1789`.
Status: implemented and verified locally; not yet deployed. The memorial page is already live separately.

## Changes

- Circle and oval screw fixings are restricted to two horizontal side positions. Four-hole options remain available on rectangular plaques. Restored proofs, checkout-return designs, product presets and shape changes normalise legacy round four-hole selections. SVG proof/export and Three.js now share fixing positions, preventing hardware outside the metal and aligning cap positions between previews.
- The 3D rim uses 128 curve subdivisions rather than the default 12; circular and oval face meshes use matching geometry with explicit texture coordinates. Existing proof textures and outlined fonts are retained.
- Text-only circles use a radial text area rather than the previous narrow square. The generation/edit prompt describes wider middle lines and tapered outer lines. Actual rendered line bounds are fitted inside that area; manual diagonal offsets are constrained so text cannot disappear beyond the curved boundary. Artwork layouts retain their reserved space. Wording, font proportions and order are preserved; regenerate an existing inscription to obtain new line wrapping.
- Temporary local test files are excluded from Vercel uploads. No database, pricing, checkout, PDF template, material asset or model configuration changes.

## Checks

- Full TypeScript and production build passed. Existing bundle-size advisory remains.
- `npm run check:circle-plaques`: 160 round hardware combinations, legacy state correction, rectangular four-hole preservation, heart exclusion, increased usable area, curved line containment and prompt scope passed.
- Existing typography and server checkout checks passed.
- One fresh hosted text-model composition using the revised circle prompt passed exact wording, SVG, bounds and overlap validation. Synthetic text only. An initial programmatic request omitted the required browser-origin header and was rejected; it was not a model success. The corrected request succeeded without a layout retry.
- Local browser: restored four-hole circle displays two fixings and only the two-hole control; rectangular four-hole selection remains available and switching back to a circle resets it to two.
- At desktop and 390px mobile widths, all ten rendered lines stay inside the circle, both fixings are on the plaque and there is no horizontal page overflow.
- 3D face/rim reviewed head-on and tilted; the SVG texture and outlined fonts loaded successfully, with no console errors in the observed review. The local dev server performed a dependency reload on the first 3D load; reopening after that reload passed.
- Generated Google Merchant feed remains byte-identical to the current production feed. Staged whitespace and focused secret scan passed.

No payment, order or email was created. The earlier memorial release's hosted DB/R2 proof verification is recorded separately. This circle pass has not completed a full production browser checkout or a new PDF download; it does not redesign the PDF.

## Release next step

Obtain explicit approval to publish the designer correction, as required by AGENTS.md. Recheck the current live alias and remote branches before deploying. Current live deployment is the memorial release `dpl_2nWrgrqHCDEMkhAe1HRTpVnDRJyg`, source `febbedd49335a5625930099c7c0557e0d95461ec`. Preserve its Supabase/R2 production environment and record hosted verification after promotion. Keep Git auto-deployment disabled.

Search Console separately confirmed the memorial URL's indexing request on 30 September. Do not resubmit it merely for designer fixes.
