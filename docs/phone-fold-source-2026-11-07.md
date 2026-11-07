# InstaPlaque phone first screen + order source — PREVIEW ONLY

Evidence paths below are relative to workspace `output/instaplaque-phone-fold-source-20261107/` (not committed).

7 November 2026. Owner msg 10916; nothing promoted or deployed to production.

## Preview

- Home: https://instaplaque-k7odun0pe-dullaghan31-3959s-projects.vercel.app
- Bench strip: https://instaplaque-k7odun0pe-dullaghan31-3959s-projects.vercel.app/brushed-stainless-150x65-rect-plaque
- A5 brass: https://instaplaque-k7odun0pe-dullaghan31-3959s-projects.vercel.app/brushed-brass-210x148-rect-plaque
- Wood-backed: https://instaplaque-k7odun0pe-dullaghan31-3959s-projects.vercel.app/brushed-stainless-210x148-rect-dark-wood-plaque
- Designer: https://instaplaque-k7odun0pe-dullaghan31-3959s-projects.vercel.app/design

**Ready, target preview**, `dpl_E88Xp4Ym9rXGcF7gCrM9w7KFh9cC`, application commit `8c985f09567447c7422f8a796c1d6a1c74960e72`. **Vercel SSO protected**: owner must sign in. Hosted checks used the official CLI's temporary preview-protection header, restricted to this preview origin; the temporary file was removed. The Ready receipt was written immediately before hosted checks.

Base: `a967c63` (records only after live application `51bcb55`). Production was independently inspected before and after: still **`dpl_DyTwtgWCmASKbePetzNnczHsHsG1`**, Ready/production. Branch: `codex/instaplaque-phone-fold-source-20261107`. Application commits: `fba1648` (phone layout), `8c985f0` (attribution + tests).

## A. Phone layout

Catalogue product template only, below 768px:

- Compact breadcrumb spacing; shorter, uncropped studio photo (126–220px at tested heights), 44px gallery thumbnails, complete 22px H1.
- Price, then **Design online** and **Design on WhatsApp**, before supporting copy/free-proof details. Neither copy nor price is changed or removed. Photo remains first; all 175 products share the rule.
- Cookie banner wording, padding, fonts and button dimensions stay exactly as live.
- Designer cookie notice participates in the mobile flex layout below the bottom action bar. Its actual height is reserved automatically, including wrapped text and safe-area margins; Back/Continue/Design my plaque remain above it. Accept/Reject restore the space.
- Fresh live-source inspection showed the 6 November designer notice was already at the **top**, unlike the October audit's older bottom overlay. This change gives it dedicated bottom space and also stops it covering the header. No claim that the current baseline still had the October footer overlap.

### Hosted first-screen positions (CSS pixels, no scrolling)

Bench and A5 have the same positions. A range includes the longer wood-backed title. Both CTAs sit side by side at the listed Y and are 50px high.

| Phone viewport | Price Y | CTA Y → bottom | Cookie top | Result |
|---|---:|---:|---:|---|
| 360 × 640 | 400.5–425.2 | 446.1–470.8 → 496.1–520.8 | 531.0 | Both fully clear |
| 375 × 667 | 427.5–452.2 | 473.1–497.8 → 523.1–547.8 | 578.2 | Both fully clear |
| 390 × 664 | 424.5 | 470.1 → 520.1 | 575.2 | Both fully clear |
| 412 × 732 | 492.5 | 538.1 → 588.1 | 643.2 | Both fully clear |
| 430 × 740 | 494.5 | 540.1 → 590.1 | 651.2 | Both fully clear |

At 390px the bench price moves from **Y665.2 to Y424.5** and the full CTA from **Y714.8–770.8 to Y470.1–520.1**. All 175 exact H1s were also measured in the smallest viewport using the five-thumbnail gallery: worst CTA-to-cookie gap **10.23px**.

### Browser evidence

- `before/`: 27 screenshots, 15 products (3 × 5 widths), 10 designer screens (size + wording × 5 widths), one desktop (1440 × 900) and one tablet (768 × 900); unchanged live-source build.
- `after-build/`: same 27 final compiled-app screenshots. `hosted/`: same 27 on the actual preview, **zero page errors/failures**, all required tap targets clear.
- Each directory has `hit-tests.json`: price, online/WhatsApp links, notice and notice buttons; designer footer, Back and action. Final checks test centre + four inset corners, whole-element viewport containment and no cookie/action rectangle overlap. Disabled Back at step 1 is intentionally disabled.
- `layout-parity.json`: cookie wording and banner/Accept/Reject sizes match before/after in **all 27 cases**. Tablet/desktop before/after JPEGs are **pixel-identical**.
- `consent-dismissal.log`: actual Accept and Reject clicks; notice disappears and designer regains space, action bar stays visible.
- Hosted assets were fetched from Vercel once per URL, paced and reused across fresh contexts; analytics, API requests and video playback were blocked. These are browser-emulation checks, not physical-device/Safari checks.

## B. First-arrival attribution

Captured once when the app module loads; **memory only**, even after consent. No attribution cookies, localStorage/sessionStorage, device fingerprinting or new tracking request. Normal client navigation preserves first arrival. Existing Google linker handling remains; Meta/Bing click keys now also survive public pushState navigation, never private/external routes.

`App.tsx` sends `attribution` in the checkout POST. The server whitelists, caps and recomputes the label before placing it in the existing order metadata, which the normal persistence path stores as `storefront_orders.metadata.attribution`:

- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`: each at most 200 characters.
- `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`: at most 512, restricted characters.
- `referrer_host`: hostname only, at most 253; never full referrer URL.
- `landing_path`: path only, at most 300; no query/fragment, private proof/order/admin/checkout path suffixes removed.
- Derived `label`: `google_ads`, explicitly tagged `google_shopping`, `facebook_instagram_ads`, `google_organic`, `bing`, `other_referral:<host>` or `direct`.

Unknown keys/non-string values are discarded; control/angle-bracket characters removed. No IP address or user agent is added. No database migration. Missing attribution on old orders remains **Not recorded**, rather than falsely direct. Phone and desktop admin order details show **Arrival source**.

Stripe Checkout session metadata receives only `attribution_label` and optional `attribution_campaign`, not click IDs or full attribution. Nothing uploads advertising conversions.

### WhatsApp / email legend

**G = Google ads/Shopping · F = Facebook/Instagram · O = organic search · D = direct/unknown · R = other referral · B = Bing/Microsoft ads.**

Existing reference becomes, for example, `(ref IP-XXXXXXXXXX-G)`. No campaign/click identifier is put into the message. This applies to WhatsApp, the desktop QR flow and existing mailto references. The already-referenced free-proof form adds the same validated source code to its `IP-DESIGN-…` receipt/email reference; existing idempotency behavior is covered by tests. Saved-proof email without a comparable reference is unchanged.

### Attribution verification and limits

- **27 unit/integration tests pass**: every label/code, malicious input and caps, no-storage capture, first-arrival stability, navigation, canonical checkout metadata, Stripe metadata, free-proof references and retries.
- Three offline end-to-end browser flows pass: exact product landing **`?utm_source=google&utm_medium=cpc&gclid=TEST`**, tagged Shopping (phone), Instagram (desktop). Reject optional cookies → activate source-coded WhatsApp ref → real client navigation to designer → mocked proof → real UI checkout POST **intercepted** → pure server canonicalization/Stripe parameters → mocked authenticated admin detail view. `intercepted-checkout.json`, `attribution-browser.log`.
- Preview `/api/stripe/config` confirms **TEST secret and publishable keys**, no webhook configured (`preview-stripe-mode.json`). **No checkout session or order was created**, even in test mode, and no actual DB writes were made. This honors the brief's no-DB-writes limit. The JSON evidence's `storedAttribution` is the canonical order object's prepared metadata, **not a database readback**. Actual preview DB persistence is deliberately not live-proved.
- Reloads, full-page links and new tabs begin a fresh arrival; normal client navigation retains it. No cross-tab/device linkage.
- Source labels are untrusted hints: `fbclid` can be on unpaid Facebook links; missing/stripped signals can look direct/organic. Shopping is split only by explicit source/medium tags, not campaign-name guesses. Raw permitted tags still accompany the order. Do not put personal information in campaign tags.

## SEO, catalogue and checks

- Typecheck **PASS**. Full build + every postbuild guard **PASS**, locally and on Vercel.
- Live paced read-only capture of all **175** product pages: title, description, canonical, H1 and JSON-LD match. Exact raw tag bytes also match the unmodified live-source build for all 175 (`seo-parity.json`, `raw-seo-tag-parity.json`).
- Actual live Merchant feed and both sitemaps are **byte-identical** to final build. Hash receipts: `seo-parity.json`; live copies retained as `live-*.xml`. Prices/product data and legal pages unchanged.
- `final-check-results.json`: **35/44 invoked package commands pass** (including build, typecheck and new attribution checks). Other successful suites include server checkout, input/security, design requests/UI, admin order list, analytics redaction, consent, PostHog/replay, Google/Meta purchase, catalogue/policies, category template, typography, geometry, border parity, circular plaques, curved/small borders and statistics.
- Installing the missing Playwright headless runtime resolved the initial input-security launch error; that suite now passes. Providing the tests' hardcoded local port resolved design-request UI's initial connection refusal.

### Pre-existing check failures (reproduced against the unchanged live-source build)

| Check | Baseline failure |
|---|---|
| `npm run check` | No `check` script exists in the repo |
| `check:designer-seo-browser` | Expects `#instaplaque-route-schema` on the test's hash-bearing URL; times out |
| `check:design-routes` | Outdated mocked model-prompt regex returns null |
| `check:fixings-border-ui` | Desktop floating proof-button/modal assertion |
| `check:small-fixings`, `check:bold-toggle`, `check:symbols` | Old “Text journey” selector not found |
| `check:pricing` | Old `Add £85` label not found |
| `check:deployment` | Homepage decorative image has an empty alt; blanket nonempty-alt assertion |

Baseline receipts: `baseline-designer-seo.log`, `baseline-checks-summary.log`, `checks/baseline-*.log`. These tests were not weakened or unrelated app behavior changed. Chargeable/live-model checks (`check:gemini`, `check:typography:live`), real storage integration and authenticated admin-write checks were not run. No real AI, Stripe, order, proof-session, email, Ads or Merchant writes occurred.

## Proposed privacy wording — NOT applied to public legal text

> We temporarily remember how your current visit began, including campaign tags, advertising click identifiers, the referring website’s hostname and your landing-page path. This information stays in page memory without attribution cookies or browser storage. If you start checkout, we save it with your order and include the source label and campaign name in Stripe checkout metadata. Enquiry references may include a single-letter source code, but not advertising click identifiers. This is separate from optional analytics and advertising services, which retain their existing privacy controls.

Review alongside the chosen lawful basis and order-data retention policy before release. The website's privacy/cookie wording was deliberately not silently changed.

## Release — owner authorization still required; not performed

1. Re-inspect `instaplaque.co.uk`; reconcile any newer live source before release. Use this task branch/worktree, not `main`.
2. Under the shared lock, stage with `flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock vercel deploy --prod --skip-domain`. This is a production-target build but must **not** move domains yet. Do not copy preview TEST settings to production.
3. Verify Ready/production target, staged HTML/SEO/feed/sitemaps, phone/designer checks and read-only Stripe key-mode flags. Do not create a live session/order for checking attribution. Finalize the approved privacy disclosure if requested.
4. After checks, promote the staged deployment under the same lock; recheck canonical/www and UI.
5. Rollback code: under the lock, `vercel promote dpl_DyTwtgWCmASKbePetzNnczHsHsG1 --yes`. No migration/data rollback is required. Preserve any order data created after a future release.

Only the new task branch was pushed. Local QA servers and temporary preview credentials are removed at completion; `.env.local` is absent. Final clean status/remote SHA receipt: `final-state.txt`.
