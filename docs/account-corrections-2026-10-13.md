# Account corrections — 13 October 2026

The owner accepted the preceding audit's proposed fixes (“ok do what must be
done”). Explicit holds on extra payment methods, historical order corrections
and replacement address remain. No campaign budgets, launch settings or other
businesses were changed.

## Completed

1. At 14:38 UTC, corrected the existing live Stripe endpoint
   `https://instaplaque.co.uk/api/webhooks/stripe` to retain
   `checkout.session.completed` and add `checkout.session.expired`,
   `checkout.session.async_payment_succeeded` and
   `checkout.session.async_payment_failed`. Only the event list was submitted.
   Independent account readback confirmed all four subscriptions; all other
   target fields and every other endpoint were unchanged. No second endpoint,
   secret rotation, historic replay, payment or order mutation.
2. Excluded `liveVerificationPolicy` and `noFulfilment` orders from the Google
   purchase helper, alongside the existing sandbox exclusion. This intentionally
   supersedes the earlier measurable GBP1 test. Price is not the filter:
   unmarked consented purchases still send their actual GBP amount and stable
   hashed transaction ID with existing duplicate suppression. Private test and
   confirmation wording now explicitly describe exclusion.

The public Consent Mode bootstrap, GA4 measurement frame, Meta consent code,
ordinary purchase consent gate, feed, sitemap and database are unchanged.

## Verification and release

- Application `0937ccb67ba1410dea2b5a3b06f0f8e582606a5e`, branch
  `codex/instaplaque-account-fixes-20261013`.
- [PR19](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/19).
- [CI38416357936](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38416357936)
  passed: full typecheck/build, lifecycle/security checks, consent/navigation,
  catalogue/designer checks, real-tag intercepted ordinary purchase and built
  marked-test accepted/rejected/reload flows. Test purchases never reached Google.
  Marked tests generated zero purchases, frames or queued-purchase markers.
- The first browser run needed its ordinary-sale fixture completed with a stored
  synthetic proof; it had previously relied on the private marked-test view.
  No application safeguard was relaxed. CI runs through its existing build hook;
  no workflow permission change was needed.
- Staged production build passed; authenticated candidate checks passed before
  promotion. At 14:56 UTC independent canonical inspection confirmed READY
  `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7` on https://instaplaque.co.uk.
- Public `index-CUCmfLK8.js` matches the CI asset name and contains the exact
  three-marker guard. All 13 public file/page hashes match the staged candidate.
  The public Google bootstrap, measurement frame, private-test consent script,
  merchant XML and sitemap match the pre-release baseline.

Rollback: promote `dpl_24YZazbstYN3S9EgkrtGhTdA6ZNZ` for the preceding code
release. That restores the previous test-measurement behaviour. Keep the
corrected Stripe subscriptions and existing additive database migrations.

## Still not verified

Correct subscriptions do not prove end-to-end webhook receipt. Post-correction
retained logs returned no webhook rows; no replay or fake purchase was made.
Extra methods remain pending genuine delivery evidence.

Browser control is disabled and no direct account/mail connector is available.
GA4 Admin access was blocked by `SERVICE_DISABLED`; Resend's known key is
sending-only. Current Google linkage/goals/imports/custom-goal bidding and
receipt/attribution remain unverified, as do Resend delivery/bounces and receipt
of the existing 08:00 UTC PostHog report at sales@tradeetching.com. No duplicate
subscription or test email was created. Existing report settings specify no AI
commentary. Historical orders and the replacement address remain on hold.

Sanitized API, CI, deployment and file-hash evidence is saved locally in
`projects/instaplaque-account-checks-20261013`; see its `FOLLOWUP.md`. No customer
records, credential values or private order links were added to this repository.
