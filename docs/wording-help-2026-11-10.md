# Wording-step help and phone keyboard support — 10 November 2026

Owner-authorised staging only, on `codex/instaplaque-wording-help-20261110`, based on
social-footer application commit `fbd2c8d38886f50839c730f03b298c44ca05dfda`.
Production promotion is a separate parent-agent action; this work never changes aliases.

## What and why

The first empty Wording step in a tab's visit shows a silent 6.5-second demonstration
inside the existing preview: type freely, press **Design my plaque**, and the AI lays
out the words. Its AI beat explicitly says **Sped up · Usually 30–60 seconds**.
Typing, Skip, tapping the clip or leaving Wording dismisses it. At the end it fades
back to the existing proof. **How it works** replays on demand without shifting the
controls. Existing words or an existing layout suppress the automatic introduction.

The session-only `instaplaque-wording-explainer-v1` flag remembers that the introduction
has been shown. Storage errors fall back to in-memory state and never block typing.
Reduced-motion and Save-Data visitors initially see only the final-plaque poster;
manual replay still works. No clip/poster request occurs before Wording opens. A
failed media request or rejected playback returns to the normal preview.

The existing Back/main-action bar follows `visualViewport.resize` and `scroll` when
a touch device's wording textarea is focused and viewport height loss exceeds
120px. No third design button is added. The existing controls scroller is raised
only while needed so the caret remains above the keyboard and action bar; its
stacking order is raised above the preview. Fixed coordinates compensate for the
designer entrance animation's retained transform. Closing the keyboard, blurring
the field or leaving Wording restores all temporary classes and inline variables.
Desktop/non-touch operation is unchanged. Native iOS/Android keyboards still need
an owner/device check: headless viewport emulation cannot verify an actual keyboard.

## Media provenance

New Remotion composition `WordingExplainer` in the separate promo-video project,
source commit `37b0522aa19e38c510fd2472a4af66c74100cd87`. It uses a tight reconstruction
of the current wording labels with the real Arthur Bell AI result from the existing
28 October capture, not a fabricated inscription. No new AI call was used to make
it. The original result took 26.759 seconds. The clip is 780×500, H.264/yuv420p,
faststart, 30fps, silent (no audio stream), 75,056 bytes. The final-frame WebP is
15,588 bytes. `object-fit: contain` prevents cropping at phone/desktop sizes.

The cookie page describes categories of essential storage rather than an exhaustive
key list, so no policy text/date change is needed for this one-visit UI preference.
No analytics events, cookies, session-replay configuration or tracking are added.

## Verification and release evidence

`npm run check:wording-help` covers lazy loading, one visit/reload/new visit, ending,
replay, typing/Skip/step dismissal, motion and data preferences, failed media,
390/360 keyboard geometry and mocked generation, and desktop non-lift. AI endpoints
are intercepted in local checks. The separate existing `check-layout-progress.mjs`
checks the main-button/progress flow. Typecheck, full build/postbuild guards, baseline
suite comparison and exact screenshot checks are required before staging.

The release evidence folder is `output/instaplaque-wording-help-20261110` in Cody's
workspace: BRIEF, REPORT, checks JSON/logs, native-size screenshots, WORDING-SHEET,
clip copies and staged receipts. Built HTML comparisons normalise only generated
JS/CSS content-addressed filenames; every other byte, the feed and both sitemaps
must remain unchanged. Staging uses the production target with `--skip-domain`,
never promotion. Hosted testing performs at most two real phone AI layout attempts,
no checkout, forms, admin login, email, order or payment changes.

Application commit: `0177d89`. Typecheck and build/postbuild guards passed. The
full 44-command suite passed against its existing baseline: 36 passes and the same
eight known failures, with matching failure signatures. Main JS gzip grew by
1,319 bytes. Local wording and layout-progress regressions passed. Exact pixel
and hosted gates are recorded separately in the release receipt, not implied here.

## Undo

Before promotion: leave the staged deployment unaliased; production is unaffected.
After any separately authorised promotion, the parent can promote the recorded
previous deployment for a full rollback, or revert the application commit and
stage/review that revert. Removing `WordingHelp`, its App/Controls wiring, the
wording-only CSS, two versioned media files and check script restores the old flow.
The harmless session flag expires with the tab's visit; no database migration or
stored customer-data cleanup is involved.
