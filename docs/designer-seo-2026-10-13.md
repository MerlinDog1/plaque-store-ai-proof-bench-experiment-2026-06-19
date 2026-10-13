# Designer SEO — 13 October 2026

## Scope and release state

Improve the InstaPlaque `/design` page, not PIM, the ads campaign or the catalogue.
Based on `8822391` (PostHog application `c02abb4` plus handover). Live canonical
inspection on 13 October still identifies `dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`
and `index-BNGuODZU.js`. This task branch is **not deployed**.

## Changes

- A shared React guide is emitted in the initial HTML and remains below the
  interactive workbench. Its stable H1, design process, three existing
  illustrative examples, material/internal links and five FAQs are available
  without generating or saving a proof.
- The workbench stays first and full-height. A header guide link and return link
  scroll without reloading or replacing private saved-proof fragments, referral
  parameters or the current inscription. FAQ disclosures also work without JS.
- The title and description are specific to designing a plaque online. Metadata
  and WebApplication/BreadcrumbList schema are shared between static and client
  rendering. The zero-price offer describes **use of the designer and proof**,
  not a free manufactured plaque. No invented reviews or FAQ-rich-result claims.
- The existing canonical `/design` and index/follow policy are retained. Only
  its sitemap entry gets a truthful modification date and the three visible
  example image URLs. All 19 canonical page URLs remain.
- Existing images are labelled illustrative, have descriptive alt text and
  dimensions, and are lazy-loaded below the tool. No new image generation or
  substantial image payload is introduced to the initial designer view.

## Checks

Source/script syntax, staged secret/artifact scan and whitespace checks passed
locally. [CI run 38375419307](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38375419307)
passed on implementation `276bbe4ad9dba0eeb1ea601e6c196613a6ad9173`:

- Full TypeScript check, real API entry boot/sanitization/three synthetic health
  routes and production Vite/prerender build (Vite build: 5.22 seconds).
- Existing static SEO checks: all 19 sitemap URLs, focused redirects, route
  HTML, canonicals and preloads preserved.
- New designer checks: substantive initial HTML, complete FAQ answers,
  resolvable internal destinations, all three images, canonical/metadata,
  application/breadcrumb schema and image sitemap.
- Browser checks at 320/390/820/1440 widths: raw/client content and schema parity,
  guide/FAQ navigation, wording and URL-state retention, working images, no
  horizontal overflow or browser errors. No-JavaScript mobile reading passed.

All requests were intercepted; no fixture sent production analytics or writes.
Mobile designer/guide and desktop guide screenshots were recovered from the CI
log and visually inspected. The capture now finishes the existing fade-in
animation before taking screenshots; it does not change the app animation.
Latest branch checks and review are on
[draft PR 15](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/pull/15).

Use the existing CI workflow via a draft PR against the live source branch,
not stale main. It uses the repository's pinned Node and lockfile. Static checks
run in the npm postbuild lifecycle; browser checks run only when GITHUB_ACTIONS
is true, not on Vercel. Three synthetic/public review screenshots are encoded in
the normal CI log for local recovery. The workflow is unchanged: the first push
with an artifact-upload step was rejected for missing workflow scope, and that
unpublished change was removed. No new access, schedules or triggers added.
The VPS account was above 3 GiB, so no local build/browser/dependency install
was started and no other services or resource safeguards were changed.

## Publication and indexing

AGENTS.md requires an explicit deployment request. Once approved, recheck the
live deployment for intervening changes, deploy using the existing InstaPlaque
Vercel project/configuration, inspect the protected candidate, then verify the
canonical `/design`, sitemap, designer interactions and source revision.
No database, payment, tracking configuration or PIM change is required.

The prior read-only Search Console inspection said `/design` was unknown to
Google. Source changes do not prove indexing, rankings or image display.
After publication, request indexing in Search Console's URL Inspection UI if
available. The URL Inspection API is read-only; ordinary shop pages are not
eligible for Google's JobPosting/BroadcastEvent Indexing API. No submission has
been made by this task.

Reference: [Google's people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
and [title guidance](https://developers.google.com/search/docs/appearance/title-link).
