# MEDIUM production release — 27 September 2026

Owner requested promotion after the thinking-budget, wider MEDIUM and Sol comparisons.

## Source and scope

Branch `codex/medium-live`; application source `730f7489e4454122853db478e7f37491dd787970`.
Based on the verified live application `7af33c1` plus its existing QA/documentation checkpoint `d92f251`, not the experimental 120-second branch.
Only application change: server-owned structured-content configuration now uses MEDIUM thinking and 16,384 output tokens instead of LOW/8,192. Existing input restrictions prevent caller overrides. Image generation and prompt-enhancement settings unchanged. No QA profile mechanism, prompt, renderer, timeout, database, email or payment change.

## Checks

Typecheck, production build/runtime checks and public-input/SVG security checks passed. Security browser check used installed Chrome via CHROMIUM_EXECUTABLE after the default Playwright browser was unavailable. Local Node24 produced the existing engine-range warning; Vercel build succeeded.
Deployment `dpl_sM6tNv6rC2ouab27KDUzypd6P8qL` built from the clean application commit using production configuration and initially withheld from public aliases.

## Release verification

Promoted successfully; canonical and www independently inspected READY on the release deployment. Candidate bench memorial and landscape railway history passed first request, visually inspected with face-bounds and mobile-overflow checks. A separate dense portrait heritage probe returned HTTP200 twice but failed authored width validation; local fallback paths were attempted, and browser closure interrupted final UI measurement, so this case is NOT counted as a successful proof. The failure is retained, not hidden by successful follow-up cases. Public canonical API bench generation then passed first request with no fallback, visually inspected with face-bounds/mobile-overflow checks. Four hosted checks passed at390/1440 for deeper caps and enlarged/offset text. Synthetic proof reads are intercepted; no customer proof saves or orders are made. Private screenshots and responses stay in ignored output/medium-release.

## Limits and rollback

MEDIUM was more consistent in the comparison, not a guaranteed aesthetic winner. Sparse portrait layouts and slow rejection of overloaded tiny plaques remain known limitations. The 30-second function timeout and one-repair policy are unchanged.
Compatible previous deployment: `dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW`. If rollback is needed, promote that existing deployment through the same Vercel project and recheck canonical/www. No database rollback is required.
