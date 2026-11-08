# Cookie-free designer usage — preview only, 8 November 2026

Branch: `codex/instaplaque-usage-counter-20261108`, based on verified live source `f27cc5ef7e276636409e271bf3cf6a02afaba9c0`. No production deployment or environment change is authorized here.

## Contract

`services/designerUsage.ts` creates a crypto UUID in page memory. Statistics-off sends neither that ID nor usage events. Internal browsers remain visible only in test counts. No new cookie/storage/third-party destination. Existing preferences are read, not repurposed. Browser events are capped at 40 per document, keepalive, without retries or UI awaits.

`server/usage.mjs` records only explicit allow-listed fields after the HTTP response finishes, with Vercel `waitUntil`, a 2-second abort per storage request and generic one-line error handling. No visitor ID means no server event. Every AI POST records its browser-labelled step, status, duration and bounded error classification. A random operation UUID links proofreading/layout retries to the browser result; retries are not extra layouts. Paid rows look up the checkout row and use database uniqueness on `(event,order_id)`; no changes to order records or Stripe metadata.

Browser arrival fields are source label, campaign label and optional-cookie choice only. No click IDs, referrer URL, IP, full user-agent, wording, artwork, names/contact fields, proof tokens, prompts or replies. Server derives device class, bounded host geo, site and test flags. Campaign tags are unverified labels and must not contain personal information. Missing browser results remain unfinished, not successful. Missing browser context is shown as not received.

Proof PDF totals mean the server saved the PDF resume link; the download may subsequently fail. This subtotal is included in saved proofs. Cookie choice uses the latest received browser context, not proof-source metadata.

The real/default view excludes all preview/local/internal/tagged/admin-test rows. The switch shows tests *instead* of mixing them into real totals. London calendar days handle BST/GMT; recent visits are capped at 50. Admin reads use paginated REST, not Supabase's implicit 1,000-row limit.

## Storage and retention

One additive migration: `supabase/migrations/20261108100000_instaplaque_usage_events.sql`, applied to `fygweiynqkglmjwqlouc` through Cody's own Management API login in a single transaction after local tests/build passed. RLS enabled, zero policies, PUBLIC/anon/authenticated table and sequence privileges revoked. Service role only. No SQL functions added. No migration ledger row added, consistent with earlier direct InstaPlaque service-table migrations in this project. No PIM table touched.

Deletion of rows older than 13 calendar months runs best-effort on recording/admin reading, throttled to once per hour per warm process; no scheduled job. Quiet sites retain old rows until the next recording/admin read. Counting deliberately can lose events when storage or networks fail. It is not an accounting ledger.

Rollback (only if separately authorized to remove these counts): `BEGIN; DROP TABLE public.instaplaque_usage_events; COMMIT;`. This removes only the new usage table and its own sequence/indexes, not orders/proofs/PIM data.

## Checks and local environment discovery

`npm run check:usage` checks allowlists, body limits, opt-out, internal/test flags, every row shape, no device-storage access, 40-event cap, paid idempotency, London-day fixtures including retries, RLS, and actual HTTP AI/proof/email/enquiry/checkout/webhook routes with mocked upstreams and failing/hanging usage storage. No Stripe sessions/orders or email sends are used. Full build/postbuild and existing non-chargeable suites run separately.

Development Vercel Supabase values still point to retired `ovkmakyumixawyhytgym` (DNS failure). Development secrets were not altered. For this local proof only, a receipt-folder launcher obtained the current project's service-role key through Cody's authorized Management API login and injected URL/key into child-process memory; never printed, saved or copied from a checkout. Preview secret values cannot be downloaded; verify hosted persistence after deployment instead.

Six real AI calls in total (three before discovering the obsolete development DB, three after the local override), all paced at least 21 seconds apart. The successful run displayed one layout and one change and saved a synthetic PDF resume link. The QA harness initially blocked the existing PDF-library CDNs; downloading the same saved synthetic proof succeeded with those existing hosts allowed, with no further AI. Every resulting usage row was read back and inspected; all were local/test, with no forbidden fields. Two admin JPEGs (900/390 pixels wide) capture real authenticated usage data, not customer orders. Screenshot artifacts in legacy browser suites are disabled to respect the four-image task limit; glyph raster screenshots are not run.

Owner evidence/report: workspace `output/instaplaque-usage-counter-20261108/`. Privacy paragraph is proposed in this preview; the existing last-updated date is unchanged. Release requires the owner's approval of wording and deployment; this task must not promote.
