# Wider Sol plaque composition review — 27 September 2026

## Method and boundaries

Owner requested more Sol testing after the four-case comparison. Sixteen synthetic rectangular normal-etched cases across thirteen sizes, identical to the saved MEDIUM coverage batch, including one deliberately overloaded tiny plaque.

Fresh native `gpt-5.6-sol` subagent at medium effort receives only the original first-request prompt files. No renderer, measuring tools, previous outputs or comparative feedback. One session holds all sixteen cases, so this is not an isolated stateless API benchmark. Parent independently validates using the actual application validator and replays response envelopes through the unchanged renderer and safety/fallback flow. Any repair opportunity is recorded separately; first attempts are preserved.

Comparison uses earlier saved real Gemini MEDIUM results, not a contemporaneous new live batch. MEDIUM is not the public shop setting. The previous four-case fresh live LOW comparison remains separate. Prompt strings are checked byte-for-byte against the original recorded first requests. Validator and preview source match application revision 7af33c1. This measures composition and compliance, not production API availability, speed or cost.

No application edits, model API calls to the live shop, public deployment, customer proof saves, database writes, orders, payments or emails. The experiment branch inherits test-only timeout settings and must not be promoted wholesale.

## Artifacts and reproduction

- Task worktree: projects/instaplaque-sol-wide; branch codex/sol-wide-review.
- Raw isolated generation inputs/outputs: sibling projects/instaplaque-model-comparison/sol-wide.
- Fixture: scripts/fixtures/medium-size-text-review.json.
- Local preview: 127.0.0.1:4203, no public exposure.
- `node scripts/review-sol-wide.cjs validate` checks exact prompts and application validator, then writes synthetic response envelopes.
- `scripts/check-layout-quality.cjs` replays these envelopes using QA_REPLAY_RESPONSES and records app outcomes, screenshots, face bounds and mobile overflow. LIVE_LAYOUT_QA=true enables the generation UI path but every response is intercepted from disk; no model calls are made.
- `node scripts/review-sol-wide.cjs sheets` assembles before/after contact sheets from actual captures.
- Ignored output/sol-wide holds raw test artifacts.

## Results

| Measure | Sol fresh batch | Earlier Gemini MEDIUM batch |
|---|---:|---:|
| First-pass valid model layouts, all 16 | 11/16 | 15/16 |
| First-pass ordinary cases (excluding deliberate overload) | 11/15 | 15/15 |
| Valid model layouts after at most one repair | 14/16 | 15/16 |
| Final local fallback shown | 1 | 0 |
| Final no-valid-proof rejection | 1 | 1 |

Sol first failures: double memorial, award, overloaded tiny plaque and visitor instructions had estimated horizontal overflow; portrait history had an avoidable orphaned final word. One repair corrected the award, portrait history and instructions. Double memorial then failed the orphan check and displayed the local fallback, NOT a successful Sol composition. Tiny stress then failed vertical containment and was rejected, NOT a usable proof.

The original Sol child was unavailable for continuation, so a fresh native Sol/medium repair child read only each failed original prompt/output and exact validator error. No rendering/measurement tools or other model outputs were provided. This differs from a persistent conversational repair context; conclusions remain limited to this experiment.

First-attempt screenshots deliberately exhaust the recorded responses after one attempt; the app's fallback/no-proof states are labelled, never counted as Sol designs. Repair replay supplies the original plus one corrected response. All generated displays stayed within the plaque face, mobile page overflow was false and no page JavaScript errors were recorded. Visual review found no obvious clipping or fixing overlaps. No claim of calibrated physical letter-height validation.

## Visual assessment (subjective, not a blinded score)

All sixteen first-attempt displays and the five repaired-case displays were visually inspected, alongside the saved sixteen MEDIUM examples.

| Case | Assessment |
|---|---|
| Small memorial | Very similar to MEDIUM; clear three-line hierarchy. |
| Narrow donation | Sol uses small-cap-style first line; preference rather than clear improvement. |
| Bench poem | Sol supporting copy is visibly larger and easier to read. |
| Double memorial | Failed both attempts; shown fallback is weaker than MEDIUM and not credited to Sol. |
| Office | Near equivalent; clean sans-serif hierarchy. |
| Portrait award | After repair, Sol's two-line recipient and larger supporting copy use height better. Remaining group gaps and fragmented supporting breaks are not perfect. |
| Railway history | Sol body text is larger; more readable and better use of available space. |
| Large dedication | Sol enlarges supporting text and reduces excessive group separation. |
| Tiny label | Near equivalent, single clear heading. |
| Long surname | Near equivalent sensible two-line name, clear of caps. |
| Tiny dense stress | Both ultimately reject; placeholder screenshots are not generated proofs. |
| Narrow poetry | Sol larger while keeping the original two-line structure. |
| Accented memorial | Sol wraps the names over two lines; much larger readable lettering, at the cost of a taller block. |
| Short business | Similar minimalist arrangement; Sol subtitle slightly larger. |
| Portrait history | Repair is valid and larger, but narrower wrapping and tight leading make the body more cramped. Not an unqualified visual win. |
| Visitor instructions | Repair is larger and readable, but wraps extra lines; preference depends on desired compactness. |

**Verdict:** the original four-case Sol win did not generalise to first-pass reliability. MEDIUM remains the stronger consistency candidate on this exact wider set. Sol provides useful aesthetic examples—especially supporting-letter size, award hierarchy and use of space—but is not established as the better drop-in production model. Neither larger lettering nor model choice alone solves typography. No API latency/cost conclusions; no live change recommended solely on this sample.

## Verification and handover

- `node --check scripts/review-sol-wide.cjs` passed.
- Exact original prompt checks: 16/16 byte-identical.
- Actual application validation: 11 first-pass, 14 after permitted repairs.
- Offline application replay: all 16 first attempts plus all 5 repair cases completed; no unresolved runner errors. Initial preview-process exit interrupted one pass; the complete first pass was rerun from saved responses without additional generation.
- All generated outputs passed recorded face-bound checks; all final pages passed mobile overflow and page-error checks.
- Application validator and preview files have no diff from 7af33c1. Only QA script and this report added; no application code or dependencies changed.
- Git deployment guard remains false, sole workflow targets main/PR; safe codex task branch only. No deployment command issued.
- Local preview shut down after tests. Raw outputs/screenshots remain ignored on VPS; comparison sheets distinguish model layouts, local fallbacks and no-proof placeholders.
- Next step: choose whether to test measured typography improvements; do not promote inherited experimental timeout settings wholesale.

