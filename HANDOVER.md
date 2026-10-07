# plaque-store-ai-proof-bench-experiment-2026-06-19: source and machine handover

## Admin list incident — 7 October 2026 (not deployed)

`codex/admin-list-timeout` fixes the confirmed order-list database timeout by
reading lightweight summaries and loading exact artwork only via the existing
single-order route. The primary records remain present. Read-only live summary
query, synthetic API regression, mobile/desktop UI checks, changed-graph typecheck
and build passed. Production is unchanged at `dpl_G6u7WTKDbg4SadWj9vJ4S77M4w9Q`.
See [the incident report](docs/admin-order-list-timeout-2026-10-07.md) for evidence,
scope and the remaining owner-authorised deployment step.

Owner follow-up: no initial auto-selection or artwork request. Details load only
after an order-row click; searching, sorting and reloading stay summary-only.
Switching rows cancels the previous in-flight detail request. Included on the same
task branch; production deployment remains outstanding.
Application commit: `eb54620ffee3d7be6c4c889e2feb57ea6b84d6b6` on
`codex/admin-list-timeout`. Changed-component/dependency typecheck, production
build and 390/1440 px request-count/retry/exact-proof browser checks passed.
No known failure in this change; authenticated production verification remains
pending an explicitly requested release.

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
