# plaque-store-ai-proof-bench-experiment-2026-06-19: source and machine handover

## Google ad clicks kept for GA4 — 15 October 2026, about 05:20 UTC

GA4's page address dropped `gclid` and the other Google click IDs, so ad clicks showed as `google / organic` and
sales could never be credited to the ads. `4c36a4e` on `codex/instaplaque-ad-click-attribution-20261015` keeps them.
Live READY `dpl_HQBYhNJxVhe5mcBrcKCBi7afd4Cp`; rollback `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7`. The GA4 property still
needs its Google Ads link (owner, as Ads admin). Read [the finding and release record](docs/google-ad-click-attribution-2026-10-15.md).

## Account corrections released — 13 October 2026, 14:56 UTC

Owner accepted the audit's proposed fixes. The existing live Stripe webhook now
has completed, expired and both asynchronous payment events, independently read
back with all other endpoint settings preserved. Application
`0937ccb67ba1410dea2b5a3b06f0f8e582606a5e` on
`codex/instaplaque-account-fixes-20261013` excludes marked live/no-fulfilment tests
from Google purchases and corrects private-test wording. CI38416357936 passed;
canonical READY `dpl_FoYyYzAjsD959FFdzVcWPJUy3CG7`, 13 public hashes match the
verified candidate. Ordinary purchases and Meta/consent behaviour are retained.
Actual webhook/Google/email receipt remains unverified. Extra methods, old-order
corrections, replacement address and campaign changes remain held. Read
[the release and rollback record](docs/account-corrections-2026-10-13.md).

## Site audit fixes - 13 October 2026

Owner authorised careful fixes and release. Task branch
`codex/instaplaque-audit-fixes-20261013` includes the pending Consent Mode changes
and verified production source. Security/lifecycle/rate migrations already
applied to the migrated Supabase project; both other-brand cron jobs retained.
See [scope, tests, remaining account work and rollback](docs/site-audit-fixes-2026-10-13.md).
Application `57e09c6ab7f5c572694e3eb2c051d5900c816f29` is live on canonical at
READY `dpl_24YZazbstYN3S9EgkrtGhTdA6ZNZ`. PR18 / CI38407857350 pass (CI-only
follow-up `1330232bd5fe035ca8160d72c0349c38fa060dc6` has identical application
code). Hosted asset hash, health, route HTML, mobile proof form and private RPC
permissions verified. The existing admin status compatibility issue was also
fixed by additive migration `20261013160000` after rollback testing; historical
orders are unchanged. See the report for account-access gaps and rollback.

## Consent follow-up Tasks2–4 — 13 October 2026

Owner4527 requests purchase audit, Cookies/Privacy wording and real consent
checks. Application/checkpoint `f9a459bd53faa4fc3aa6bff4eb435bf876c6289f` on
`codex/instaplaque-consent-v2-20261013` passes
[CI38399150001](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38399150001).
**Prepared, not deployed.** Continue PR17; no new checkout/dependency copy.

Real public Google JS with ALL collection intercepted verifies G100/no Google
cookies, native-link gclid/_gl passthrough, later G111/cookies, withdrawal and
private exclusions. Fixed bare public React pushState navigation dropping click
IDs, with no storage/private reference copying; designer/refresh regression
passes. Exact Task1 index block and Meta/banner/purchase code are unchanged.
Policies now distinguish public cookieless Google measurement from optional
cookies; PostHog/Vercel/Meta and the purchase event remain opt-in.

Purchase actually sends GA4 `purchase` to `G-FKP17EXNBX`, not direct Ads
`AW-18288208905/LABEL`. GBP paid amount, stable digest, original GA client and
unchanged landing `_gcl_aw` are verified; reload dedupe passes. The purchase
request itself does not contain TEST123. October9 notes describe a GA4-imported
Ads action; no fresh import/account receipt is verified. Do not invent a label
or claim rejected-consent purchases work. Live baseline still has old consent
gate. See [exact audit, wording and evidence](docs/google-consent-audit-2026-10-13.md).

## Google Consent Mode v2 preparation — 13 October 2026

Owner4526 supplies the exact public Google tag replacement and asks for remaining
React consent gates, explicitly retaining Meta opt-in. Work is on
`codex/instaplaque-consent-v2-20261013`, based on product-policy docs checkpoint
`2c5cd37` and independently verified live `dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`.
The exact block is first in head; public Google loading no longer waits for
consent, while denied defaults, events, URL redaction and private exclusions
remain. The sole ga-disable assignment is removed with the old block.

**Prepared, pushed and tested; not deployed.** Application/checkpoint
`d0891021c881e910c24da5128490fecdf370f665` passed
[CI38397272755](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38397272755):
typecheck/build, exact source/generated script order, real built React banner
Accept/Reject/saved choices, and catalogue/designer regressions. Google/Meta
delivery was locally stubbed. [PR17](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/17)
targets the live-source product-policy branch. No new permission to publish was
inferred from the code-only Task1 request. The separate Google purchase helper/frame
still requires `instaplaque-meta-consent=yes` and is unchanged. This is not a full
purchase-modelling or Ads-receipt fix. Meta/banner/PostHog and all checkout code
are unchanged. See [scope, audit and checks](docs/google-consent-v2-2026-10-13.md).

## Latest production release — 13 October 2026, product policy metadata

Owner4516 requested fixing the live site's yellow shipping/returns/delivery
warnings. Application `f7dcff058c885b3566e71b9e6b805f0f2bb6ebd6` on branch
`codex/instaplaque-product-policies-20261013` is deployed/promoted as
`dpl_g23QYg6DYBEnv8AhHpJRkhGNqa6b`:
https://instaplaque-o8s9f1cn5-dullaghan31-3959s-projects.vercel.app.
Canonical READY identity independently verified. At11:23UTC all22 public checks
matched the protected candidate, including catalogue/policy HTML and
`index-CpAc9MaU.js`/`index-Bxw_YNF_.css` matching exact-source CI.

Existing Merchant policies were read, not changed: GB free shipping, weekday
handling/transit, one-day transit, existing personalised-plaque returns policy.
Initial/client physical-product data now consistently carries those policies,
with exact variant production estimates and the5–15day family range. The
existing delivery guide describes the already-approved carrier-service estimate.
No pricing/feed/checkout/tracking or designer layout change. Returns wording and
designer body match the predecessor; public feed is byte-identical.

CI38389208807 passed full typecheck/build, all360 physical Offer occurrences
across181 pages,175 catalogue/feed variants,11 hydrated product/catalogue routes
plus policy/designer routes, and the existing five-viewport/no-JS popup checks.
Vercel build and public read-only HTTP/hash checks passed. No fresh hosted browser
on the memory-constrained VPS. Google warning clearance awaits its recrawl and
owner's Validate fix; no Search Console submission was performed.
See [release evidence and rollback](docs/product-policies-2026-10-13.md).

## Previous production release — 13 October 2026, designer FAQ pop-up

Owner message 4495 corrected the published presentation: no added designer page
scrolling; help should open on click in a pop-up/expander. Publication authority
from message 4488 carries through this requested correction.
Application `588afdb38957333c873a2acf3c4743c764111069` is deployed/promoted as
`dpl_6o1LFnmir5w6VjKZdgqt5bRAotAu`:
https://instaplaque-o99inec90-dullaghan31-3959s-projects.vercel.app.
Canonical READY identity and candidate/public artifact equality were verified
at 10:11 UTC. The live JS is `index-BGL2dIT7.js`, CSS `index-Bxw_YNF_.css`;
both names match the exact-source browser-tested CI build.

Guide & FAQs now opens a native modal, closed initially, with expandable FAQs
first and a separate tips/examples disclosure. Close, Escape, backdrop and
return actions restore focus and preserve the inscription, step and URL.
The designer main is fixed; only the dialog's reading area and existing control
panels scroll. Shared initial HTML and a readable no-JavaScript fallback retain
the SEO content. CI run 38380879128 passed typecheck/build/SEO and browser checks
at 320/390/820/1440 widths, short landscape and no-JavaScript. Mobile/desktop
screenshots inspected. The checks caught and fixed keyboard-boundary behaviour;
layout checks explicitly finish the pre-existing entrance animation.

Vercel build/static checks, hosted assets/images/sitemap and read-only backend
checks passed; no new live browser was launched on the memory-constrained VPS.
No Ads, database, payment, analytics configuration, PIM or indexing changes.
Immediate code rollback is prior `dpl_55MasQFh4ss1hW2kmJtTqvYVor51`, but that
restores the scrollable guide the owner rejected. See
[release evidence](docs/designer-seo-2026-10-13.md).

## Earlier production release — 13 October 2026, initial designer SEO

Owner message 4488 explicitly requested publication. Application source
`37c841974dc6b8fc33f6762d40be8d2896da6688` on
`codex/instaplaque-design-seo-20261013` is deployed and promoted as
`dpl_55MasQFh4ss1hW2kmJtTqvYVor51`:
https://instaplaque-f2nyd823o-dullaghan31-3959s-projects.vercel.app.
Independent canonical inspection confirms this READY deployment. At 09:48 UTC,
canonical and www `/design` returned the verified candidate's identical HTML,
`index-BjtrW2fO.js` and `index-DhjswPCu.css`; www redirects to the canonical host.
All three guide images, sitemap, robots and backend health/config checks passed.

The exact application revision had already passed full CI including mobile,
tablet, desktop and no-JavaScript interaction checks. Vercel's cloud build and
static SEO checks also passed. No additional local browser/build was started
because account memory remained above 3 GiB; hosted verification used read-only
HTTP checks and artifact hashes, not a fresh live-browser interaction run.
No database writes, payments, analytics configuration, ads, PIM changes or Google
indexing request occurred. Code-only rollback: promote the previous deployment
`dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi` through the existing InstaPlaque project.
See [the release evidence](docs/designer-seo-2026-10-13.md).

## Designer SEO preparation — 13 October 2026, before publication

Owner requested improvements to `/design`. Work is on
`codex/instaplaque-design-seo-20261013`, based on the verified live PostHog
release and handover checkpoint `8822391`. Production was independently checked
at `dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`, serving `index-BNGuODZU.js`.
The shared guide includes useful instructions, illustrative examples, material
links and FAQs in both initial HTML and the interactive page, without displacing
the full-height designer. Metadata and application/breadcrumb schema use one
source. The sitemap entry records the content update and its example images.

Typecheck, production build, static SEO and browser checks passed on the existing
pull-request CI runner, including 320/390/820/1440 widths and no-JavaScript
reading. Initial/client content and metadata match; guide navigation retains
wording and URL state. Screenshots were recovered and inspected; capture was
then adjusted to finish the existing fade-in animation before saving the image.
See [draft PR 15](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/15).
CI is used because the VPS account is above its 3 GiB headroom threshold. No local heavy job, live AI
call, customer action, analytics event, deployment or indexing submission is
part of the checks. Git deployment remains disabled. See
`docs/designer-seo-2026-10-13.md` for evidence and release next steps.

## Latest production release — 12 October 2026, consented PostHog analytics

Application source `c02abb4ba1bea240741a9435da2d1362df9f00da`, branch
`codex/instaplaque-posthog-20261012`, was reviewed, pushed, built as a protected
production candidate, verified, then promoted to
`dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`. Independent canonical inspection and both
canonical/www HTML confirm `index-BNGuODZU.js`. Candidate asset bytes matched
the tested build. Hosted synthetic proof save/read verified target Supabase
`fygweiynqkglmjwqlouc` and private R2; only its own fixture/objects were removed.

PostHog EU project 303026 now has an InstaPlaque-only dashboard 1017503 with
14 tiles and daily subscription 51654 to sales@tradeetching.com at 08:00 UTC,
starting 13 October. Ten exact rolling-24h charts, selected preceding-24h
comparisons, no AI summary/replay/upgrades/action alerts. Existing Sample Studio
subscription is untouched. Production QA ingestion (one visit, three pageviews,
one product view, one designer start and three steps) reconciled with native
charts and the event log; all nine events are unique and excluded from reports.
Ordinary report counts were zero at initial verification; no history backfill.

Typecheck, local/cloud builds, new analytics tests, Google purchase regression,
design-request/checkout/input-security checks and intercepted browser fixtures
passed. No real enquiry, payment, generation or customer notification was sent.
The owner-authorised first report completed in PostHog at 15:12:35 UTC with all
ten chart exports; per-recipient provider/inbox receipt is not exposed. See the
detailed release document. Do not send another without checking
the existing delivery history. Purchases require a consented paid return and
are not the full accounting ledger. New analytics permission is required;
legacy advertising acceptance alone does not activate PostHog.

Read [tracking, verification and limitations](docs/posthog-analytics-2026-10-12.md)
and [saved dashboard/subscription configuration](docs/posthog-dashboard-2026-10-12.json).
No backend environment was changed. Code-only rollback to
`dpl_6XcsgpUTxk5AG5uE9sG6xQg4Pf2H` retains migration/payment compatibility but
removes the new tracking and restores the earlier consent behaviour.

## Latest production release — 10 October 2026, £1 test designer entry

Owner message 3874 requested removal of the oversized quote obstacle for the
123 × 456 mm live checkout test. Isolated branch
`codex/instaplaque-test-designer-20261010` adds the exact-size designer/checkout
link to the existing owner-authenticated test page. Server payment, quote,
production and email guards remain. Unit/canonical checkout, TypeScript, build
and both mobile fixture suites passed. Application source
`d13eaf630c2fb6df879bf34281f2407c16dd5fdf` is deployed at READY
`dpl_6XcsgpUTxk5AG5uE9sG6xQg4Pf2H`. Public canonical/www serve the tested
`index-BU8PILNh.js`; hosted mobile fixture routing and ordinary-size regressions
passed with APIs mocked and external traffic blocked. Owner API401, private-file
hashes/headers, live payment configuration and backend health passed. No actual
payment/order write/email/Google receipt or Ads activation was performed.
Read [the correction and release record](docs/one-pound-designer-2026-10-10.md).

## Latest production release — 9 October 2026, owner-requested £1 live checkout

Owner message 3870 explicitly corrected the sandbox setup to an actual £1 live
payment. Work is isolated on `codex/instaplaque-live-pound-20261009`, based on the
sandbox deployment and docs checkpoint `9825fae88536fceaff2de20b8b56d2217f0c6570`.
See [the live checkout contract and release record](docs/one-pound-live-2026-10-09.md).
The earlier request to add `STRIPE_TEST_SECRET_KEY` is obsolete for this task.
Existing live keys are used; owner-auth/exact-size/production/email guards remain.
The owner enters their own card on Stripe. No Ads enabling is authorised.

Deployed source `5c84d666220c945d520d767ef6765732f416f231` at READY
`dpl_C2T7RfDVjnCyqNKituKMQxzXDx7X`. Canonical/www independently verified; hosted
`index-BCMhDUUS.js`, private page and Google frame hashes/headers match. Owner-only
API401, live Stripe configuration and Supabase/Gemini health passed. Unit,
canonical-checkout, purchase/privacy/consent/dedup, TypeScript, local/remote build
and mobile built-app fixture checks passed. No actual payment/order write/email
or Google receipt was performed. Next: owner signs in at `/checkout-test.html`,
allows measurement if desired, pays £1 with their own card and returns to the
confirmation page. Do not revert to sandbox-only or older unguarded code after a
live verification record exists; retain both production/email guards.

## Latest production release — 9 October 2026, purchase tracking

Owner explicitly requested Deploy after reviewing the prepared fix. Released
source 3a39b2c7a1acf4eba56598db7229c8c0cd28c090 from branch
codex/instaplaque-purchase-tracking-20261009 to the existing InstaPlaque project.
Canonical/www independently resolve to READY dpl_D4AADmY5ReLfHXXNvYYKAdTt1y7Z.
Main bundle index-0AfWYGxb.js and both purchase-frame files match the tested
build/source; frame noindex/no-referrer/no-store headers passed.
Implementation/test commit: f78a935963e994e5e49776850701c9f4066b7edd.
Focused TypeScript, purchase/Meta/redaction checks, production builds and five
real-Google-tag browser cases with collection intercepted passed. Four further
mobile cases using the actual hosted compiled app passed with synthetic order
responses and all collection blocked: paid one, unpaid/test/rejected zero;
reload no duplicate, correct GBP/value/client ID and no private outbound values.
No Ads enabling, payment/order/database mutation, customer message or artificial
Google sale was performed. Ads account/property mapping and genuine receipt are
still unverified; do not claim end-to-end credited sales. See
[the tracking report](docs/google-purchase-tracking-2026-10-09.md).
Compatible previous deployment: dpl_8AR2RibDg36LohHmwHa4qjiQmzrx. Both retain
the address-free footer and current Supabase/R2 setup. PIM is unchanged.

26 September 2026; housekeeping only. No deployment, runtime restart, database/storage/payment change, customer message or paid generation performed.

## Verified sources

- Repository: https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19
- Development baseline: `dev/verified-live`, source `9dc89f2ba7bc00983847d7f72931d18df59b550f` plus documentation and a Git auto-deployment guard. GitHub default may be set to this branch only after confirming all publishing triggers are separated.
- Live revision/evidence: ce2eecb787c0d8b59d5fd7ab03345d04b3ba8081
- URL: https://instaplaque.co.uk
- Platform/project: Vercel instaplaque / prj_e0enz36tdUE3mI8q3tKKG9YR5CLD / dpl_Etuo1oBDAerk7nFgXVa4qfCona2h
- Windows baseline worktree: `C:/Users/trade/Documents/Codex/2026-09-26/please-audit-and-tidy-all-our/work/checkouts/instaplaque-baseline`. Original working copies and all branches are preserved.

Live alias and metadata verified 26 September. Base 9dc89f2 adds handover documentation only. Existing GitHub main is 17 commits behind this source and is not the starting point. Cody codex/cody-start and Windows codex/seo-review at fdec484 predate migration: never deploy them unchanged. Active shared Supabase is fygweiynqkglmjwqlouc and new artwork is private R2. Preserve the same migration on PIM. Read docs/supabase-r2-handover-2026-09-21.md before backend work; older setup notes are obsolete. Historical retained artwork/data and full paid/customer browser journeys were not retested.

## Setup, secrets and checks

Read README.md and DEPLOYMENT.md; install Node/dependencies locally with npm ci, then npm run typecheck and npm run build in an isolated worktree. Do not run database/storage checks that create fixtures as part of this housekeeping task.

Vercel production environment and existing encrypted workstation stores described in the migration handover. Retrieve through the existing authorised account/wrappers; no .env transfer. Required migration names include SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, ARTWORK_STORAGE_PROVIDER, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY. Other checkout/payment/email/generation variables are listed by name in DEPLOYMENT.md and .env.example.

Source-referenced environment names (required versus optional is defined by the setup/code): `ADMIN_ACCESS_TOKEN`, `ADMIN_AUTH_SECRET`, `ADMIN_ORDER_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_HOURS`, `API_KEY`, `APP_URL`, `ARTWORK_STORAGE_PROVIDER`, `CASE_LIMIT`, `CHROMIUM_EXECUTABLE`, `DEV`, `FORCE`, `GEMINI_API_KEY`, `GEMINI_PUBLIC_PROXY_ENABLED`, `GEMINI_RATE_LIMIT_UNITS_PER_MINUTE`, `GENERATE_TIMEOUT_MS`, `GOOGLE_API_KEY`, `HOST`, `LAYOUT_EXPERIMENT_OUT`, `LIMIT`, `NODE_ENV`, `ORDER_ADMIN_EMAIL`, `ORDER_EMAIL_FROM`, `PLAQUE_APP_URL`, `PORT`, `PUBLIC_REVIEW_URL`, `PUBLIC_SITE_URL`, `R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`, `R2_SECRET_ACCESS_KEY`, `RESEND_API_KEY`, `REVIEW_FOLLOWUP_CHECK_INTERVAL_MS`, `REVIEW_FOLLOWUP_DAYS`, `REVIEW_URL`, `SEMANTIC_LAYOUT_EXPERIMENT`, `SLUGS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `TEST_ADMIN_PASSWORD`, `VERCEL`, `VITE_AI_SEMANTIC_LAYOUT_EXPERIMENT`, `VITE_STRIPE_PUBLISHABLE_KEY`. No secret values belong in this document.

This housekeeping commit changes documentation and disables Git-triggered Vercel deployment on this branch. Review staged diff and secret-scan the new changes. Historical validation remains historical unless separately recorded as rerun in the central audit; no end-to-end live purchase/generation claim is made.

## Deployment and rollback

Vercel Git integration still targets its previously configured production branch. This development branch includes `git.deploymentEnabled=false`; keep it inherited on task/WIP branches so pushes cannot publish sites. Repository hooks and workflows must also be checked. Do not push old branch tips without a separate trigger review.

Explicit request only: follow DEPLOYMENT.md using the existing instaplaque project. Recheck the emitted deployment and alias. Do not roll back to pre-R2 code: any rollback must retain target DB records and compatible R2 readers. A Vercel rollback to dpl_Etuo1oBDAerk7nFgXVa4qfCona2h is code-only and still needs separate review/authorisation.

## Other machine / outstanding work

Use an independent task worktree from the development baseline. Do not switch a checkout used by a running service. The original Windows and VPS worktrees, unfinished files, experimental branches and private output remain preserved; consult the central repository/branch inventory before reconciling them. Fetch before starting and leave branch/SHA/checks/next step before switching machines.

## Working between Windows and Cody's VPS

- At task start run `git status --short --branch`, `git fetch --no-recurse-submodules origin`, read HANDOVER.md and compare remote branches with work from the other machine. Never infer production from main, the latest commit, or the latest deployment.
- Use a task branch and preferably a separate worktree. Do not edit the same branch concurrently on both machines. Keep source checkouts used by a running service unchanged; use the separate development worktree.
- Preserve all existing edits, stashes and branches. No hard reset, force push, branch deletion or overwriting another machine's work. Label unfinished work with a wip/ branch and notes.
- Commit at meaningful checkpoints. Review staged diffs and scan for secrets before pushing. Never commit credentials, real .env files, customer data, backups, machine state, dependencies or generated private artifacts. New repositories must be private.
- Check every deployment integration and workflow before a push, merge or default-branch change. Push only to branches known not to publish a site. Repository housekeeping never authorises deployment.
- Before switching machines or ending a task, push reviewed safe work and leave a short handover recording branch, full SHA, checks, known failures and next step. Say clearly when work is incomplete or a push is blocked.
- Merge only verified work. Deploy only when explicitly requested; then record and independently verify the live revision/alias or installed runtime hashes. Preserve separate bot identities and credentials.
- Install dependencies independently on each machine. Retrieve secrets through the existing project/service-specific secret store; do not copy node_modules, virtual environments or machine environment files between computers.

## New design-route review checkpoint (26 September 2026)

Work continues on `codex/design-routes-instructions`, not the production branch.
See `docs/design-routes-2026-09-26.md` for routes, instruction-based editing,
manual safeguards, checks and limits. Changes are review-only, not deployed.
Fetch that branch to continue; do not assume this older baseline contains it.

## Production release 26 September 2026, 17:32 UTC
Owner authorised release of `codex/design-routes-instructions` at
`3e800129b255c024563bbbac6916e28ad53b813a`. Live canonical/www aliases verified on
`dpl_EG7t1wV91VTJJHeHUqWuDvmDET2A`; see the latest release section in
`docs/design-routes-2026-09-26.md` for live checks and remaining inbox-confirmation
limit. Earlier production identifiers above are the previous release, not current.
Retains existing Supabase/R2 configuration; no database or payment change.

## Bench clearance production correction — 26 September 2026, 17:58 UTC
Current live source is `1cc8f618d28c2fd7244025b04040506d4ea3f722`, branch
`codex/bench-fixing-clearance`, worktree `projects/instaplaque-bench-clearance`.
Production `dpl_2w9RiMretPaTdbxjCqGHFyTeBaCe` READY and canonical/www aliases
independently verified. Supersedes the 17:32 release above. Hosted390/1440 bench
fixing changes and3Doutlining passed;400localgeometry cases/typecheck/build pass.
No live AI generation, email, database writes or payments during this correction.
Rollback compatible previous release: `dpl_EG7t1wV91VTJJHeHUqWuDvmDET2A`.

## Visual quality review release — 26 September 2026, 18:29 UTC
Current live application source is `7af33c155dd4d969e91be2ff08f59bd4a1e91161`,
branch `codex/layout-quality-review`, worktree `projects/instaplaque-layout-quality`.
Deployment `dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW` promoted after 10 fresh successful
AI cases; canonical and www independently resolve to this READY deployment.
16 baseline cases visually reviewed, 14 successful layouts replayed; 20 local
and hosted visual regressions pass, plus persistent failure-state check.
400 geometry cases, typography/security checks, typecheck/build passed.
See `docs/layout-quality-review-2026-09-26.md` for results, limitations and rollback.
No customer email, order, payment or database write by this review.

## MEDIUM release — 27 September 2026
Owner requested promotion. Current app source `730f7489e4454122853db478e7f37491dd787970`,
branch `codex/medium-live`, worktree `projects/instaplaque-medium-live`.
Canonical/www independently READY at `dpl_sM6tNv6rC2ouab27KDUzypd6P8qL`.
Server structured-content now MEDIUM/16,384; existing30s timeout, prompt and renderer unchanged.
Typecheck/build/security pass; fresh candidate2successful/1failed AI cases, public1first-pass success;4hosted mobile/desktop geometry checks pass. Dense portrait failure and browser interruption retained in release report.
See docs/medium-release-2026-09-27.md for scope, verification limits and rollback. No DB/order/email/payment change.

## Remove length-only quote gate — 27 September 2026
Current app source `e73db85e1e0993569be44aa55bfb33c21843da55`, branch `codex/remove-length-gate`, worktree `projects/instaplaque-remove-length-gate`.
Canonical/www READY at `dpl_MKer6sXvFh1U6HBNLKCAZgZdDAn7`. Removed only >360-character manual-quote condition from shared checkout policy; other quote rules, approval, pricing, MEDIUM and typography limits unchanged.
Server-checkout/typecheck/build pass; local+hosted390/1440 long-proof checkout interception passes. Live API deliberately unapproved long inscription passes quote gate then rejects before persistence. No orders/payments/DBwrites/email. See docs/remove-length-gate-2026-09-27.md.

## Progress and lettering limits — 27 September 2026
Current application source `c4e88cdfcc7e8dcf241f2303bb8da8a44d94f4c1`, branch `codex/layout-progress`, worktree `projects/instaplaque-layout-progress`.
Canonical/www independently READY at `dpl_3RyiPdtffNRKuy7vZT9p8WbCDapr`. Removed authored5-unit and dense8–10-unit floors, orphan aesthetic rejections and post-fit5.2 clamps; manual minimum now serialization precision0.01. Word preservation, overlap/containment, font export restrictions/security retained.
Always-visible generation card shows elapsed time and real retries/checks; MEDIUM16k and timeouts unchanged. Two fresh real-model long-text cases first-pass; visual/bounds/mobile checks pass. Hosted replay of both results and390/1440 progress tests passed. Typography/manual/typecheck/build pass. See docs/layout-progress-and-size-limits-2026-09-27.md. No orders/payments/DBwrites/email.

## Manual decimal entry correction — 27 September 2026
Current app cfbf876, branch codex/manual-input, worktree projects/instaplaque-manual-input. Canonical/www READY at dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E. Decimal typing fix; typecheck/build and local+hosted390/1440 manual controls pass. All prior MEDIUM, relaxed limits and progress changes retained. See docs/manual-controls-2026-09-27.md.

## Checkout return — 27 September 2026
App12bdb2cc3c6279c4a1d36435052a116e114da964, branch codex/checkout-return, worktree projects/instaplaque-checkout-return. Canonical/www independently READY at dpl_8PHYTHFtkg7Q555qMJq78nB6ipJw. Stripe cancellation now returns to designer final review/PDF; legacy checkout return links also restored. Uses existing protected order lookup/local artwork snapshot; missing local artwork fails with PDF-link recovery guidance. No payment completion/pricing/DB changes. See docs/checkout-return-2026-09-27.md. Previous compatible deployment dpl_5Ym9b3aPCaWcm8j234cMFJedHw4E.

## Merchant returns setup — 27 September 2026
Current app c9e5e808df07c08332cd12231e8159ac5fa262e0, branch codex/merchant-free-listings, worktree projects/instaplaque-merchant. Production dpl_8bykWxCwvMaK7hutvS74t6PK5TbZ canonical/www READY. Owner-approved no physical return for faulty plaques and agreed Stripe refunds within2working days; statutory remedies retained. Full policy now in initial HTML. Typecheck/build/staticHTML/local+hosted390/1440 passed. Merchant API connected5859684800; shipping/contact/return policy configured, product feed NOT submitted. See docs/merchant-setup-2026-09-27.md. Rollback dpl_8PHYTHFtkg7Q555qMJq78nB6ipJw.


## Whole-UK delivery — 27 September 2026
Owner confirmed delivery included throughout UK and will absorb regional costs. Updated customer copy, SEO/static HTML, PDF estimate, dispatch-email wording, feed service label and Stripe checkout label. Existing Stripe GB/zero shipping rate unchanged; Merchant independently read as free GB with no regional exclusion. No prices, production times or payment operations changed.
App5a86813 deployed to dpl_2P4ZCVFVDLfQ9tuEJwwPJV7P6gTt; canonical/www READY. Typecheck/build/server-checkout pass; all generated HTML scanned free of mainland restrictions; hosted home/how-it-works390/1440 wording/no-overflow/no-JS-error checks pass. Initial browser assertion incorrectly expected regional text on homepage rather than how-it-works; corrected route passed. Rollback dpl_8bykWxCwvMaK7hutvS74t6PK5TbZ. Product feed submission still pending image/configuration alignment, not shipping clarification.

## Merchant exact offers — 27 September 2026
Current application d10c7a3, codex/merchant-free-listings, projects/instaplaque-merchant. LIVE dpl_AY8iSJ4VovByE6KLztq9TPYL9DyG canonical/wwwREADY. Two exact products/image metadata/matching landing presets; typecheck/build/local+hosted390/1440 pass. Merchant datasource10749182094 GB/en FREE_LISTINGS only; first fetch accepted, approval not yet proved. See docs/merchant-setup-2026-09-27.md. Rollback previous2P4ZCVFVDLfQ9tuEJwwPJV7P6gTt.

## Full standard Merchant catalogue — 27 September 2026
Current application49cf41a, codex/merchant-free-listings, projects/instaplaque-merchant. LIVE dpl_4FynpLKygsk16TD1BcAu77v2SqWB canonical/www independentlyREADY.175 exact configurations with matched illustrations, prices, presets and production times. Typecheck/build/catalogue/feed checks pass;210local+22hosted browser checks; all175publicpages/images verified. Google corrected import SUCCEEDED175/noimportissues,101new+74previouslyaccepted. Initial import's overlengthIDs corrected preserving acceptedIDs. Google image crawl/policy review still pending; nonblocking unit-pricing-measure notices observed. No paid ads/orders/refunds/DBwrites. See docs/merchant-catalogue-expansion-2026-09-27.md. Rollback prior2offer dpl_AY8iSJ4VovByE6KLztq9TPYL9DyG and refetch same datasource10749182094.

## Homepage sister links — 27 September 2026

Current task worktree `projects/instaplaque-sister-links`, branch `codex/homepage-sister-links`, deployed `dpl_8JunknXiRQUxDcmur3WxgNrPyv8r`. See docs/homepage-sister-links-2026-09-27.md for checks and rollback.

## Wording proofreading — 28 September 2026
Task branch codex/wording-proofreading, app c0c4ae1, projects/instaplaque-sister-links. Live dpl_J7N13RYDfRXiY1k7VpfLRyZC7JL1 / https://instaplaque.co.uk. Generation now runs conservative spelling/capitalisation proofreading before exact-copy SVG composition, commits corrected editor text and proof together, and retains stale-result guards. Rejects empty/invalid responses and changed digit sequences. No proofreading on manual typography edits.
Checks: browser mocked success/date-change rejection/concurrent-edit preservation passed. Full tsc hit inherited512MB heap limit; narrowed tsconfig including changed App/services/Controls and imported app dependencies passed (temporary config removed). Cloud production build passed. Actual hosted mobile model flow: “in loving memory / Alex McDonald / 1950–2026 / forevr remebered” corrected to “In loving memory / Alex McDonald / 1950–2026 / Forever remembered”; both model requests200, corrected textarea matched, no overflow, screenshot checked. Synthetic wording only, no order/payment/email/customer save. Rollback prechange dpl_8JunknXiRQUxDcmur3WxgNrPyv8r.

## Memorial search page — 29 September 2026 (not deployed)

Task branch `codex/memorial-search-2026-09-29`, application change
`285213a5907bf0ad3f224152a8aebcb6d337330c`, based on the latest proofreading
release and its handover. Adds memorial buying guidance, wording examples,
catalogue-derived prices, contextual links and consistent search metadata.
Full typecheck, build, SEO/static-output checks and local 390/1440 browser review
passed. Merchant feed matches production byte-for-byte. No backend, PDF,
generation, payment or price change. See
[the task handover](docs/memorial-search-2026-09-29.md) for coverage and limitations.
Next: explicit owner deployment request, reconcile any newer production changes,
verify hosted release, then request a fresh Google crawl. Current production
remains the proofreading release above; no deployment or indexing request made.

## Memorial page release — 30 September 2026

Owner authorised deployment. Source `febbedd49335a5625930099c7c0557e0d95461ec`
is live at READY deployment `dpl_2nWrgrqHCDEMkhAe1HRTpVnDRJyg`; canonical and
www independently verified. Cloud build, public content/hashes and hosted
synthetic proof save/read through the target DB/private R2 passed; fixtures
cleaned up. See docs/memorial-search-2026-09-29.md. Supersedes the review-only
status above. No email, generation, order or payment by this release check.

## Circular plaque review — 30 September 2026 (not deployed)

Branch `codex/circle-plaque-fixes`, app `6cbac3678afeda7d2fd465ba8fc57237c5a77784`.
Two side fixings for round plaques including restored designs; smooth 3D rim
and matching face geometry; circular text area and generation guidance.
Typecheck/build, 160 geometry combinations, typography/checkout regressions,
one fresh model composition and local desktop/mobile/3D review passed.
See docs/circle-plaques-2026-09-30.md for scope, limitations and release next step.
The memorial page is live; Search Console accepted its fresh indexing request.
The circle correction awaits explicit publication approval.

## Circular plaque release — 30 September 2026

Owner explicitly requested publication. Branch `codex/circle-plaque-fixes`,
deployed source `f7edbf8b15cfce428e2ad6f0d995b5505e7d34d8`, is live at
`dpl_AJCwLEfhRCrqzeygG5D9Dd5a2ykr`; canonical and www independently READY.
Cloud build, authenticated candidate/public assets, live circle/3D review and
hosted synthetic proof save/read through target Supabase/private R2 passed;
fixtures cleaned up. Supersedes the review-only status above. Existing wording
needs Regenerate for new wrapping; legacy round fixings correct automatically.
See docs/circle-plaques-2026-09-30.md for coverage and rollback. No order,
payment or email was created; full purchase/PDF browser coverage remains open.

## Oval inscription layout — 30 September 2026 (not deployed)

Branch `codex/oval-plaque-layout`, application
`bc50c16274b2b8cc49a02e44eccc1facb2d68033`, extends per-line ellipse fitting
and curved wrapping to text-only ovals, with wide/upright composition guidance.
The published smooth rim and two side fixings already cover ovals. Full
typecheck/build, typography regressions, 160 hardware/24 oval geometry cases,
two fresh model compositions and local desktop/3D review passed. Mobile DOM
geometry passed; mobile screenshot capture failed. See
docs/oval-plaques-2026-09-30.md for coverage and limits. No deployment made;
next step is explicit publish approval followed by live reconciliation and
hosted proof verification. Preserve the migrated Supabase/private R2 setup.

## Oval fixing follow-up — 30 September 2026 (not deployed)

Same branch `codex/oval-plaque-layout`, application
`7d23d6364b4259237eab2b88cad5be8480516c49`, includes the oval text improvements.
Extreme shallow ovals could let 15mm caps cross the edge; ellipse-aware insets
now keep the whole fixing plus 2mm clearance on the metal. Two side fixings,
legacy state normalisation and shared SVG/3D positioning are retained.
640 additional oval hardware cases, existing 160 hardware/24 layout cases,
typecheck/build and a local restored-proof/cap-to-screw browser check passed.
See docs/oval-plaques-2026-09-30.md. Pushed for review; publication approval
and hosted release verification remain the next step.

## Generic cookie popup — 4 October 2026
Owner requested generic popup disappearing after selection. Source 75a8cab on codex/generic-cookie-popup deployed READY dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q to instaplaque.co.uk. Accept/Reject remove popup entirely; existing consent storage preserved. Cookie settings available on /cookies, policy instructions updated. Meta consent/checkout regression and local/cloud builds passed; local and public mobile-browser checks proved accept/reject dismissal, reload persistence and reopen/revoke. No order/payment/email. Other analytics unchanged. Prior deployment dpl_Fpfz2aemHnvnxT7CTEogF3eC9STK is code rollback.

## Text-layout API timeout — 7 October 2026 (not deployed)

`codex/layout-api-timeout`, based on `b65f997`, fixes the explicit 30-second
function ceiling observed in live 504 logs. Prepared 120-second ceiling,
110-second cancellable structured-text deadline, safe errors and bounded browser
waiting without repeated timeout calls. Model/MEDIUM/16k, layout safeguards and
image budgets retained. Delayed actual-handler/SDK test, eight mobile/desktop
timeout/success scenarios, input security, changed-app dependency typecheck and
build passed. See [the report](docs/layout-api-timeout-2026-10-07.md).
No hosted release or real model call made. Owner release instruction, live-source
reconciliation and hosted verification remain. The separately pushed
`codex/admin-list-timeout` is NOT part of this branch and remains undeployed.

Verified application/test/report commit: `d22771b35c64431e51549fa7927339addd463f5d`. All task test servers and browsers closed.

## Text-layout timeout release — 7 October 2026

Owner explicitly requested deployment. Source
`b50123bb95087e360ca8c66d03aa5cfc1c4c0e9f` deployed and promoted to
`dpl_FR2heHpEJmvjoS7eP4GwGAf5nRKC`; canonical/www independently READY. This
supersedes the not-deployed status above. Cloud build/health passed and deployment
metadata confirms 120-second function duration. Hosted synthetic proofreading
and composition/repair returned 200 in 3.939s/35.625s/24.275s; final eight-line
proof passed exact-wording/dates, face bounds and 390/1440px browser checks.
One existing layout repair was required; no local fallback. Hosted JS hash matches
the tested build. No customer/order/DB/payment/email/PIM change. All jobs closed.
`codex/admin-list-timeout` remains separate and undeployed. See the
[release report](docs/layout-api-timeout-2026-10-07.md) for rollback and evidence.

## Postal-address removal — 9 October 2026

Owner requested live removal of the current business postal address from both
brands, including outgoing emails, pending a replacement tomorrow. InstaPlaque
app `48954736dbc179cc850957ec5d2bee1a625ad824`, branch
`codex/remove-postal-address-20261009`, is live on canonical/www at READY
`dpl_8AR2RibDg36LohHmwHa4qjiQmzrx`. All footer variants now say Made in the UK;
Contact/About/Terms and structured data have no postal address. Customer email
footers match; customer delivery addresses are retained. Eight offline email
renders, focused UI typecheck, cloud build/runtime/prerender, 26 live routes and
390/1440 browser checks passed. No customer mail, payment or DB mutation. PIM
was separately released from its current source. Do not restore an old address
from historical notes. See [the report](docs/postal-address-removal-2026-10-09.md).

## 9 October 2026 — private exact-size £1 sandbox setup

Owner 3860 requested a 123 × 456 mm £1 test, replying to the sandbox proposal. Prepared on `codex/instaplaque-pound-test-20261009` from the independently confirmed purchase-tracking production release plus docs-only checkpoint. Read [the scope, tests, missing test key and rollback limits](docs/one-pound-sandbox-2026-10-09.md).

This is an owner-authenticated test route, not a public price change. No live key change, real payment, customer email, manufacture or Ads launch. **STRIPE_TEST_SECRET_KEY is missing**: the API fails before writing an order, and the page stays disabled. GA4/Ads receipt is not established by the mocked return checks. Deployment result is recorded below when verified.

Published app `740c388a7a95aad4c7e6a53b50f67eb3f64e4fb7` to READY `dpl_4JT7pZiR1Whe55C6aW7mEhE9E2N8`; independent canonical inspect, hosted asset hashes/headers, owner-auth 401, unchanged live Stripe mode and health checks passed. Private setup is at `https://instaplaque.co.uk/checkout-test.html`. **Still waiting for STRIPE_TEST_SECRET_KEY in Vercel**; no actual sandbox payment has been made. Owner should add only the separate test key (Production/Sensitive) and tell Cody saved; redeploy guarded code and prove test checkout next. Existing live keys and Ads are unchanged.
