# InstaPlaque analytics — 12 October 2026

Built on `ca1f9458e50ac617ec59c816cc586b19ac7e83d7`, which contains the independently verified live application `d13eaf630c2fb6df879bf34281f2407c16dd5fdf`. Task branch: `codex/instaplaque-posthog-20261012`. The Supabase/R2 migration, checkout protection and separate £1 owner-test routes remain intact.

## Measurement contract

- PostHog EU project **303026** (existing related Trade Etch project). Every event carries `site_id=instaplaque`, `environment=production`, `is_test`, `schema_version=1`. Dashboard **1017503** is specific to this website. No other site's reporting is changed.
- Manual, allowlisted Capture API events only. No SDK autocapture, replay, feature-flag polling, error payloads or person profiles. No extra Supabase writes. Each event makes one bounded request; no automatic retries.
- A new analytics consent choice is required; an old advertising acceptance alone is insufficient. An existing rejection remains rejected. Withdrawal aborts pending captures, removes PostHog storage and stops further events, including across tabs. Vercel/normal Google analytics now also require the analytics choice; previous purchase/advertising protections remain.
- Production HTTPS canonical/www hosts only. Preview and localhost captures are disabled. For a controlled production test, set **sessionStorage** `instaplaque-analytics-qa=yes` **before** accepting consent/loading the site. Every resulting PostHog event is marked `is_test=true` and excluded by the saved report queries.
- Visits expire after 30 minutes without a measured action; their anonymous ID is also used for journey matching. Refresh counts a new pageview, not a new visit. Step/start events are counted once per visit. Purchase digests are deduplicated locally for up to 90 days (maximum 100 records). Clearing storage/using another browser can cause a later paid return to be counted again; no cross-device identification is attempted.
- Only fixed public route labels, known product slugs, enumerated configuration choices, numerical dimensions/value and safe campaign labels are sent. No form contents, inscriptions, image/file data, customer identity, private URLs, raw Stripe/order IDs, fragments, click IDs or search terms. Requests omit credentials and HTTP referrers. IP anonymisation is enabled in the existing PostHog project; approximate geographic enrichment is not GPS.
- `utm_medium=qr` or `utm_source=qr` means **tagged QR**. Use generic campaign slugs, never personal information. Example: `https://instaplaque.co.uk/memorial-plaques?utm_source=leaflet&utm_medium=qr&utm_campaign=autumn`. Without tags or an external referring domain, source is **direct/unknown**: typed URLs, bookmarks and untagged QR codes cannot be distinguished.

## Events

All names below have the `ip_` prefix.

| Events | Meaning |
| --- | --- |
| `visit`, `page_viewed`, `product_viewed` | Consented browsing; sources/campaign, device/browser and PostHog coarse location |
| `designer_started`, `designer_step_viewed`, `wording_started` | Designer entry and seven steps; wording content is never measured |
| `layout_requested`, `layout_generated`, `layout_failed` | AI/manual attempt versus applied result versus failure; no prompt or error text |
| `proof_download_requested`, `proof_download_prepared`, `proof_download_failed` | PDF/SVG request and browser download hand-off; cannot prove a file was saved to disk |
| `proof_saved` | Local proof-save succeeded |
| `checkout_requested`, `checkout_started`, `checkout_failed` | Attempt versus validated live Stripe-session API response versus failure |
| `purchase_completed` | Paid GBP live order confirmed by authenticated return API; excludes both sandbox and live owner-verification policies |
| `enquiry_started`, `enquiry_reviewed`, `enquiry_submission_requested`, `enquiry_submitted`, `enquiry_failed` | Design brief journey; success requires HTTP success plus the server's positive receipt/reference |
| `contact_clicked` | Email/telephone link clicked, never claimed as an enquiry received |

## Interpretation and limitations

This is consented website measurement, not a payment ledger. Blockers, declined consent and network loss reduce counts. Purchase measurement requires a visitor to return to the confirmation page; server-confirmed enquiry outcomes require the response to reach the browser. There is no new webhook capture retaining consent after a visitor leaves. Funnels show progression within anonymous visits; unfinished recent journeys may still complete. No backfill of historical visits is possible. Existing Google/Vercel totals have different definitions and should not be expected to match.

## Verification and release

Automated consent/redaction/session/purchase tests, existing Google purchase tests, design-request validation/idempotency, checkout finalisation and input-security tests passed. TypeScript passed. Production build passed from the physical `D:/CodexStorage/Home/worktrees/instaplaque-posthog/INSTAPLAQUE` path; building through the C: junction triggers Vite's existing cross-drive asset-name error. Existing large-bundle warning remains.

Browser testing used real built UI at an intercepted canonical origin: no optional scripts/events before consent, QR attribution, page/start dedupe, failed then successful **mocked** enquiry responses, and no personal fixture contents in capture payloads. No actual enquiry, payment, customer email or AI generation was submitted.

Release deployment, production ingestion reconciliation and daily subscription verification are recorded below.

### Published and verified

- Application source **c02abb4ba1bea240741a9435da2d1362df9f00da**, pushed on the task branch. Git auto-deployment remains disabled.
- Protected production candidate **dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi**, `https://instaplaque-o16n5lovg-dullaghan31-3959s-projects.vercel.app`, passed asset-hash and backend checks before promotion. A synthetic proof was saved, verified directly in the target database as a private R2 reference, and reloaded via the hosted API. That fixture and only its scoped artwork were removed.
- Promotion completed; a fresh canonical deployment inspection resolves to that READY deployment and exact commit metadata. Canonical and www both return HTTP 200 with **index-BNGuODZU.js**. No backend configuration or related website was changed.
- Real browser capture requests from production received HTTP 200 and were independently found in PostHog: **1 visit, 3 pageviews, 1 product view, 1 designer start, 3 different designer steps**. All nine events have distinct UUIDs, `is_test=true`, expected tagged-QR campaign attribution and device/geographic enrichment. Native chart one-off QA inclusion returned exactly 1 visit/3 pageviews; normal report queries and activity log returned zero. New taxonomy listings lagged ingestion; direct event inspection verified the fields while indexing caught up.
- All **14 dashboard tiles** ran without query errors, have nonoverlapping layout and permanent site/production/QA filters. The log contains the newest 500 ordinary events, not test events or customer identifiers. The 30-day trend is dashboard-only; the email uses ten 24-hour tiles. Saved native queries use `explicitDate=true`, `date_from=-24h`, `date_to=now`; raw execution showed an exact 24-hour timestamp range. Comparison shifts by `-24h`.
- **Subscription 51654** was read back: enabled, email **sales@tradeetching.com**, daily interval 1, next scheduled delivery **2026-10-13T08:00:00Z**, project timezone UTC, `summary_enabled=false`, ten selected dashboard insights. A fresh search found no existing InstaPlaque subscription. The separate Sample Studio subscription was left intact. No paid upgrade, AI commentary or per-event email alert was enabled.
- The explicitly authorised first report was requested once at **15:10:53 UTC**, delivery **01a130aa-aa4f-73e8-b25b-9511fa3ec736**. Delivery status is recorded below; queuing alone is not provider acceptance or confirmed external delivery.
- That delivery reached **completed** at **2026-10-12T15:12:35.567808Z**, with all **10 exported chart assets** (6700409–6700418). No AI report/prompt/summary was generated. This confirms the PostHog delivery pipeline completed. The connector does not expose per-recipient provider responses or mailbox receipt, so independent email-provider acceptance and actual inbox delivery are not proven. No duplicate send was requested. The recurring schedule remains 08:00 UTC.
- Browser QA and the temporary local server were closed. Only documentation/configuration snapshots changed after the deployed application commit; no additional deployment is needed for those files.
