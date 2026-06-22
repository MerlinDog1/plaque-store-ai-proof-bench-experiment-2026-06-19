# Semantic Layout Matrix - 2026-06-22

Branch: `experiment/semantic-layout-engine`

Restore checkpoint: `10c6845` (`Checkpoint current InstaPlaque prototype`)

Semantic experiment base: `aed5ef7` (`Add feature-flagged semantic typography experiment`)

## What Changed

- Expanded `scripts/layout-experiment-harness.cjs` from 6 starter cases to 38 cases.
- Added bench strip, bench plaque, A5, A4, memorial, heritage, commercial, institutional, auto, artisan, bold, and awkward wording cases.
- Fixed the harness size selector so the default `150 x 50 mm` bench option is selected by the actual size button, not the bench section accordion.
- Tightened semantic renderer wrapping so short words are less likely to be stranded.
- Added extra width guard for compact bench typography.
- Enforced a `5.2` minimum emitted font size in the semantic renderer, so it does not solve fit by making unreadably small text.

## Final Results

Semantic mode:

- Output: `output/layout-experiment-semantic-38-rerun-2/results.json`
- Cases: 38
- Average score: 99
- Remaining issues:
  - `bench-175-slim-long-risk`: 70, overflows by 6.2 units. This was a useful failure: the copy was too long for a 175 x 25 mm strip without going unreadably small. That 25 mm high preset was later removed; 50 mm is now the minimum plaque width and height.
  - `bench-200-strip-service`: 92, weak title dominance.
  - `a4-list-like-donors`: 92, weak title dominance.
  - `bench-150-too-much-copy`: 92, weak title dominance.

Current non-semantic mode:

- Output: `output/layout-experiment-current-38/results.json`
- Cases: 38
- Average score: 95
- Failures included changed/omitted wording, too many fonts, and several overflow cases.

## Recommendation

Keep semantic mode feature-flagged, but continue it. The comparative run supports the architecture: semantic mode was stronger at preserving exact wording and avoiding production overflow. It still needs better hierarchy scoring and explicit customer handling for impossible ultra-slim strip copy.
