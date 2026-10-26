# Session recordings in PostHog (26 Oct 2026)

## Why

The owner (msg 6565): "can we set up recording for instaplaque also?". The PostHog project (EU, 303026) already had
session recording switched on (`session_recording_opt_in: true`, 30-day retention, console logs and network timings on).
The JFK sign-pack site records through posthog-js. InstaPlaque sends its own `ip_*` events with `fetch`
(`services/posthogAnalytics.ts`), with no recorder, and its privacy policy said "Session replay is disabled".

The morning's ads check found that ad visitors look at prices and leave within a minute. Recordings show what they do.

## What changed

### Who is recorded

`replayVisit()` in `posthogAnalytics.ts` decides. A visit is recorded only if all of these hold:
- analytics consent (`instaplaque-analytics-consent-v1 = yes`) on instaplaque.co.uk over https;
- recording consent (`instaplaque-replay-consent-v1 = yes`), which Accept now also sets. Visitors who accepted before
  the cookie notice described recordings stay analytics-only until they accept again;
- a public page: `publicPagePath()`, the same rule as pageviews. No proof, order or checkout links, and no admin;
- not the owner's own browser (`?internal=on`).

QA sessions are recorded (to test it). Their `ip_*` events carry `is_test` as before.

### The recorder (`services/sessionReplay.ts`, started from `index.tsx`)

- **Loading:** posthog-js loads from PostHog's EU CDN only when a visit qualifies, through PostHog's standard loader.
- **What it sends:** only the recording.
  - `before_send` passes `$snapshot` alone, so the `ip_*` events stay our only analytics events.
  - `autocapture`, pageviews, page leaves, rage clicks, dead clicks, heatmaps, exceptions and surveys are off.
- **Privacy:**
  - `maskAllInputs` hides everything typed.
  - Class `ph-no-capture` blocks these elements; replays show a grey box of the same size:
    - the plaque preview and 3D view (`.proofbench-proof-pad` in `App.tsx`);
    - the AI realistic preview dialog;
    - uploaded artwork, the EtchMaster style reference and AI concept images in `Controls.tsx`;
    - the design request's reference image.
  - Class `ph-mask` masks the text of the design request's review and receipt, which repeat name, email and wording,
    and the reference file's name.
  - Recorded network timings keep no query strings (`maskCapturedNetworkRequestFn`).
  - `persistence: 'localStorage'`, so no cookies.
- **One ID for the visit:**
  - Visit IDs are now UUIDv7, because PostHog only accepts a bootstrapped session ID in that form.
  - posthog-js is bootstrapped with the visit ID as both distinct ID and session ID.
  - Our `ip_*` events already carry it as `$session_id`, so they appear in the recording's timeline and link to it.
- **Private pages:** `history.pushState`/`replaceState` are wrapped.
  - A private URL stops the recording before it is pushed, which is before React draws the page.
  - A public URL starts it again.
  - A full page load of a private page never starts it.
- **Withdrawal (Reject in Cookie settings):**
  - The recording stops and posthog-js opts out. `opt_out_persistence_by_default` turns its storage off.
  - PostHog's localStorage and sessionStorage keys are removed straight away, and again 3 s later in case a write was
    already under way.
  - Accepting again resumes it without loading posthog-js a second time.

### Wording

- **Cookie notice:** "With analytics, we also record how pages and the designer are used, with anything you type hidden."
- **Privacy policy:**
  - "Data collected" adds recordings.
  - "Web analytics" replaces "Session replay is disabled" with what is recorded, what is hidden, where it never runs, and
    the 30-day deletion.
  - Last updated 26 October 2026.
- **Cookie policy:** "Other optional analytics" replaces "It does not record sessions…" with the recorder, its local
  storage and what recordings hide.

## Checks

- `npm run check:posthog` passes. New assertions:
  - UUIDv7 visit IDs carrying their time;
  - `ip_*` events carry the visit as `$session_id`;
  - recording consent set by Accept;
  - no recording on private links, for the owner's browser, after withdrawal, or with only an earlier consent.
- `npm run check:replay` (new, `scripts/check-session-replay.cjs`) passes. It runs the real
  `sessionReplay.ts` and `posthogAnalytics.ts` with a stand-in posthog-js and checks:
  - it loads once, and only with recording consent;
  - every privacy setting, including `before_send` passing only `$snapshot` and network URLs losing their queries;
  - it stops before `/checkout` or `?proof=` URLs are pushed and restarts on public ones;
  - the owner's browser, preview hosts, private full loads and earlier consent are excluded;
  - withdrawal opts out and removes only PostHog's storage.
- It is not in CI yet: GitHub refused the push of `.github/workflows/ci.yml`, because this machine's GitHub login has
  no `workflow` scope. The one-line change (`npm run check:replay` after `check:posthog`) is saved as
  `workspace/output/instaplaque-session-replay-20261026/ci-check-replay.patch`. Apply it with a login that has that
  scope.
- `tsc -p output/tsconfig.stake.json` passes.
- **Real built app in headless Chrome**: `workspace/output/instaplaque-session-replay-20261026/run_check.sh` with
  `check_replay.cjs`, on test copy `instaplaque-khphcqp8i`.
  - posthog-js and its recorder load from PostHog's CDN, and its `/flags` call goes to PostHog. Everything it would send
    is answered locally and decoded.
  - The check presents as ordinary Chrome: posthog-js drops recordings from browsers that look like bots (HeadlessChrome,
    `navigator.webdriver`).
  - **desktop:**
    - nothing loads before consent; Accept starts the recording;
    - the recording session and distinct ID are the visit ID;
    - pushing `/checkout` stops it and `/design` restarts it;
    - Reject stops it and removes PostHog's storage. The batch sent while stopping holds only what was recorded before
      the click: the latest item was 459 ms after it;
    - posthog-js sent only `$snapshot`, all with the visit as session;
    - the memorial page's text is in the 1.5 MB of recording data;
    - the wording typed into the designer ("ZEBRAQUOKKA") is nowhere in it or in anything else sent;
    - the preview is a `ph-no-capture` placeholder;
    - none of the 81 network timings has a query string;
    - no page errors.
  - **phone** (iPhone 13, consent already given): it records from the first load and sends once the visitor taps or
    scrolls; nothing is wider than the screen; no page errors.
  - **internal** (the owner's browser) and **legacy** (consent from before): posthog-js never loads.
- An earlier test copy, `instaplaque-47o0oai2k`, found PostHog's storage written again just after Reject. That led to
  `opt_out_persistence_by_default` and the 3 s sweep.

## Release

The owner asked to set it up (msg 6565). `vercel promote` set `instaplaque.co.uk` to dpl_ogT7gvhE6aZ9EfUbRrLcb55ekVN9
(instaplaque-khphcqp8i, `index-B_3dEwRQ.js`) at 12:26 UTC on 26 Oct. Production was still the 3D stake release
(dpl_9JbKwkHiX4takXcyKpfxJAdfDvyp), so nothing newer was overwritten.

- All 9 live pages serve `index-B_3dEwRQ.js`. The 11 files the browser check loaded are byte-identical live.
- `check_static.mjs` on the live HTML of the 9 pages passes.
- `verify_live.py` (`BUNDLE=index-B_3dEwRQ.js`) passes: 175 product pages and 771 linked assets identical to
  `public/`; sitemaps, feed, redirects and the IndexNow key are fine.
- IndexNow was told about /privacy and /cookies (HTTP 200).
- **Live test visit** (`live_qa.cjs`):
  - a fresh Chrome with recording consent, marked as a QA session, with Google, Meta and Vercel analytics answered
    locally;
  - it recorded `/memorial-plaques`, and PostHog accepted the batch (HTTP 200);
  - PostHog's API listed the recording under the visit's ID, `01a1782d-75fa-763a-9293-efc19dd1710d`, within 15 s.
  - It is a test recording of a few seconds, from Chrome on Windows.

Rollback: with `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` set, run
`vercel promote https://instaplaque-hdusrgc6v-dullaghan31-3959s-projects.vercel.app --yes` (dpl_9JbKwkHi). Recordings
already made stay in PostHog for 30 days.

## Where to watch

PostHog EU → project "Default project" → Session replay. InstaPlaque's recordings start on instaplaque.co.uk URLs; the
JFK pack's on jfk-pack-builder.vercel.app.
