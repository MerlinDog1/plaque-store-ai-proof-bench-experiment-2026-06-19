# RELEASE STAGING BLOCKED — no staged URL or deployment ID

7 November 2026. Owner approval msg 10932 authorized staging plus one unpaid real checkout, but the required consent checks did not all pass. Per the explicit failure gate, no staging deployment was attempted and no promotion occurred.

Branch: codex/instaplaque-phone-source-release-20261107
Release application commit: 391a64284adb84cc04f9df6b822a0e09ea75dbb2
Base: final pushed v2 head 4094dee17293b8c4eb8934b8179a28e723f4caf5
Production preflight: PASS, still dpl_DyTwtgWCmASKbePetzNnczHsHsG1.

## Completed

- Exact proposed paragraph from REPORT.md added verbatim under “Order and enquiry sources” on the public privacy page. Privacy last-updated date is 7 November 2026. No other legal text or cookie wording changed.
- Existing privacy policy does not use systematic per-purpose lawful-basis labels, so no extra legal wording was inserted beyond the verbatim approved paragraph.
- Typecheck: PASS.
- Full build plus every postbuild guard: PASS.
- Attribution unit/integration tests: 27/27 PASS.
- check-phone-photo: 15 photo measurements and 875/875 title/viewport cases PASS; relocated controls work.
- Compiled phone/cookie/designer matrix: 27/27 PASS, no page errors/hit-test failures.
- Cookie dismissal: Accept and Reject PASS; designer regains space with footer visible.
- Google consent static suite: PASS.
- Google consent built-browser suite: all three fresh/saved-no/saved-yes cases PASS.
- Local SEO: all 175 fields and feed/both sitemap hashes match the retained live capture. Built privacy paragraph/date verified.
- Release branch pushed; v1/v2 branches unchanged.

## Blocking check

`scripts/check-google-consent-network.mjs` exited 1. The live-baseline subtest has an outdated static-asset allowlist that rejects the current live promo video. The synthetic paid-purchase continuity subtest also fails: release run expected one intercepted purchase request but observed two. All measurement/API/payment requests in this suite are intercepted; no actual conversions, checkout sessions, orders or DB writes occurred.

The same unmodified test was run separately against the immutable live-source build in `baseline-consent/`, without modifying that source checkout. It reproduces the video failure and fails the purchase-continuity case too, but at a DIFFERENT assertion (missing expected client ID, rather than request count). This is not proof that the two purchase failures have the same cause; neither the harness nor production analytics code was changed or the gate waived.

## Verbatim failing errors

### consent-network.log: current-live-baseline

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ [
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.webp',
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.webp',
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.mp4'
+ ]
- []

    at file:///home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:121:14
    at async check (file:///home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:105:20)
    at async file:///home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:115:3
```

### consent-network.log: prepared-paid-purchase-cookie-continuity

```text
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
    at captureRawStack (/home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/node_modules/playwright-core/lib/coreBundle.js:3130:17)
    at callMatcherAsStep (/home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/node_modules/playwright/lib/matchers/expect.js:12873:57)
    at Object.toBe (/home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/node_modules/playwright/lib/matchers/expect.js:12863:23)
    at /home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:212:103
    at async check (/home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:105:20)
    at async file:///home/coding-agent/workspace/projects/instaplaque-phone-fold-source-20261107/scripts/check-google-consent-network.mjs:185:3
```

### consent-network-baseline.log: current-live-baseline

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ [
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.webp',
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.webp',
+   'Unexpected live static GET: /videos/memorial-plaques-20261106-v2.mp4'
+ ]
- []

    at file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:121:14
    at async check (file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:105:20)
    at async file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:115:3
```

### consent-network-baseline.log: prepared-paid-purchase-cookie-continuity

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected

+ undefined
- '2099703458.1794078294'

    at file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:215:14
    at async check (file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:105:20)
    at async file:///home/coding-agent/workspace/output/instaplaque-phone-fold-source-20261107/release/baseline-consent/check-google-consent-network.mjs:185:3
```

## Not performed

- No `vercel deploy --prod --skip-domain`; no staged deployment or URL; no promotion.
- Hosted LIVE Stripe flags, staged 27-screen matrix, staged 175-page raw-tag parity/privacy verification: NOT RUN (no stage).
- Real flow: NOT RUN. AI calls 0; checkout sessions 0; CODY TEST order ID none; DB readback not applicable. No card/payment, email, WhatsApp send, admin login, env/Ads/Merchant changes or manual DB writes.
- No protection-bypass credential was obtained for this release.

Prepared but unexecuted scripts are retained here: `deploy-stage.py`, `verify-hosted.py`, `real-flow.mjs`. The real-flow harness has a two-AI/one-checkout guard, permits only the requested API writes, blocks advertising/contact requests and never clicks a payment action. Do not infer execution from these files.

## Handoff

Review/resolve the consent-network fixture failures before deciding to resume staging. The prepared release branch is not live. Final cleanup/remote commit is in `final-state.txt`. Rollback reference for Cody after any future release: promote `dpl_DyTwtgWCmASKbePetzNnczHsHsG1` under `/home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock`.
