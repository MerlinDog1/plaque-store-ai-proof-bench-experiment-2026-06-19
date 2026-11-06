# Larger cookie notice — 6 November 2026

Owner msg 10199: “Make cookie notice bigger but keep existing words.” Preview only.
Based on page-improvements `4f72e04`; task branch `codex/instaplaque-cookie-bigger-20261106`.

Only the final cookie rules in `shopfront.css` change. The cream background, green buttons,
full and short wording, Settings link, static fallback and consent implementation are unchanged.

- Desktop: text 15 → 18 px; buttons 100 × 44 → 124 × 56 px minimum; vertical padding 8 → 14 px;
  maximum width 1120 → 1200 px. Bottom safe-area inset is now also respected on desktop.
- Phones: text 13 → 15 px; button text 14 → 16 px, height 44 → 52 px and minimum width 80 px;
  padding 5/7/5/12 → 10/12 px. Existing contact-strip clearance and designer top placement retained.
- Both choices share the same size, colours and visible keyboard-focus styling.

Evidence and repeatable browser harness: workspace `output/instaplaque-cookie-bigger-20261106/`.
The browser matrix uses local builds, three routes (home, garden category, designer), widths
320, 360, 390, 414 and 1440 px, and both choices followed by reload. It waits for the existing
contact-strip entrance animation to settle before checking clearance. JPEGs are at most 1600 px.
`REPORT.md` there records actual results, measured sizes and the preview URL.

No production deployment, promotion, aliases, environment settings or database changes.
Production must remain `dpl_EN5TJhoAY3gizahUEiQG9hji4mr2`.
