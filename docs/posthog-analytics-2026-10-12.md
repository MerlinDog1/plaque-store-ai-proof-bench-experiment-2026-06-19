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

Release deployment, production ingestion reconciliation and daily subscription verification are recorded below after completion.
