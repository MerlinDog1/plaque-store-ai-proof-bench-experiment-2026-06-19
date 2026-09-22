# Supabase and R2 migration handover

Cutover verified **21 September 2026**; handover written **22 September 2026**. These are the recorded cutover results, not a claim that production was rechecked today. Read this before deploying, changing database connections or interpreting older setup notes.

## Shared backend and ownership

Instaplaque and Portraits in Metal moved together to a fresh **Free** Supabase project. No Pro upgrade or organisation transfer was performed.

| Service | Recorded configuration |
| --- | --- |
| Active Supabase | `fygweiynqkglmjwqlouc`, eu-west-1, TRADE ETCH (`aakqyqzmvflxlueaelte`), account `sales@tradeetching.com` |
| Previous Supabase | `ovkmakyumixawyhytgym`, org `zkedpxtuheqqikifwawl`, account `laser2etch@gmail.com`; retained, quota restricted |
| Cloudflare R2 | Account `etsysign2600@gmail.com`, ID `d844912202f1e4590f683e78980f8109` |
| Instaplaque release | `ce2eecb`, Vercel `dpl_Etuo1oBDAerk7nFgXVa4qfCona2h`, https://instaplaque.co.uk |
| PIM website release | `38af0a0`, Vercel `dpl_J9qHw2gc58RtQ77aFmrh6uAtmdZM`, https://portraitsinmetal.com |
| PIM VPS broker release | `6f984d2`, based on installed `6d0ce7f`, branch `codex/r2-broker-migration` |

The website implementation branches are `codex/supabase-r2-migration` in both repositories. They were pushed separately from the default branches. A default-branch checkout or an older local checkout is not evidence of the deployed source. Fetch and inspect current branches and deployments before continuing; preserve unrelated working changes.

## Data decisions and recovery

A logical schema/data/roles backup and migration history were retained privately. All **54 application/Auth table counts and content digests matched** after restoration; the source was unchanged immediately before cutover. The final target comparison differed only by one synthetic `pim_rate_limits` row, which expires normally. Retained records include 69 Instaplaque orders, 194 proof sessions, 29 PIM requests, four PIM orders, one Auth user and 12 migration-history entries. Target database size was approximately 91.7 MB.

The owner confirmed all existing artwork was test material and waived copying it. **No historical Supabase Storage objects were copied or deleted.** The 309 source objects (2,091,921,900 bytes) remain on the old project. Historical PIM test records can therefore reference unavailable artwork; do not replay their jobs to repair them. Existing Instaplaque inline artwork remains readable and is offloaded when saved again.

Target Supabase Storage and R2 were empty after synthetic-test cleanup. New artwork now goes to private R2. Neither the source project nor its application records were deleted. The old project's quota restriction remains. There were no custom source Auth triggers or Realtime publication tables; these sites retain their application authentication rather than relying on Supabase browser sign-in.

## Storage and credentials

Production uses server-only `ARTWORK_STORAGE_PROVIDER=r2`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`. Instaplaque's `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` also point to the target. Never expose the service-role or R2 keys in browser variables.

The S3 endpoint is `https://d844912202f1e4590f683e78980f8109.r2.cloudflarestorage.com`. Eleven private Standard buckets were created: `customer-uploads`, `email-assets`, `material-assets`, `order-proofs`, `order-uploads`, `production-artifacts`, `proof-artifacts`, `etchmaster-saas-preview`, `pim-studio-artwork`, `pim-proof-assets` and `pim-customer-uploads`. No public storage domain is enabled. The application S3 token is restricted to these buckets.

Instaplaque writes through its server to `order-proofs`. PIM uses its three `pim-*` buckets; browser CORS permits only `https://portraitsinmetal.com` and `https://portraits-in-metal.vercel.app`. A preview origin needs an explicitly approved CORS entry.

The owner approved R2 activation and usage overages. The recorded free allowance was 10 GB-month storage, one million Class A and ten million Class B operations monthly, with free egress; this is not an unlimited zero-cost promise. Supabase Free limits still apply. Recheck provider pricing before making later cost decisions.

Secrets are in Vercel and private local stores, never this repository. The migration workstation's separate workspace, `INSTAPLAQUE & OIM SUPABASE MIGRATION`, contains `ACCESS.md`, credential wrappers, ignored private backups and verification inventories. Its target credentials are Windows-DPAPI encrypted under `%LOCALAPPDATA%/CodexMigration/supabase-tradeetch`; R2 credentials are under `%LOCALAPPDATA%/CodexMigration/r2`. The old default Supabase CLI profile/local env may still select the source: verify the target explicitly before a write. Vercel's `[SENSITIVE]` output is a placeholder, not a usable secret.

## Scheduled work and launch modes

Source `pim-workflow-five-minutes` is inactive; the target job is active on `*/5 * * * *`. Its existing `pim_worker_secret` was copied into target Vault without rotating the web `CRON_SECRET`. It calls `https://portraits-in-metal.vercel.app/api/jobs`. The first target scheduled run at **11:15 UTC on 21 September** succeeded with HTTP 200. Keep exactly one active worker; do not re-enable the source job.

PIM public intake remains closed in studio-test mode, email remains redirected, and payment configuration remains live. Migration did not authorise launch, customer messages, replaying old jobs or charging a test payment.

## Verification and remaining gap

Both canonical homepages returned 200 and their www aliases redirected correctly. PIM database/private-storage health passed on both domains; Instaplaque health identified the target project. Hosted checks saved/reloaded an Instaplaque proof through the target DB/R2 and uploaded a PIM photograph through an actual signed R2 URL with matching bytes.

Automated database/storage, security and workflow checks passed, but **neither site completed a full post-migration browser customer journey** from a fresh design/photo through generation, proof approval, checkout and receipt delivery. The hosted PIM check stopped before completing intake. No customer email, paid image generation, Stripe charge or Telegram approval was triggered by these migration tests. Do not report end-to-end workflow coverage as complete.

## Rollback and EtchMaster

After new writes, rollback must preserve/reconcile target database records and R2 objects and retain compatible R2 readers. Merely disabling R2 or restoring an old deployment can lose access to new artwork and restore the restricted backend. Keep the source and private backups until separately authorised to remove them.

EtchMaster's migration is **deferred**. Its testing services were configured for project `rflsyhcflwqgoxcbgmgi` and private bucket `etchmaster-private`. **The owning Supabase account was not verified:** a different project ID does not establish a different account. No EtchMaster environment, service, deployment or data was changed. The old source's `etchmaster-saas-preview` bucket is historical test material, not proof of the current EtchMaster backend.

## Instaplaque implementation and next deployment

Read [the adapter notes](r2-storage-migration.md). `server/artwork-storage.mjs` offloads artwork to content-addressed, record-scoped keys and stores `r2-artwork:v1:...` references. Reads restore the original API and email-attachment shape. Uploads finish before DB references are committed; conditional writes, byte/hash verification and scope checks fail closed on missing or corrupt content. Retain the async order/proof hydration and immutable proof-attachment claim.

Validation included TypeScript, production build, checkout/security/input checks and `scripts/check-r2-artwork.mjs` against the actual target DB/R2. It covered retries, scope isolation, corrupt content, saved-proof hydration, attachment preparation and claim immutability; it cleaned up its own fixtures.

The Vercel project is `prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`, scope `dullaghan31-3959s-projects`. The pre-migration release was `fdec484`; do not redeploy that checkout unchanged. For a future release, retain the target environment and R2 adapter, run the relevant checks, then verify the emitted deployment and hosted proof save/read. A full browser purchase rehearsal remains a separate check requiring suitable payment and messaging arrangements.
