# Anonymous visit statistics — preview, 31 October 2026

## Scope and status

PREVIEW ONLY. Base: live-source commit `ec24ba1`, branch
`codex/instaplaque-feed-studio-photos-20261031`. Work is isolated in
`codex/instaplaque-cookieless-stats-20261031`; the live-source checkout was not
edited or built. No production deploy, alias, domain, project setting, Google,
Meta or Supabase change is part of this task.

## Behaviour

- Vercel Web Analytics pageviews start without Accept, using the UK statistics
  exception. Its single integration lives in `services/siteStatistics.ts`.
- The Statistics switch is at the top of `/cookies`, reached by the existing
  “Details and settings” notice link and footer Cookies link. On by default;
  turning it off stops further pageviews immediately. No switch was added to
  the notice and its look and two buttons are unchanged.
- The objection is stored in `instaplaque-statistics-v1` in localStorage, just
  like the existing consent choices. `no` prevents the SDK loading on subsequent
  pages. Every SDK `beforeSend` checks again, including after loading and across
  tabs. Re-enabling counts the current page, not missed pages. Storage errors
  fail closed; if saving fails the current document still honours the choice
  and the switch explains the limitation. Clearing site storage clears choices.
- Accept/Reject, PostHog events, PostHog replay, Meta and Google consent mode are
  otherwise unchanged. They never write the statistics choice. The new switch
  never grants optional analytics or advertising permission.
- No Vercel custom events, identity, group profiles, traits or advertising IDs.
  Only public-page totals; query strings/fragments removed from page addresses,
  private proof/order/checkout/admin routes dropped, owner’s internal browser
  still excluded. No new scroll, speed or individual journey measurement.
- Statistics runs on the two production hosts, this project's protected preview
  hosts and localhost. Other trackers retain their original host rules:
  PostHog/replay/Google do not run on localhost or previews; Meta still can after
  Accept. Local Vercel requests normally have no endpoint; tests count attempts.

## Wording/legal assumption for the owner

**Reject is assumed to reject consent-based analytics/recording/advertising,
not to object to the separate statistics service.** The notice explicitly says
“even if you Reject”, and directs visitors to turn statistics off in Details and
settings. Cookie/privacy text repeats the distinction. The owner should decide
whether this short wording gives the desired clear, sufficiently prominent
explanation; it intentionally does not put the switch on the notice.

The legal premise supplied for this task is PECR Schedule A1 paragraph 5,
inserted by Data (Use and Access) Act 2025 s112/Schedule 12, commenced 5 February
2026 by SI 2026/82; ICO final storage/access guidance dated 29 April 2026.
The policies describe the statistics exception (not consent), site improvement,
totals only, no individual profiles or advertising use, Vercel processing on our
behalf and the simple free objection. Before any release, the owner should
confirm the selected Vercel service/processor terms and retention meet the
exception, particularly individual-level data only being kept until aggregation.
The application cannot attest to the processor's internal retention or change
its contractual use of data. No account-side settings or legal terms were changed.

Google's EXISTING advanced consent mode still loads the public Google tag in
denied mode before Accept and after Reject. It is not this statistics exception
implementation; it was explicitly left unchanged. Therefore “Google never
loads before Accept” would be an inaccurate description of this preview. The
build enforces denied ad/analytics storage and no custom conversion before
Accept, while preserving that existing cookieless Google behaviour.

## Build enforcement

`postbuild` now runs statistics, redaction, PostHog, video, replay and Google
purchase checks as well as the existing Google consent and Meta checks. The new
behavioural guard covers default-on, saved and late objections, independence
from Accept/Reject, cross-tab changes, re-enabling, storage failures, redaction,
pageviews only, internal browsers and a single gated Vercel entry point.

`check-google-consent.mjs` additionally verifies that changing Statistics cannot
grant Google permission or queue a custom event. `check-google-purchase.cjs`
now fires the first interaction in its bootstrap harness: since 26 October the
Google loader is intentionally deferred. This fixes the pre-existing “Public
pages retain one loader” test failure without changing production Google code.

## Verification and reproduction

Use the existing shared dependency install; no packages were installed.
Run `npm run typecheck`, then `npm run build` (including all postbuild checks).
Check memory before builds, and wrap heavy jobs in `cody-job --`.

Browser harness: `scripts/check-site-statistics-browser.cjs`.
Start the build with `PORT=4382 HOST=127.0.0.1 REVIEW_FOLLOWUP_CHECK_INTERVAL_MS=0
cody-job -- node server.mjs`. Save one read-only copy of the existing public
`/_vercel/insights/script.js` as `output/cookieless-stats/vercel-insights.js`.
Run the harness with `cody-job -- node scripts/check-site-statistics-browser.cjs`.
For production-host parity, set `TEST_ORIGIN=https://instaplaque.co.uk`: every
same-origin request is then routed to the local build, not the live website.
All provider tracker/event requests are intercepted; no test data is ingested.

Local tests run the downloaded real Vercel runtime, block optional SDK downloads
but count their attempted requests, and fulfil capture requests locally. The
five cases exercise real UI controls, then three SDK/navigation pageviews. Off
cases additionally reload locally and verify no Vercel script loads, including
a later Accept. The hosted run uses the preview's real Vercel script with event
requests intercepted, one page load per case. A protection bypass obtained with
the owner's existing Vercel login is sent only to that exact preview origin and
is neither logged nor committed.

Results, preview URL, screenshots and final source checkpoint are recorded below.

### Local results

Typecheck PASS. Initial and final builds and every postbuild check PASS. The strengthened
static-HTML tracker guard also passes on all four checked entry pages. Five cases PASS both at localhost and with
production-origin requests routed to the same local build. Real phone screenshots
were visually reviewed; no sideways overflow or browser page errors.

Production-origin request attempts (all blocked/fulfilled locally):

| Case | Vercel views, initial + 3 probes | PostHog events / replay loader | Meta loader | Google loader / final consent |
| --- | --- | --- | --- | --- |
| No choice | 1 + 3 | 0 / 0 | 0 | 1 / denied |
| Reject | 1 + 3 | 0 / 0 | 0 | 1 / denied |
| Accept | 1 + 3 | 2 / 1 | 1 | 1 / granted |
| Statistics off before choice | 1 + 0 | 0 / 0 | 0 | 1 / denied |
| Statistics off after Accept | 1 + 0 | 2 / 1 | 1 | 1 / granted |

An objection stops future counting; it cannot retract the pageview made before
the switch was pressed. Both off cases reload with **zero Vercel script
requests**; Accept after a saved objection still causes zero. Before Accept,
Vercel writes no cookies or localStorage identifiers. Synthetic SDK custom events
and identify calls were blocked, with no attribution storage written.

Local evidence under `output/cookieless-stats/` (ignored): `typecheck.log`,
`build.log`, `build-final.log`, `browser-local/results.json`,
`browser-canonical/results.json`; screenshots in both browser folders:
`phone-notice.png`, `phone-notice-detail.png`, `phone-cookies-on.png`,
`phone-cookies-off.png`. Local noncanonical cases have no PostHog/replay/Google
requests, as required by their existing host restrictions.

### Deployed preview and hosted verification

- Preview: https://instaplaque-gxvsljc31-dullaghan31-3959s-projects.vercel.app
  (Vercel login/protection applies).
- Deployed application/source checkpoint:
  `dbf323da8f14923f3067fc10a8adf794ff678913`.
- One `vercel deploy`, serialised by the shared lock; READY on 31 October 2026
  around 17:04 UTC. Cloud build and **every postbuild check passed**. No retry,
  production deploy, promote, manual alias or settings change.
- Actual protected preview: **5/5 PASS**, using its real hosted Vercel SDK, one
  page load per case. Event requests intercepted/fulfilled locally, so no test
  events reached analytics providers. No overflow or browser page errors.
- Vercel view attempts: no choice `1 + 3`; Reject `1 + 3`; Accept `1 + 3`;
  Statistics off before choice `1 + 0`; off after Accept `1 + 0` (initial view +
  three later probes). Exactly one Vercel script request per fresh case. The
  two objection cases stop all subsequent SDK/navigation pageviews.
- Meta loader: zero for no choice, Reject and off-before-choice; one for Accept
  and off-after-Accept. Google/PostHog/replay stay absent on this nonproduction
  host, matching their pre-existing host guards. The production-origin local
  matrix above proves their normal Accept-only/Google-consent-mode behaviour.
- Browser evidence: `output/cookieless-stats/browser-preview/results.json` and
  `browser-preview.log`. Visually checked phone screenshots:
  `browser-preview/phone-notice.png`, `phone-notice-detail.png`,
  `phone-cookies-on.png`, `phone-cookies-off.png`. The preview toolbar belongs to
  Vercel and is not part of the live site. Absolute evidence root:
  `/home/coding-agent/workspace/projects/instaplaque-cookieless-stats-20261031/output/cookieless-stats/`.
- `index.html`, PostHog, replay, Meta and Google purchase runtime files remain
  byte-for-byte unchanged from the live-source base. No dependencies installed.
  All task browsers closed and only this task's port-4382 server was stopped.
- A subsequent documentation-only commit records these results; the deployed
  application remains exactly the source checkpoint above. Nothing is live on
  the production domains.
