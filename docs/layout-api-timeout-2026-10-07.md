# Text-layout API timeout — 7 October 2026

## Status

Prepared and verified locally on `codex/layout-api-timeout`. **Not deployed.**
Based on `b65f997` (the `75a8cab` live application plus its release notes).
The separate `codex/admin-list-timeout` changes are not included.

## Diagnosis

Production inspection still resolves `instaplaque.co.uk` to READY deployment
`dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q`. Recent requests to
`POST /api/gemini/generate-content` include successful 200s and repeated 504s
with `Vercel Runtime Timeout Error: Task timed out after 30 seconds`.
The explicit `vercel.json` function limit is 30 seconds. The project's existing
Fluid Compute setting is enabled, with a 300-second default. The source override,
not a missing API key or a total API outage, explains the observed cutoff.
Raw cloud logs remain private; no customer wording is included here.

## Change

- Allow the existing API entry point 120 seconds, per the supported
  [Vercel duration configuration](https://vercel.com/docs/functions/configuring-functions/duration).
  Because the app has one entry point, this ceiling also applies to its other
  routes; their logic is unchanged.
- Bound each structured-text upstream request to 110 seconds and abort its
  transport on expiry. Return a safe JSON 504 before platform termination.
- Bound the browser text request to 125 seconds, including reading its response.
  Platform non-JSON 504s and connection stalls also show a clear message.
- Mark these timeouts non-retryable automatically; the user can retry explicitly.
  This prevents a single stalled proofreading request becoming many repeated calls.
- Keep Gemini model, MEDIUM thinking, 16,384 output tokens, prompt, exact-wording
  validation, local layout fallback, rate limits and input restrictions unchanged.
  No new provider or model fallback, key, billing change, queue or worker.
- Image-generation handling and budgets are not changed. The generic client now
  retains HTTP status/code metadata on errors; text-only deadlines do not apply
  to image requests.

## Checks

- `node scripts/check-generation-timeout.mjs`: deadline hierarchy, successful
  timer cleanup, cancellation, cancellation-resistant transport bound,
  safe timeout response, provider failure propagation, unchanged image path,
  and rejected client timeout/abort overrides pass.
- The same script exercises the **actual API handler and installed Google SDK**
  with a synthetic upstream response delayed 31 seconds. HTTP 200 after 31.046
  seconds with exactly one upstream call. The upstream is mocked, not a fresh
  paid model call and not proof of a hosted release.
- `node scripts/check-generation-timeout-ui.mjs` against the built local preview:
  390px and 1440px slow success, controlled server timeout, non-JSON platform 504,
  and browser timeout all pass. No automatic repeat after expiry, original
  wording retained, manual retry enabled, progress removed, no overflow/page
  errors. Model requests are intercepted; no customer data or writes.
- `CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node scripts/check-public-input-security.mjs`
  passes, including API input restrictions and SVG security. The initial run
  lacked Playwright's bundled browser; rerunning with installed Chrome passed.
- TypeScript check of changed services, App and their imported dependencies
  passes under the existing memory budget. Full repository typecheck not rerun.
- `npm run build` passes (including API runtime/health checks and prerender).
  Existing large-chunk advisory remains.
- `git diff --check` passes. No dependencies or secrets added.

## Release and rollback

Owner must request the production release. Before releasing, reconcile the live
alias again and preserve any later source changes. Do not accidentally include
or discard the separately prepared admin fix. Deploy this reviewed source using
the existing InstaPlaque project, then inspect the emitted function duration,
canonical/www aliases and an actual hosted synthetic text-layout flow.

No production deployment, database write/migration, order, payment, customer
email or PIM change was made by this task. The compatible previous deployment is
`dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q`; code-only rollback would also restore the
old 30-second limit. Keep existing Supabase/private R2 configuration unchanged.
