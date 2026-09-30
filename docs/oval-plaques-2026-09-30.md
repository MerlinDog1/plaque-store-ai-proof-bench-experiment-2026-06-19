# Oval inscription layout — 30 September 2026

Branch: `codex/oval-plaque-layout`.
Application commit: `7d23d6364b4259237eab2b88cad5be8480516c49` (includes the original oval text change `bc50c16274b2b8cc49a02e44eccc1facb2d68033`).
Based on the published circle fixes and release handover `e6fe2337c2f4744987a751b5ea7eab400033936f`.
Status: implemented and checked locally; not deployed.

## Changes

Text-only ovals now use the per-line ellipse fitting already used by circles. The text area uses the selected physical safe margin instead of the old 16% rectangular-area floor. The existing side hardware clearance and proportional glyph scaling remain active. Manual offsets use the existing elliptical constraint.

Generation and instruction-only editing receive oval-specific wrapping guidance: broader middle lines and shorter outer lines, with separate instructions for landscape and upright proportions. Existing wording is preserved; Regenerate obtains the new line breaks.

The previous circle release already gave ovals two side fixings, legacy four-hole correction, 128 curve subdivisions and a matching textured 3D face. Further hardware checks found that 15mm caps could slightly cross the outline on a 600 × 50mm oval. The fixing inset now accounts for the full cap/screw disc plus 2mm edge clearance on an ellipse. Existing larger insets remain; the shared geometry keeps SVG, 3D and inscription clearance aligned. Artwork allocation, PDF template, materials, prices, backend settings and model configuration are unchanged.

## Verification

- Full TypeScript check and production build passed, including API boot/sanitization checks. Existing bundle-size advisory remains.
- `npm run check:circle-plaques`: 160 existing round hardware cases and 24 added wide/upright oval configurations passed, including offsets, wood backing, side hardware clearance, curved text containment and prompt scope.
- After the hardware correction, all 640 additional oval fixing cases passed: both orientations, 50–600mm dimensions, screws, 10/15mm caps, all borders and wood/no wood. Every sampled point on each fixing plus its 2mm clearance stays inside the metal. The separate 320-case diagnostic previously found nine extreme cap combinations crossing the edge; it now reports no failures. Full typecheck/build passed again.
- Local browser restored a synthetic four-hole 600 × 50mm oval to two caps, visibly inside the metal. Switching to screws showed two holes and no four-hole option. A review screenshot is retained outside Git at `../oval-shallow-fixings-review.png`.
- Existing typography regression checks passed.
- Two fresh real-model compositions, 300 × 200 mm and 200 × 300 mm, passed wording, SVG, bounds and overlap validation without repair or fallback. Synthetic inscription only; fixtures are ignored under `tmp/`.
- Local desktop browser: landscape proof has 10 visible lines, upright has 12; both have two fixings and no horizontal page overflow. Maximum normalised line-corner radii are 0.811 and 0.846 respectively, inside the metal outline.
- At 390px mobile width, the landscape proof has two fixings, no horizontal overflow and maximum line-corner radius 0.811. Mobile screenshot capture failed, so mobile verification is DOM/geometry only; the viewport was reset afterward.
- Landscape 3D proof was reviewed front-on and tilted, with the SVG texture and outlined fonts ready. No console errors observed.
- Review screenshots are outside Git at `../oval-layout-review.png`, `../oval-3d-review.png` and `../oval-upright-review.png`.
- Initial test assertion incorrectly required extra width even where hardware clearance already controlled it. Corrected the test to preserve that clearance and verify the larger vertical area. All final checks passed.

No order, payment, email or saved customer proof was created. This pass does not claim a full checkout or PDF-download rehearsal.

## Release next step

Request explicit publication approval under AGENTS.md after showing the completed oval preview. Before deployment, fetch/reconcile any newer work and independently inspect the live aliases. The last verified production release is the circle deployment `dpl_AJCwLEfhRCrqzeygG5D9Dd5a2ykr`, source `f7edbf8b15cfce428e2ad6f0d995b5505e7d34d8`.

Retain the migrated Supabase/private R2 environment. On release, verify hosted proof save/read and public aliases/assets. Keep Git auto-deployment disabled; a push to this task branch does not publish it.
