# Admin order list timeout — 7 October 2026

## Status

Prepared and tested on `codex/admin-list-timeout`, based on `b65f997` (the
documentation tip for live application `75a8cab`). **Not deployed.** Current
production remains `dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q` on instaplaque.co.uk.
The owner asked why the admin displayed “Could not list orders”; no production
release, database write, payment, email or PIM change was performed.

## Evidence

- Vercel request logs confirmed repeated HTTP 500 responses on
  `GET /api/admin/orders`, during the reported incident.
- Read-only inspection confirmed the primary order records remain present.
  The apparent zero count is not data loss.
- The deployed `listOrderColumns` query fetched full plaque state and proof
  packages for up to 200 orders. The deployed query transferred complete inline artwork; reproduction through
  the same Supabase JS client failed with PostgreSQL **57014**, “canceling statement due
  to statement timeout”. This was intermittent: a raw read could succeed.
- Supabase's error is a plain object, not an `Error` instance, so the deployed
  catch block replaced its explanation with the generic message. The UI then
  continued displaying its initial zero metrics.
- The new read-only summary query returned the same complete primary set in
  under a second, with no SVG, image data or R2 artwork markers. The lightweight
  legacy path also succeeded. Exact live counts and timings are retained only
  in the private workspace record; no customer data or credentials are included.

## Change

The authenticated list route now projects only summary fields in SQL, including
the product dimensions, postage search fields, fulfilment metadata and email
events used by the list. It does not hydrate artwork. The existing authenticated
single-order, proof and download paths retain the complete original artwork.
The existing 200-record limit and legacy fallback are retained; this is not a
pagination change. The unrelated review-email worker's full-order path is unchanged.

Failed initial loads show unavailable/retry rather than zero sales. A selected
summary is never presented as a production proof: full details must load first,
and a separate failed-detail retry leaves the usable list intact. Timeout API
responses are explicit 503s; server logging records only the bounded error code.

### Click-to-load follow-up

The owner requested that artwork load only after clicking an order. The list
therefore starts with no selected order: neither a successful list load nor a
reload automatically opens the first record. Search and sorting use the summaries
already loaded. Clicking a row loads only that order's detail; switching rows
aborts the previous in-flight detail fetch. Full details are still required before
showing production artwork or its download controls. This follow-up is also
prepared only, not deployed.
Application commit: `eb54620ffee3d7be6c4c889e2feb57ea6b84d6b6`.

## Checks

- `npm run check:admin-orders`: synthetic auth denial, SQL projections, metadata
  preservation, no artwork hydration, empty/missing primary legacy fallback,
  timeout response and unchanged exact single-order proof retrieval passed.
- `node scripts/check-admin-order-list-ui.cjs`: production-build browser checks
  at 390 and 1440 px passed, covering failed-list honest counts, retry, zero
  detail requests before a click (including search, sorting and reload), only
  the clicked order's requests, isolated detail failure/retry, exact proofs,
  no overflow or JS errors. All API requests
  intercepted; no live customer actions.
- Typecheck of `components/SiteExperience.tsx` and its dependency graph passed
  using a temporary config extending the normal tsconfig. Full-repository
  typecheck was not rerun under the inherited memory limit.
- `npm run build`, Node syntax checks and `git diff --check` passed.
- Current database verification used the coding account's existing independent
  TradeEtch login, read-only queries only. No admin password was retrieved.

## Next step

Deploy only on an explicit owner release instruction, as required by AGENTS.md.
Recheck the live alias before release, retain all current Supabase/R2 settings,
then verify the authenticated hosted list and one selected order. No migration
or secret change is needed. Rollback is code-only to the current deployment
above. `vercel.json` retains `git.deploymentEnabled: false`; the repository's
only workflow is CI, with no deployment step.
