# Designer SEO — 13 October 2026

## Scope and release state

Improve the InstaPlaque `/design` page, not PIM, the ads campaign or the catalogue.
Based on `8822391` (PostHog application `c02abb4` plus handover). Live canonical
inspection before publication identified `dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi`
and `index-BNGuODZU.js`. The owner explicitly requested publication in message
4488 and requested the pop-up correction in message 4495. Current application
source `588afdb38957333c873a2acf3c4743c764111069` is now
**deployed and independently verified live** at
[the designer](https://instaplaque.co.uk/design).

## Changes

- A shared React guide is emitted in the initial HTML and available from the
  interactive workbench through an initially closed modal. Its stable H1, design
  process, three existing illustrative examples, material/internal links and five FAQs are available
  without generating or saving a proof.
- The workbench stays fixed and full-height, with no added page-level scrolling.
  A header button opens the pop-up; close/return, Escape and backdrop dismissal
  preserve focus, private saved-proof fragments, referral parameters, active step
  and inscription. Expandable FAQs come first; longer tips/examples are a separate
  disclosure. The pop-up reading area scrolls independently, while its close and
  return buttons stay visible. A readable guide fallback remains without JS.
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

## Pop-up correction release — 13 October, 10:11 UTC

Owner message 4495 explicitly rejected adding scrolling to the designer page.
The correction uses a native modal dialog (initially closed), keyboard-boundary
handling and background inertness. It does not change the designer's existing
internal controls scroll or any shop-page scrolling.

Exact source `588afdb38957333c873a2acf3c4743c764111069` passed
[CI run 38380879128](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38380879128):
typecheck, build/runtime smoke, static SEO and browser checks at 390×844,
320×740, 820×1000, 1440×1000 and 844×390, plus no-JavaScript reading. Browser
checks verify zero page/main scroll, modal viewport bounds, focus containment
and return, all four dismissal paths, expandable FAQs/tips, loaded images,
retained wording/step/URL and initial/client content/metadata parity. They use
only intercepted fixture requests and produce no production events or writes.
Mobile/desktop screenshots were recovered from CI and visually inspected.

The first test run measured the existing entrance animation's transient 6px
translation; layout assertions now finish that animation. A subsequent check
caught keyboard focus leaving the dialog boundary; explicit boundary wrapping
was added. All checks then passed without removing those assertions.

Production candidate `dpl_6o1LFnmir5w6VjKZdgqt5bRAotAu` was cloud-built and
verified before promotion at
https://instaplaque-o99inec90-dullaghan31-3959s-projects.vercel.app.
Vercel metadata proves the existing InstaPlaque project and exact source SHA.
Vercel build/runtime/static SEO checks passed; candidate entry assets match the
content-hashed filenames from the browser-tested CI build. Promotion succeeded.
Independent canonical inspection and public checks at **10:11 UTC** confirmed:

- Canonical/www `/design` HTTP 200 and identical candidate HTML; correct title,
  canonical/index-follow, five FAQ answers and separate tips disclosure.
- JS `index-BGL2dIT7.js`, SHA-256
  `1d571585011f8a6f6cb9cb9029ff602e160dd0976945167cebe404f052e42d76`.
- CSS `index-Bxw_YNF_.css`, SHA-256
  `76411f18b7354142b26195d3b7dd0ec571a237c47ea08448cb100acf966e9627`.
- All three images, sitemap and read-only Gemini/Supabase/Stripe responses match
  the verified candidate; robots remains unchanged.

Evidence is in ignored `output/designer-modal-review/` and
`output/designer-modal-release/`. No local heavy build/browser/install was run
while account memory was above 3 GiB. Browser interaction proof is from CI;
hosted proof is HTTP, deployment identity and artifact equality. No customer
actions, Ads, database writes, payment/analytics settings, PIM changes or Google
indexing submission occurred. Immediate code rollback is the previous
`dpl_55MasQFh4ss1hW2kmJtTqvYVor51`; it restores the unwanted scrollable guide.

## Initial publication and indexing — 13 October, 09:48 UTC

The owner authorised deployment; a fresh remote fetch, clean source status and
live deployment check confirmed no intervening change to the release baseline.
The initial application SHA `37c841974dc6b8fc33f6762d40be8d2896da6688` passed
[CI run 38375894556](https://github.com/MerlinDog1/plaque-store-ai-proof-bench-experiment-2026-06-19/actions/runs/38375894556),
including all browser interactions documented above.

The existing `instaplaque` project (`prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`) built a
production candidate with `--skip-domain`. Its uploaded regular files were all
tracked source; no environment secrets, dependencies or QA output were included.
Two zero-byte directory entries in the upload manifest were not file contents.
The Vercel cloud build passed runtime smoke and both static SEO checks.

Candidate `dpl_55MasQFh4ss1hW2kmJtTqvYVor51` was verified at
https://instaplaque-f2nyd823o-dullaghan31-3959s-projects.vercel.app before promotion.
Vercel API metadata confirms its project and initial `codySourceCommit`
`37c841974dc6b8fc33f6762d40be8d2896da6688`.
Promotion succeeded, and independent inspection of `instaplaque.co.uk` confirms
this READY deployment. Read-only HTTP verification at **09:48 UTC** confirmed:

- Canonical and www `/design`: HTTP 200, identical candidate HTML; www resolves
  to the canonical host. New title, sole H1, canonical, index/follow, five FAQ
  answers and three guide images are present in the initial HTML.
- Client JS `index-BjtrW2fO.js`, SHA-256
  `a5d41d04975eedb1ea458d1274bdc9769b7d01d7a427ae32377e44eaf8dd8683`;
  CSS `index-DhjswPCu.css`, SHA-256
  `6c7ebab4530cad413c16679ae667693b8bb9610cf9d12b63273d809d5e666590`.
  Both are byte-identical to the verified hosted candidate.
- All three guide images and `sitemap.xml`: HTTP 200, identical to the source
  public assets and candidate; robots still advertises the canonical sitemap.
- Gemini and Supabase health and Stripe configuration: HTTP 200, unchanged
  from the candidate; live payment configuration remains present. These were
  read-only checks, not model generation, proof saves, orders or payments.

Hosted HTTP/hash checks supplement the earlier CI browser checks; a new live
browser interaction run was not performed because account memory remained over
the 3 GiB headroom threshold. No local build/install or resource-limit change.
Local ignored evidence is under `output/designer-seo-release/`. No database,
payment, tracking configuration, ads or PIM changes were made.

Rollback is code-only: promote the previous
`dpl_6MFCt8yZsRfZvTrZ77MHhMKiTuQi` deployment using the same InstaPlaque project.
This removes the new guide/SEO while retaining the earlier checkout and PostHog
release; no data rollback or secret change is needed.

The prior read-only Search Console inspection said `/design` was unknown to
Google. Source changes do not prove indexing, rankings or image display.
After publication, request indexing in Search Console's URL Inspection UI if
available. The URL Inspection API is read-only; ordinary shop pages are not
eligible for Google's JobPosting/BroadcastEvent Indexing API. No submission has
been made by this task.

Reference: [Google's people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
and [title guidance](https://developers.google.com/search/docs/appearance/title-link).
