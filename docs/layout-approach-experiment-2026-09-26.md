# Initial layout approach comparison

Owner requested testing different initial-layout approaches against live. Tested through the existing production AI endpoint, using the matching local renderer and synthetic intercepted proof-session reads. No deployment, order, payment, email or database write. Live deployment independently inspected: dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW, application7af33c1. Experiment branch codex/layout-approach-experiment; no application files changed.

## Controlled inputs

Four identical standard etched rectangles for each variant:100×25 short memorial,200×50 long-name bench dedication,148×210 portrait award,297×210 dense historical text. Existing fixings/material/wording and API/model settings retained. Fresh baseline rather than cherry-picking old results. Existing validation and maximum one automatic repair retained. Same renderer and public endpoint; only prompt addition changed.

A current prompt; B readability-first body sizing and compact grouping; C soft block-width/height targets, increasing text before inter-group gaps. Exact experimental additions are in scripts/fixtures/layout-approaches.cjs and are never loaded by the application. Harness requires explicit LIVE_LAYOUT_QA=true.

| Approach | Valid AI layouts | Local fallback | No valid proof | Model calls |
| --- | --- | --- | --- | --- |
| Current baseline | 4/4 | 0 | 0 | 6 |
| Readability-first | 3/4 | 0 successful | 1 | 7 |
| Proportion targets | 3/4 | 1 | 0 | 7 |

20 actual model calls total across12 cases. Every desktop result visually inspected. Successful cases have no measured cut-line escape or mobile horizontal overflow. Failed readability/history screenshot is the placeholder, NOT a generated proof. Fallback flag does not imply success; check generated separately.

## Visual conclusion

- Current baseline small memorial has a clean three-line hierarchy.
- Readability-first looks similar rather than consistently better. Dense history failed horizontal-containment validation twice; local fallback also failed. Award remains sparse.
- Proportion targets needed a local fallback for tiny memorial after overlap validation, combining name and dates on one line with weaker hierarchy. Bench layout good but not demonstrably better than baseline. Award still sparse, name slightly smaller; history loses some emphasis on the restoration line.
- Award block height / available height: current0.65, readability0.64, proportion0.61. These include inter-line space, so filling more height alone is not a readability measure.

Do not promote either experimental prompt. Small single-run sample does not establish statistically reliable success rates. It does show no compelling improvement and specific regressions worth rejecting. Next worthwhile experiment would measure rendered glyph sizes and gaps and apply bounded typography corrections; not implemented or claimed tested here. AI already receives the hardware-safe text box, contrary to the earlier suggestion that this information needed adding.

## Reproduction

Start matching Vite frontend on127.0.0.1:4201. Run with owner-authorised real model use:

```sh
LIVE_LAYOUT_QA=true QA_CASE_FILE=scripts/fixtures/regular-etched-layouts.json CASE_IDS=21-small-name,23-bench-poem,26-a5-award,27-a4-history QA_APPROACH=readable QA_OUT=output/approaches/readable node scripts/check-layout-quality.cjs
```

Repeat baseline/proportioned variants and distinct outputfolders. `node scripts/summarize-layout-approaches.cjs` summarises status; `node scripts/render-layout-approach-comparison.cjs` builds ignored screenshot sheet. Do not run as automatic CI. Screenshots/responses are ignored synthetic artifacts in output/approaches.
