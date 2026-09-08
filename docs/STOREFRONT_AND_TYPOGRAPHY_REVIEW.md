# InstaPlaque storefront and typography review

Prepared 8 September 2026 from `seo/live-google-2026-08-08` (`2bcaee0`). Changes are local; no production deployment has been made.

## Customer experience

- Rebuilt the homepage and plaque product pages with a cream/green palette, readable headings, product examples and visible starting prices from the existing pricing data.
- Removed the long list of keyword-oriented cards from the homepage. Visitors can browse the actual canonical collections, including garden, opening and custom plaques.
- Added shared materials, process and question pages, and real navigation/footer links.
- Product selection now opens the relevant preset at the wording step. It clears the previous draft's artwork and guidance, rather than carrying those into a new plaque.
- Shortened the wording editor and removed automatic proofreading. Generating a layout preserves the customer's exact inscription.
- Added a readiness warning if wording or layout options change after a proof is generated. Existing saved proof recovery still restores its layout signature.

## Search visibility

The homepage, product pages, garden/opening pages, materials, process and FAQ pages are rendered at build time using the same React components as the browser. Canonical URLs and consolidation redirects are retained. Structured FAQ content follows the visible content, and the browser replaces the pre-rendered route schema when navigating.

Search Console is connected according to the owner, but its reports were not accessed in this task. No claim is made about which queries cause lost sales or whether this redesign increases rankings or conversion. Compare impressions, clicks and landing-page performance after deployment; compare proof starts, completed proofs and paid orders separately from traffic volume.

## Typography

Text generation uses the stable `gemini-3.8-flash` model. The model constant is shared between the client and server. Cached clients requesting 3.5 are accepted and routed to 3.8; image-generation models retain their separate configuration.

The new composition prompt prioritises the subject/name, preserves all characters and reading order, describes compact bench layouts separately from wall plaques, limits font mixing and prevents stranded short words. Automatic wording rewriting has been removed from the layout action.

The main generation path now checks exact wording, SVG structure, type size, estimated bounds and overlapping lines. It requests one repair if the first composition fails, then uses a checked local fallback or asks the customer to change the size/wording. These are geometric and text checks, not a guarantee of typographic quality for every inscription; manual adjustments and review remain available.

## Verification

- Production build and TypeScript checks.
- Static SEO checks for canonical routes, sitemap and rendered content.
- Typography regression checks: Unicode names, exact dates, changed wording, overflow, overlap, unsafe SVG, compact bench geometry, cached-client model compatibility and a failed-first-output repair.
- Existing pricing and public-input/SVG security checks.
- Live Gemini 3.8: a compact bench dedication (5.8 seconds), an A5 memorial with accented name (7.2 seconds), and a longer building dedication (9.9 seconds). All passed; outputs inspected visually.
- Production-build UI: bench product → correct 150 × 50 mm preset at £58.50 → wording → successful live four-line SVG proof.
- Desktop and 390-pixel phone viewport checked. No horizontal document overflow observed.

The live model sample review is written to `output/live-typography-review.html` (ignored test output). Reproduce with `npm run check:typography:live` and an existing local `GEMINI_API_KEY`. This invokes the paid API. Offline regression checks use `npm run check:typography`.

## Deployment and follow-up

Review the local storefront and generated examples before publishing. The repository's default `main` branch is an older maintenance version with a site-wide noindex header; these changes build on the separate SEO branch matching the live storefront. Confirm the intended Vercel deployment source when publishing.

The store uses existing design-example imagery; this work does not present those images as verified customer commissions. No fabricated reviews, order counts or sales claims were added. The production bundle still includes a large designer chunk; separating the storefront and editor bundles is a further performance opportunity.

Official model reference: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

## Final deployment review — 8 September 2026

The designer and storefront were reviewed again at desktop and 390-pixel phone widths. The materials section now shows both complete plaques in aligned square images. The original PDF exporter is unchanged from the live-branch baseline; desktop and mobile downloads were rendered and inspected with the original layout and textures intact.

This pass fixed the header checkout shortcut so it opens the final proof review, where the customer must approve before proceeding. The checklist now explains when wording, dimensions or layout options require regeneration, including safe-margin changes. Saved proofs retain that state: reopening a draft with an outdated layout does not make it ready to order. Existing return links remain supported.

Compatible security patches were applied to the sanitizer and affected dependencies. The dependency audit now reports zero known vulnerabilities. No application framework or model upgrade was added during this pass.

Verification covers:

- TypeScript and the production build.
- All 18 rendered sitemap pages, headings, canonical URLs, structured data, and 33 referenced internal pages/assets.
- Product-to-designer presets and pricing, exact Unicode wording, manual bold changes, proof approval, and the checkout payload. Stripe submission is intercepted by the test; no live orders or charges are created.
- Original desktop/mobile PDF downloads, restoration of wording and manual styling, and rejection of an outdated saved draft at checkout.
- SVG/input security, server checkout rules, preview containment, small border widths, scalloped fixing clearance, and textured 3D previews on desktop/mobile with wood backing and material colours.

The expanded browser check is available as `npm run check:deployment` after building and starting the local preview server. It uses local AI/checkout/save fixtures; the separate real Gemini sample was also checked visually during this review. Older geometry/3D tests were updated to use the current navigation, fixing labels and backing rules.

Read-only production health checks report Gemini enabled, Supabase configured, and matching live Stripe keys plus a webhook secret. Those configuration checks do not prove an end-to-end paid order, delivery email or webhook event. The local preview has no Stripe/Supabase credentials and was tested using intercepted requests and the self-contained PDF return link.

Deployment remains pending. The remote `seo/live-google-2026-08-08` branch is still at `2bcaee0`; these changes are on local `codex/seo-review`. Use the Vercel project/source serving the live storefront, retaining its existing production environment. Do not publish the older default `main` branch. The large designer bundle warning remains a performance follow-up rather than a build failure.
