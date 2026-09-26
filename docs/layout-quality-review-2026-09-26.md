# Plaque visual quality review — 26 September 2026

Owner requested a varied batch of real generated plaques, visual inspection and improvements. Task branch `codex/layout-quality-review`, worktree `projects/instaplaque-layout-quality`. Supersedes bench-clearance source; do not deploy the stale picker checkout.

## Findings and fixes

- Deeper 150 × 75 mm plaques did not receive bench-only fixing protection. Visible caps/screws now reserve hardware clearance beyond narrow bench classification. Manual scale/offset cannot push text out of the protected area.
- Heart text could cross the notch and taper. Shape-specific central text space now keeps it inside the face; manual enlargement is bounded for shaped plaques.
- Reverse etching had full-face material textures overpainting the dark face. Those overlays are suppressed in reverse mode; material-text appearance and hardware retained.
- Long-name prompt now prefers balanced line breaks when needed rather than reducing the whole block. Fresh Christopher Andrew Harrison example wrapped into two lines clear of caps.
- Dense heritage text exhausted structured output allowance through reasoning. Server-owned Gemini 3.8 Flash LOW thinking leaves room for the validated layout JSON, retaining the existing 8192 output limit and caller allowlist. Official parameter reference: https://ai.google.dev/gemini-api/docs/generate-content/thinking
- Generation failure remains visible beside the wording with useful fitting guidance; impossible text is not presented as a completed proof.

## Real AI batch and visual inspection

| Case | Size / form | Baseline | After |
| --- | --- | --- | --- |
| Peter John Wilson | 150 × 50, caps | Usable | Fresh pass |
| Elizabeth Alexandra Montgomery | 150 × 50, screws | Usable | Fresh pass |
| Donation inscription | 200 × 25, screws | Usable | Replay pass |
| Deliberately overloaded memorial | 100 × 25, large caps | No valid proof: timeout/validation failures | Persistent fitting error tested; not called a successful layout |
| Christopher Andrew Harrison | 150 × 75, large caps | Caps overlapped name | Fresh two-line name, clear caps |
| Long sentence | 225 × 75, four screws | Usable | Replay pass |
| Élodie O’Neill memorial | A5, brass, caps, border | Usable | Fresh pass |
| Community centre opening | A4 landscape | Usable | Fresh pass |
| Dense heritage prose | A4 portrait, aged brass | Truncated model JSON, fallback rejected | Fresh first-attempt complete layout |
| Business sign | 200 × 150 | Usable | Replay pass |
| Rose garden memorial | Oval, caps | Usable | Fresh pass |
| Pet memorial | Circle, screws | Usable | Replay pass |
| Amelia Rose memorial | Heart | Text crossed cut line/notch | Fresh contained layout |
| Close the gate sign | Reverse-etched steel | Metal face overpainted dark fill | Fresh dark face, visible metal text |
| David Turner with tree | A5, side artwork | Usable | Fresh pass |
| Old Rectory address | A5, screws | Usable | Replay pass |

16 baseline cases: 14 usable generated layouts, two rejected. All 14 usable layouts replayed after fixes; zero measured cut-line escapes or browser errors. Ten fresh real-AI cases through the staged production backend all produced usable layouts (one needed a repair request); zero cut-line escapes or browser errors. Screenshots were visually inspected, not merely measured. Before/after comparison and raw synthetic results are ignored local artifacts under `output/layout-quality`, not tracked customer data.

## Checks

- TypeScript and local/remote production builds passed (existing bundle-size warning).
- 400 bench geometry cases passed.
- Typography and public-input-security checks passed; server-owned thinking level asserted.
- 20 deterministic mobile/desktop visual cases passed: deeper caps, manual extremes, heart, and six reverse-etch materials. Checks include shape containment, approximately 3 mm hardware gap, dark reverse face without full-face texture overlays, and no horizontal overflow.
- Mobile heart and reverse-etch 3D views visually inspected with font outlining confirmed.
- Impossible small-plaque generation error tested with mocked unavailable API: wording retained, persistent message, no false generated proof. Initial test navigation ordering corrected; rerun passed.
- Real model tests used synthetic text and existing authenticated API only. No orders, payments, customer emails, database migrations or writes.

## Limits

This is a representative sample, not a guarantee every inscription fits. Dense text on tiny plates remains rejected. Dark text on heavily aged brass remains a low-contrast material/ink choice; existing guidance recommends a light fill. The review does not silently change the customer's chosen finish. Artwork test uses a simple local tree fixture, not fresh image generation. No new physical manufacture/engraving trial.

## Release

Application source `7af33c155dd4d969e91be2ff08f59bd4a1e91161` built as `dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW`, initially unpromoted with production environment. After fresh tests, promoted using the same tested deployment. Test harness/documentation commits after this source do not change deployed application code. Compatible previous deployment: `dpl_2w9RiMretPaTdbxjCqGHFyTeBaCe`. Canonical/www and hosted regression verification recorded in handover.
