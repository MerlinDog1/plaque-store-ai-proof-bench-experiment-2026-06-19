# MEDIUM size and text review — 27 September 2026

Owner-requested wider test of MEDIUM thinking, 16,384 output tokens, unchanged prompt and 30-second server timeout. No application changes or public deployment.

## Method

16 synthetic rectangular, normal-etched examples across 13 distinct sizes, 100 × 25 mm to 400 × 300 mm. Includes screw/cap/adhesive fixings, brass/steel, classical/modern text, long hyphenated surnames, accents, poetry, business signs, landscape and portrait heritage text. Eight prior fixtures plus eight new fixtures; one intentionally overloaded tiny plaque. This is coverage testing, not a repeated controlled A/B or a universal success-rate estimate.

Used existing unpromoted MEDIUM deployment dpl_ChdVcVGLoCKNKxTFFmEjseZh3HSV and matching local production renderer at 127.0.0.1:4201. Fixture proof-session reads intercepted; no customer saves, database writes, orders, payments or emails. Each case used real model output, app validation and existing retry/fallback handling. All 16 desktop results visually inspected, including the failed case's placeholder. Geometry and mobile horizontal-overflow measurements captured.

## Findings

- 15 ordinary cases returned valid AI layouts on their first request. No fallback or repair needed for these cases.
- The deliberately overloaded 100 × 25 mm plaque with 15 mm caps timed out twice (HTTP 504). Local fallbacks also could not produce a valid proof. App retained wording and displayed the readable-fit error asking for a larger plaque, less text or help. No misleading generated proof; the placeholder screenshot is NOT an AI layout. The slow failure is still a UX weakness, not a successful generation.
- Long name split into two sensible lines without colliding with caps. Accented names and narrow poetry looked clear. Landscape and portrait history were readable and well grouped.
- Portrait award remains sparse. Large dedication has generous vertical gaps; acceptable but more deliberate spacing/scale could improve it. Short business sign intentionally minimal. More thinking has not automatically solved composition.
- All 15 generated layouts measured within the plaque face, with no mobile horizontal overflow. No visible fixing overlaps or clipping in the reviewed desktop images. Not a manufacturing/readability certification at physical size.

## Reproduce / artifacts

Fixture: scripts/fixtures/medium-size-text-review.json. Harness: scripts/check-layout-quality.cjs with LIVE_LAYOUT_QA=true, QA_PROTECTED=true, QA_CASE_FILE set to fixture and QA_API_URL to the existing MEDIUM endpoint. Calls require owner authorization; do not automatically rerun.

Ignored artifacts: output/medium-size-text/results (responses, records, desktop/mobile captures), summary.json, sheet-1.png through sheet-4.png. Offline sheets: scripts/render-medium-size-review.cjs. The contact-sheet command initially lacked NODE_PATH; rerunning with the existing test dependency directory succeeded without further model calls. One-shot user service cody-medium-variety-20260927 completed exit 0/inactive; no schedule.

Recommendation: MEDIUM remains a promising reliability candidate. Consider a separate conservative preflight for severely overloaded tiny plaques, and measured typography experiments for aesthetics. Neither is implemented by this test. Public canonical remains READY at dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW, app source 7af33c1. Do not promote this experiment branch wholesale: inherited HIGH QA configuration still contains a 120-second test timeout, unlike the MEDIUM endpoint tested here.

Timing: 17 recorded model API responses. Successful request times (including CLI/auth/network overhead) median 12.4 seconds, range 7.5–26.2 seconds. Failed stress case's two requests totalled 66.2 seconds, before final local handling. These are not pure model inference or full customer wall-clock times.
