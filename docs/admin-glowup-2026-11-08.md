# Private admin visual refresh (8 November 2026)

Preview-only branch `codex/instaplaque-admin-glowup-20261108`, based on `be7a5471b064ee601597789c4e8def09c2e5dcac` (the cookie-free usage counter branch, not just live source). No production release is included.

Ready preview: https://instaplaque-m18lc6elc-dullaghan31-3959s-projects.vercel.app/admin (`dpl_Awhqhe6B79dsy7xN4US6d99Ri7W4`), application commit `d8b42a601f06d058390fb1b310507e7f90b77239`. Later changes are harness/documentation only.

## Implementation boundaries

The admin presentation lives in `SiteExperience.tsx` (`AdminPage`, shared `AdminOrderDetail`), `DesignerUse.tsx`, the admin-only branch of `Header.tsx`, and the appended scoped section of `index.css`. Hand-written icons are in `AdminIcon.tsx`. No dependencies added. Phone Stripe/search links have 40px minimum targets; highlighted zero counts and both chart series meet their applicable text/non-text contrast thresholds.

Auth, fetching, filters/sorting, API payloads, email templates, export routines, hidden PDF renderer mounts and the counter backend are unchanged. The shared detail component gives phones the previously desktop-only email/archive actions and timeline. Customer emails and Other are under native collapsed **More actions** on phones. Timeline stays visible. Buttons still act immediately, exactly as before; no confirmations added.

Status presentation now uses friendly casing and “Paid / new”, “Proof checked” and “On hold”. This does not alter status values, filter meaning or sort comparisons. Usage’s old tests checkbox is now Customers / Our tests; the same `tests=0|1` request is used. The heading is corrected for Designer use. Existing action/login labels are unchanged.

## Reproducible synthetic evidence

Run `npm ci`, `npm run typecheck`, `npm run build`, then:

```sh
FIXTURE_OUTPUT=/absolute/evidence/path FIXTURE_PHASE=after node scripts/admin-visual-fixtures.cjs
```

The harness serves only built files on a random **127.0.0.1** port. It intercepts all APIs in the browser, uses fictional orders/visits, blocks non-GETs other than fixture login, and fails on unexpected requests. Known third-party scripts get inert local responses; no requests reach them. Statistics is turned off for public-page parity. It checks 390/1440 layouts, capture states, action availability and keyboard order. Extra tablet coverage uses `FIXTURE_WIDTHS=768 FIXTURE_ADMIN_ONLY=1` and a separate output folder.

To generate production PDF evidence without CDN traffic during the run, set `PDF_LIB_DIR` to a directory containing separately downloaded, unmodified `opentype.js` 1.3.4, `jspdf.js` 2.5.1, and `svg2pdf.js` 2.2.4 (the application's existing export-library versions). These are injected from local files. Compare PDF rasters rather than random PDF metadata.

`admin-visual-baseline.mjs` uses a Vite load hook to build the four original presentation files from the specified git baseline without changing the checkout. `FIXTURE_BASELINE_DIST` is required and must differ from `dist`; the resulting fixture build can be selected with `FIXTURE_DIST`. The full baseline build is checked first; the load-hook build also allows matched public recaptures without source mutation. Public 3D renders are given 5.5 seconds to settle before pixel comparison. For full admin-page images only, the harness temporarily expands the nested scroll viewport and disables sticky positioning; normal overflow/focus/action assertions run without those screenshot-only rules.

Evidence: workspace `output/instaplaque-admin-glowup-20261108/`, including full-page before/after PNGs, bounded comparison JPEGs, pixel/PDF parity, source audit, contrast numbers, logs and preview receipts. Never drive a hosted admin with this harness: hosted buttons affect actual orders and send emails. Hosted verification is limited to paced GETs and must not authenticate an admin session.
