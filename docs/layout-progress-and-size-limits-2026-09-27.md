# Layout progress and lettering limits — 27 September 2026

Owner requested clearer feedback for slow generation, then explicitly requested removal of restrictive text-size rules after an A4 memorial was rejected. Builds on the verified length-gate removal release e73db85/e810355, not an experiment branch.

## Changes

- Floating, mobile-visible progress card with elapsed seconds and typical10–30second guidance. After30seconds it says work is continuing; no percentage or invented completion estimate. Real model requests, retries, validation and local fallback produce stage callbacks. Timer resets per operation and unmounts on completion/error. Reduced-motion setting respected. Instruction-based edits share this status; failed edits preserve the previous proof.
- Removed the authored5-unit font minimum and >180-character8–10-unit prose floor. Positive finite font size, exact wording, SVG restrictions, overlap and containment checks remain. Prompt prefers good readability but expressly permits smaller lettering to fit all wording.
- Removed orphan-line aesthetic rejections; wrapping advice remains in the prompt. Other font/export and tracking rules remain.
- Removed5.2-unit post-fit clamps from both deterministic renderers. These clamps could enlarge previously fitted text back into overlaps. Manual starter and per-line size controls no longer enforce4 units;0.01 remains two-decimal serialization precision, not a readability threshold.
- Existing MEDIUM/16k,30s function timeout, retry counts, pricing, checkout rules and approval are unchanged. This does not establish faster model inference. Fewer arbitrary validation failures may avoid repairs, but no latency improvement is claimed.

## Verification

Typography tests include accepted2-unit text,3-unit dense prose, orphan endings, and rejection of zero/negative sizes, altered wording, overlaps, overflow and unsafe SVG. Manual-layout tests cover small-text fit with canvas measurements. Typecheck/build/runtime checks passed.

Mocked390/1440 browser tests: status visible within viewport,31-second message and elapsed counter, actual validation retry, no time-triggered duplicate request, reduced motion, success cleanup, edit reset and error cleanup/preserved previous proof. All API traffic intercepted, no model calls for progress tests.

Two owner-authorised real MEDIUM calls via the existing production API using the new local prompt/validator:501-character A4 memorial and277-character dense portrait history both first-pass AI successes, no repairs/fallbacks. Both visually inspected; face bounds and mobile horizontal overflow checks passed. Memorial body6.5–7.2units; portrait body5.8units, previously rejected by dense floor. Portrait remains spacious; this is not an aesthetic-quality breakthrough or manufacturing certification. User-derived wording and screenshots remain private in ignored output/fixtures and output/long-inscription-live, not Git.

Application source c4e88cdfcc7e8dcf241f2303bb8da8a44d94f4c1 deployed as dpl_3RyiPdtffNRKuy7vZT9p8WbCDapr; canonical/www independently READY. Hosted390/1440 progress/retry/edit-failure suite passed. Both saved real model responses replayed through the hosted generator: first-pass acceptance below the old dense-text floor, mobile no-overflow and status cleanup passed, without further model calls. Progress test script can run against APP_URL=https://instaplaque.co.uk without paid generation or customer writes. Local real-generation replay can use scripts/check-layout-quality.cjs with REPLAY_QA and original private records; actual calls require explicit task authorization.

No orders, payments, emails, database changes or customer proof saves. Compatible rollback: dpl_MKer6sXvFh1U6HBNLKCAZgZdDAn7; restoring it also restores restrictive lettering validation.
