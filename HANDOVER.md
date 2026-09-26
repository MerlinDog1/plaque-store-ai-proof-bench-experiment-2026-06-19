# plaque-store-ai-proof-bench-experiment-2026-06-19: source and machine handover

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
