# Designer wording step: clearer, one main button, progress on the plaque (27 October 2026)

## Why

The owner (Telegram msg 6884, with two phone screenshots of the wording step): "Generate layout button is hidden without a
scroll. Also is it even really super clear to user what happens here? Does it explicitly say hey just dump your text
in here and ai magic will fix everything? It doesn't right? And when I do generate I know we have the timer thing but is
that the best or enough? Perhaps a percentage counter on the plaque?" Also: "I don't want to default to the inbuilt
layout thing because it sucks", so the local no-AI layout is still not offered.

What visitors did, 20–27 Oct (PostHog, consenting visitors, owner excluded; `output/instaplaque-ads-plan-20261025/`
on Cody's VPS, scripts `designer_journeys.py` and `recording_taps.py`):

- On a phone the only button in view was "Continue to review". A visitor from an ad pressed it without making a layout,
  met "Finish these steps before checkout", tapped the box twice (not its button) and left.
- Another typed their words, pressed Generate, saw "Still working…" and left after 83 s without a layout.
- AI layouts took 23–71 s, usually about 36 s; the old card promised "usually around 10–30 seconds".

## What changed

- **One main button.** On the wording step the footer button (always on screen) is "Design my plaque" until there is a
  current layout. It makes the layout, shows "Designing… N%" while it works, and "Update my layout" when the words have
  changed since. With no words yet it puts the cursor in the box. Once the layout is current it is "Continue to review"
  as before. The button under the box is also "Design my plaque" (it was "Generate layout").
- **Plain words.** The box above the text area says "Just type your words: type or paste them any way you like. No need
  to set out the lines: our AI designer arranges them for you and shows your finished plaque in about 30–60 seconds."
  The note under it: "We fix obvious typos and stray capitals only. Please check names and dates on the finished
  plaque." The placeholder is an example inscription typed in one line. The plaque's guide text reads "Just type your
  words / No layout needed / Our AI designer will lay them out for you", and once words are typed "Your words are
  ready / Press Design my plaque". Desktop step text: "Type your words. Our AI designer does the rest."
  These claims match the code: the proofreader only fixes obvious misspellings and accidental capitals (never names'
  spelling, numbers or dates), and the layout model may change only whitespace (line breaks, sizes and hierarchy).
- **Percentage on the plaque.** `components/LayoutProgress.tsx` now has `useLayoutProgress` and
  `LayoutProgressOverlay`, shown over the plaque preview instead of the old floating card. The figure is an estimate:
  it follows the stage actually reached (spelling ≤ 24 %, layout ≤ 90 %, fit check ≤ 95 %, retry ≤ 96 %), rises with
  time on a curve fitted to the real 36 s median, never goes backwards and only reaches 100 % when the layout arrives.
  Stage lines: "Checking your spelling", "Designing your layout", "Final checks", "Taking another pass at your layout";
  after 45 s "Still working. Some layouts take a little longer." The same figure is on both buttons. With reduced
  motion the sheen is off.
- **Review checklist.** "Finish these steps before checkout" items are solid dark buttons ("Design your plaque layout →",
  "Update your layout →") instead of pale text a visitor tapped around.

## Checks

- `tsc --noEmit -p tsconfig.check.json` passes (14 s). `tsconfig.check.json` is the normal config without `dist/`,
  `output/` and `brass-texture-expander/`: on the VPS checkout the plain `tsc` also type-checks the built bundles and
  scratch files and ran past 400 s under memory pressure.
- `npm run build` with every postbuild check passes.
- `scripts/check-layout-progress.mjs` (rewritten for this change, mocked model calls only), at 390 and 1440 px: the
  footer button is on screen and makes the layout; the percentage is on top of the plaque and inside the preview;
  24 % during the spelling check, 85 % in layout, never backwards, retry and edit restart; no extra request while
  waiting; reduced motion; failure keeps the previous proof; no horizontal overflow; no page errors.
- `scripts/check-generation-timeout-ui.mjs` passes all 8 cases (2 widths × slow success, server deadline, platform
  timeout, browser deadline).
- Other scripts that pressed "Generate layout" now press the first "Design my plaque" button.
  `check-deployment-readiness.mjs` was already out of date before this change (its model mock does not answer the
  proofreading request) and was not run.

## Release

- Branch `codex/instaplaque-designer-wording-20261027`, based on `codex/instaplaque-google-customer-reviews-20261026`
  (deb50df, live as dpl_47YaX9pv).
- Not live. A candidate link for the owner to try comes from `vercel deploy --prod --skip-domain`; promote only on the
  owner's go-ahead. Rollback after a promotion: promote dpl_47YaX9pvMhg1h5qtCKHumLdMLaiT (instaplaque-ovr62c0y3).
