# Live Gemini versus Sol/Luna layout experiment

Owner requested comparing live plaque layout against Sol or Luna subagents. Tested both, with four identical synthetic rectangular etched cases: 100 × 25 mm memorial, 150 × 50 mm long-name/caps memorial, 148 × 210 mm portrait award, 210 × 297 mm dense history.

## Controls and limits

- Fresh baseline uses the canonical live Gemini LOW/8192 endpoint and existing one-repair/fallback logic. Six API responses across four cases.
- Explicit user-requested gpt-5.6-sol and gpt-5.6-luna native subagents at medium effort. Each independently produced four first-pass designs from exact same prompt strings; equality verified against the fresh live first requests. No alternative prompt guidance, browser inspection, font measurement, external research or prior model outputs supplied to either agent.
- Subagents use file tools to read prompts and save JSON; thus this is NOT an identical stateless API or latency/cost benchmark. Models share a four-task session within each agent rather than four isolated API contexts. A single small sample, not a definitive provider ranking.
- First-pass outputs wrapped as response envelopes and replayed through existing app parsing, validator, renderer and final fitting. No additional model calls during replay. A missing repair response is deliberately blocked with 503; resulting local fallbacks are labelled, never attributed to the subagent's design.
- Validator errors independently checked with the actual exported application validator. Luna receives one separate correction opportunity on its two failed outputs, preserving original files. No screenshot or other model output supplied during repair.
- Four live + eight subagent first-pass displays inspected visually, including failures and labelled fallbacks. Face-bound and mobile overflow measurements recorded. No claim of manufacturing certification.

## Initial results

| Model | Valid first pass | Valid after live repair | Notes |
| --- | ---: | ---: | --- |
| Live Gemini LOW | 2/4 | 3/4 | Tiny memorial repaired; history rejected after repair and fallback failures. |
| Sol medium | 4/4 | Not needed | All passed app checks without changes. |
| Luna medium | 2/4 | Separate repair recorded below | Tiny memorial line overlap; award horizontal overflow. |

Sol's award gives the recipient a stronger two-line focus and fills portrait space more deliberately than the live sample. Both Sol and Luna give the long surname clearer emphasis than this live sample. Sol uses a small-cap-looking serif on the award/history, which makes dense prose feel heavier; Luna's mixed-case history is more comfortable to read in this review. Successful simple memorials remain broadly similar. These are visual judgements, not universal aesthetic scores.

## Artifacts and boundaries

Raw synthetic inputs/agent files: projects/instaplaque-model-comparison/{sol,luna}. Ignored replay outputs and comparison boards: output/sol-luna in projects/instaplaque-thinking-ab. Scripts prepare-subagent-layout-replay.cjs, validate-subagent-layouts.cjs and render-sol-luna-comparison.cjs. Existing check-layout-quality.cjs handles the app flow. No customer proof saves, orders, email, payments, DB writes, application edits, new deployments or promotion. Existing public production unchanged. This experiment branch inherits earlier test-only configuration; do not promote wholesale.

## Repair results and conclusion

Luna's award repair passed and looks broadly like the live award: tidy but still sparse. Its tiny memorial repair failed vertical bounds, leaving the local fallback. Final valid model layouts: live 3/4, Sol 4/4, Luna 3/4. First-pass rates remain live 2/4, Sol 4/4, Luna 2/4. Fourteen displays reviewed including two Luna repair outcomes. Successful model outputs have no face-bound violations or mobile overflow.

The first Luna award snapshot was taken while its initial file completion was still in progress; final file differs only by a trailing whitespace at a tspan break. Both fail the same horizontal-overflow validator. Saved replay snapshots preserve the exact evaluated candidate; no substantive layout difference affects scoring.

Sol is the strongest candidate in this four-case sample, particularly the portrait award's hierarchy/space use. However Luna's mixed-case history is more readable than Sol's small-cap-style prose to this reviewer. No blanket aesthetic winner. To assess using another model in the shop would require a separate supported API integration and latency/cost test; these subscription-backed subagent results do not establish production feasibility or cost. No production setting changed.
