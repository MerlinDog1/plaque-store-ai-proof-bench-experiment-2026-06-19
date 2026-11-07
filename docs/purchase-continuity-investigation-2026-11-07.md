# Purchase continuity investigation — CLEARED

7 November 2026. Cody reviewed the six completed traces and explicitly cleared the purchase gate: accept `region1.analytics.google.com/g/collect` as the GA4 endpoint and the secondary conversion's `oid` as the transaction match. The earlier “another Google host” / `*.google-analytics.com` wording was too narrow. **No application regression; no tracking code or repository test changed.**

## Per-run observations

| Build | Run | GA4 /g/collect | /measurement/conversion | Frames | Reload adds | Same transaction |
|---|---:|---:|---:|---:|---:|---|
| release | 1 | 1 | 1 | 1 | 0 | Yes (oid) |
| release | 2 | 1 | 1 | 1 | 0 | Yes (oid) |
| release | 3 | 1 | 1 | 1 | 0 | Yes (oid) |
| baseline | 1 | 1 | 1 | 1 | 0 | Yes (oid) |
| baseline | 2 | 1 | 1 | 1 | 0 | Yes (oid) |
| baseline | 3 | 1 | 1 | 1 | 0 | Yes (oid) |

All six completed runs have one GA4 collect with `tid=G-FKP17EXNBX`, one purchase frame document, and zero additional purchase requests or frame documents after reload (five-second post-reload observation). Every GA4 collect has the expected client ID, transaction ID, value 76.4, GBP currency and `gcs=G111`.

## Cause pinned down

The original test counts every request whose `en` equals `purchase`, regardless of endpoint. Google's currently served tag emits both:

1. `region1.analytics.google.com/measurement/conversion`: `tid=G-FKP17EXNBX`, no literal `cid` or `ep.transaction_id`; instead **`gacid` equals the GA4 `cid`**, and **`oid` equals the GA4 `ep.transaction_id`**. Its `hn` is `www.googleadservices.com`.
2. `region1.analytics.google.com/g/collect`: one GA4 purchase with `cid` and `ep.transaction_id`.

Both are the same synthetic transaction. The measurement/conversion request arrives first by a few milliseconds. If the original poll sees both requests, its count is 2 instead of 1. If it sees the first request alone, `.find(en === purchase)` chooses that conversion request, whose literal `cid` is undefined. This reproduces and explains both earlier failure signatures without a duplicate GA4 collect or duplicate frame. Raw fields and arrival times are in the JSON receipts.

## Baseline provenance

- Vercel inspection and authenticated read-only deployment metadata confirm production `dpl_DyTwtgWCmASKbePetzNnczHsHsG1`, Ready/production, Git SHA **51bcb55f876bee285ce6821740bbf08d7a31c1aa**. See `deployment-source.json`.
- A new detached sparse checkout at that exact SHA was built with its own `npm ci` and full `npm run build`/postbuild, all passing: `/home/coding-agent/workspace/projects/instaplaque-live-purchase-baseline-20261107`. Output/artwork excluded. Checkout clean; over 70 GiB free.
- `baseline-provenance.json`, `baseline-install.log`, `baseline-build.log` record the baseline and built artifact hashes. The earlier docs-only live checkout was not relied on for these six completed observations.
- Release dist is the approved v2 + privacy application commit **391a642**, with docs-only HEAD cf3033a at investigation start. `public/google-purchase.js`, `public/google-purchase.html` and `services/googlePurchase.ts` are byte-identical to the deployed commit (`purchase-source-parity.json`). No regression/bisect/fix was indicated.

## Harness and evidence

The repository's `scripts/check-google-consent-network.mjs` was neither edited nor committed. SHA-256 remains `a24c27acc13f8ca38721e0e7ea8f8cfc192436ba579d78da201ca9e30861fa15`.

Only temporary copies in this evidence folder were changed. Only the paid-purchase fixture ran; all API, collection and payment requests were intercepted. Real public Google loader GETs were fetched, but **no measurement was delivered, no real order/session existed, and no DB/payment/email/WhatsApp/Ads/Merchant write occurred**.

- `diagnose-purchase.mjs` / `release-runs.json` / `baseline-runs.json`: initial strict-host observations abort at the requested hostname filter, capturing the unexpected regional host.
- `observe-purchase.mjs` / `observed-release-runs.json` / `observed-baseline-runs.json`: expanded passive endpoint capture, actual GA4 parsing, full conversion fields and reload observations. The `strictClearance` raw-field booleans record literal host/parameter checks; they do not normalize `oid` or `gacid`.
- Baseline run 1 initially hit an existing harness race: `_gcl_aw` was ready but `_ga` was not yet set at the immediate read. A temporary-copy-only readiness wait for `_ga` completed that one observation, without changing application behavior: `observe-purchase-cookie-ready.mjs`, `baseline-cookie-ready-run1.json`. Baseline runs 2/3 did not require repetition. Preliminary aborted observations are retained rather than erased.
- `six-run-summary.json` is the final complete three-release/three-baseline table, including normalized transaction/client matches and arrival times. Every request's requested host, path, tid, cid, ep.transaction_id, gcs and timestamp, plus every purchase-frame document load, is retained in the detailed receipts.

The separate `current-live-baseline` failure is a stale allowlist missing `/videos/memorial-plaques-20261106-v2.webp` and `.mp4`, already failing on live. That check was not changed and was not rerun as part of the purchase-only investigation.

## Release state

Purchase continuity is **CLEARED** by Cody's follow-up decision. Continue with the already-authorized staged production deployment (`--prod --skip-domain` under the shared lock), read-only hosted checks, one real unpaid checkout (maximum two AI calls and one checkout session), and read-only DB readback. No promotion; Cody reviews and promotes separately.

The stale video allowlist is a known live-baseline test issue, not a release blocker per Cody's instruction. Baseline run 1's cookie-readiness timing flake passed after a temporary-harness wait; it is recorded above, not hidden. Previous literal-gate verdict is retained as `VERDICT-literal-gate-superseded.md`.
