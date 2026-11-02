# Cookie choice and anonymous visit statistics — PREVIEW ONLY, 2 November 2026

## Scope and source

Owner msg 9079: “do both” — make the cookie bar more noticeable and add the cookie-free visit counter.
This is **preview only**, based on the current live source `406df95aedf810b4dac8e03a43010efe2107e9ce` on
`codex/instaplaque-wood-wording-20261101`. The live-source checkout was not edited or built.

- Task branch: `codex/instaplaque-consent-stats-20261102`.
- Deployed, checked application/source SHA: **`7ce5df4144f8011850844f1a4c8db66e765534dd`**.
- Earlier completed commits preserved: `768b975` (counter port from `dbf323d`), `82ceaaf` (styling),
  `70017fb` (noticeable neutral bar). This continuation added only the desktop spacing correction `7ce5df4`.
- The documentation commit following that SHA changes only this document and `HANDOVER.md`.
- Git deployment rules remain unchanged: only `preview/**` can trigger Git deployments;
  this `codex/` branch was pushed without force. The GitHub push workflow only covers `main` and pull requests.

## Preview

https://instaplaque-5v5zwb1o2-dullaghan31-3959s-projects.vercel.app

Deployment **`dpl_4zSfvb256ecwUN5Ck26xi9KiweSK`** was independently inspected **READY**, target **preview**, in the existing
`instaplaque` project (`prj_e0enz36tdUE3mI8q3tKKG9YR5CLD`) on 2 November 2026.
The application source was committed and pushed before the CLI uploaded the clean working tree.

The unauthenticated API probe returned `403 application/json; charset=utf-8`, not a Security Checkpoint.
Exactly one preview deployment was made using the documented command under the shared lock:

```sh
flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock \
  vercel deploy --yes --scope dullaghan31-3959s-projects
```

The command was bounded by `timeout` and wrapped in `cody-job`. Cloud build and all postbuild checks passed.
There was no production deployment, promotion, manual alias/domain action, project/environment change,
Google/Meta/Ads/Merchant/Supabase setting change, purchase, message or email.

Supported authenticated `vercel curl` GETs to **this preview only** returned 200 for home, `/cookies`,
`/brushed-stainless-150x65-rect-plaque`, `/tree-memorial-plaques`, and `/assets/index-D1QJrywf.css`.
All four HTML pages contain the new static notice; the stylesheet contains the corrected desktop spacing
and 44 px touch targets. These GETs did not execute analytics. Hosted browser interactions were not rerun;
the complete interaction checks below used the local built site.

## Behaviour

- Dark-green notice; equally styled, equally sized Accept/Reject buttons, both at least 44 px high.
  At 390 × 844 the phone bar is 88 px tall. At the checked desktop sizes it is 66 px tall.
  It stays clear of headings, first product rows, the mobile contact bar and the designer Continue control.
  Its entry animation runs once and is disabled for reduced-motion users.
- The notice explicitly says anonymous visits are counted even after Reject and links to Settings.
  The separate Statistics switch is at the top of `/cookies`; cookie/privacy text explains the distinction.
- Vercel Web Analytics sends public-page totals by default under the task's PECR statistics-exception premise.
  Turning Statistics off stops future pageviews immediately and persists the objection independently of
  optional consent. A later Accept cannot restart an objected counter. No retrospective pageviews are sent
  when it is enabled again. Storage errors fail closed or preserve the objection in the current document.
- No Vercel custom events, identity or profiling calls; query strings/fragments are removed, private
  proof/order/checkout/admin routes are dropped, and internal owner browsers remain excluded.
- Optional PostHog events/replay and Meta remain opt-in. **Google advanced consent mode is unchanged**:
  its existing public tag can load in denied mode before Accept and after Reject. This is separate from
  the new statistics counter; do not describe this as “Google never loads before Accept”.

## Interrupted run and minimal correction

The earlier server interruption closed Chrome mid-test. Its completed build/typecheck and other successful
checks were retained; the unfinished browser suites were resumed one at a time, never in parallel.

The resumed category test found one real failure:

> `tree-memorial-plaques/desktop: notice covers the first card`

At 1440 × 900 the tree card ended at 823.84 px, while the original 74 px bar began at 814 px.
Only desktop vertical padding (14 → 10 px) and the bottom gap (12 → 6 px) changed, giving a 66 px bar
beginning at 828 px. Both 44 px buttons, all wording, colours and the 88 px phone layout were preserved.
Typecheck, build/postbuild, the final layout suite and all 24 category cases passed after the correction.
The failure evidence remains in `category-browser-finish.log`; success is in `category-browser-fixed.log`.

## Verification

All paths below are relative to the evidence root:

`/home/coding-agent/workspace/output/instaplaque-consent-stats-20261102/`

| Check | Final result | Evidence |
| --- | --- | --- |
| TypeScript | PASS | `typecheck-finish.log` |
| Local build + every postbuild guard | PASS | `build-finish.log` |
| Cookie bar: 5 phone + 2 desktop routes | 7/7 PASS | `layout-fixed.log`, `final/layout-results.json` |
| Eight categories: phone, desktop, JavaScript off | 24/24 PASS | `category-browser-fixed.log`, `category-final/browser-results.json` |
| Statistics, localhost origin | 5/5 PASS | `statistics-local-finish.log`, `statistics-local-final/results.json` |
| Statistics, canonical-origin simulation | 5/5 PASS | `statistics-canonical-finish.log`, `statistics-canonical-final/results.json` |
| Built Google consent UI, saved null/no/yes | 3/3 PASS | `google-consent-browser-finish.log` |
| Google Customer Reviews (previously completed, unchanged) | PASS retained | `google-customer-reviews.log` |
| Google click navigation (previously completed, unchanged) | PASS retained | `google-click-navigation.log` |
| Cloud build + every postbuild guard | PASS | `deploy-preview.log` |
| Deployment identity/target/status | READY / preview | `preview-inspect.json` |
| Protected preview HTML/CSS GETs | 5/5 HTTP 200 | `preview-http-results.json` |
| Git whitespace check | PASS | `git diff --check` |

The postbuild guards include SEO, all 175 feed/product offers, template content, statistics, redaction,
PostHog/video events, session replay, Google consent/purchases and Meta consent/purchases.
The category suite also checks swatches/links, filtering, price/planner behaviour, no-JavaScript content,
no horizontal overflow, errors, product-photo largest paint and the tap-to-play video.

Both statistics matrices used the already saved real Vercel runtime, with every analytics loader/event
request intercepted or fulfilled locally. `TEST_ORIGIN=https://instaplaque.co.uk` was only a browser-origin
simulation: requests for that origin were routed to `http://127.0.0.1:4398`, never the live website.
No synthetic events reached a real analytics provider and no test was run against the live site.

| Statistics UI case | Initial Vercel views | Later probe views | Reload behaviour |
| --- | --- | --- | --- |
| No choice | 1 | 3 | Not needed |
| Reject | 1 | 3 | Not needed |
| Accept | 1 | 3 | Not needed |
| Off before optional choice | 1 | 0 | No SDK load; later Accept still does not load it |
| Off after Accept | 1 | 0 | No SDK load |

An objection stops future counting; it does not retract the initial view made before the visitor switched it off.
No cookies were created by the statistics runtime before optional consent, no Vercel attribution identifier
was stored, and synthetic custom-event/identify probes were blocked. Google consent remains denied without
Accept, even when Statistics is on. Canonical-origin PostHog/replay/Meta attempts occur only after Accept.

## Screenshots

Small review copies (not committed):

- Phone home (351 × 760): `/home/coding-agent/workspace/output/instaplaque-consent-stats-20261102/review-final/phone-home.jpg`
- Phone product (351 × 760): `/home/coding-agent/workspace/output/instaplaque-consent-stats-20261102/review-final/phone-product.jpg`
- Phone `/cookies` (351 × 760): `/home/coding-agent/workspace/output/instaplaque-consent-stats-20261102/review-final/phone-cookies.jpg`
- Desktop home (1000 × 659): `/home/coding-agent/workspace/output/instaplaque-consent-stats-20261102/review-final/desktop-home.jpg`

Original final captures are in `final/` with the same basenames. Three downscaled views were visually inspected
(phone home, phone cookies, desktop home); final captures/review copies were regenerated after the spacing
correction, and final dimensions/overlap were asserted by the browser suites. Phone geometry is unchanged.
All task browsers closed, and this task's loopback-only port-4398 server was stopped and its listener checked absent.
Unrelated processes were not stopped.

## Before release / open questions

1. Confirm the selected **Vercel Web Analytics processor terms and retention** satisfy PECR Schedule A1
   paragraph 5, especially individual-level technical data being retained only until aggregation.
   The application cannot attest to the processor's internal retention or contractual use of data.
   No account-side settings or legal terms were changed in this task.
2. Review the short phone wording, “Allow site-use recording (typing hidden) & ad cookies?”, together with
   the explicit “even if you Reject” statistics explanation. The preserved design uses a separate objection
   on `/cookies`; Accept/Reject do not change that setting.
3. Any production release remains a separate owner decision. The existing Google advanced-consent-mode
   behaviour is unchanged and must not be confused with this new Vercel statistics exception.

**Rollback: nothing is live to roll back.** No production domain was reassigned by this task.
The previously recorded live source remains the starting point for a future release comparison.
The older [31 October counter report](cookieless-stats-2026-10-31.md) is provenance for the port;
its preview URL, screenshots and bar description are historical, not this preview.
