# Memorial page search improvements — 29 September 2026

Status: deployed on 30 September 2026 after the owner's explicit request. The verification and release notes below supersede the original review-only status.

## Source and production baseline

- Task branch: `codex/memorial-search-2026-09-29`.
- Application change: `285213a5907bf0ad3f224152a8aebcb6d337330c`.
- Based on `codex/wording-proofreading` at `7a398b148d8ee477a18f9bf7af6e8bd1ac44ebf8`.
- The canonical production alias was independently checked before work: application revision `c0c4ae1311256dd7b0c43533af7fd11cf3d096dd`. The baseline includes that release and its documentation.
- Retains the Supabase/R2 migration and all subsequent designer, proofreading, delivery and Merchant catalogue changes. Do not deploy the older original Windows checkout or substitute an older main branch.

## Scope

Preserves `/memorial-plaques` and its main heading. Adds memorial wording examples, catalogue-derived size/price comparisons, material and fitting guidance, cemetery permission guidance, family proof review advice, six relevant FAQs and accessible section links. Adds contextual inbound links from the bench, garden, brass, stainless steel and materials pages.

Updates the memorial title and description, aligns prerendered metadata and the image with the rendered page, and updates this page's sitemap modification date. Uses existing illustrative artwork; does not present sample inscriptions as customer commissions. Structured FAQs match the visible questions and answers.

Prices, payments, PDF rendering, designer behavior, AI generation, backend configuration and the 175-product Merchant feed are unchanged.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed, including the API boot regression checks and static page generation. Existing large-bundle advisory remains.
- `npm run check:live-seo`: passed for the 19 main sitemap URLs covered by that check; the separate Merchant sitemap is not included in that count.
- Static output checks: one H1, correct canonical, matching visible/structured FAQ text, matching image/product price/description, valid section anchors, expected wording and size cards, resolving internal page links and contextual inbound links.
- Generated Merchant feed compared byte-for-byte with current production: identical.
- Browser review at 390px and 1440px: readable layout, no horizontal overflow, functioning section links and price FAQ, A5 product link shows the correct product and price, primary memorial CTA reaches the designer. Browser console reported no errors during this review.
- Staged diff reviewed; whitespace and focused secret scan passed.

Local browser coverage used the static preview server. No live generation, proof persistence, email, order or payment was performed, and no full customer purchase journey is claimed. Search Console inspection confirmed that the existing page was indexed with the expected canonical; private performance figures are intentionally not committed to this public repository. Ranking changes cannot be verified before publication and recrawling.

## Next step

Deploy only after an explicit owner request, as required by AGENTS.md. Before release, recheck the live alias and remote work so this branch does not overwrite a newer deployment; use the existing Vercel project and production environment. Follow DEPLOYMENT.md and the Supabase/R2 handover, including applicable hosted proof checks. Record the exact deployed source, deployment and alias verification.

After the revised page is verified live, request indexing for `https://instaplaque.co.uk/memorial-plaques` in the existing Search Console property. Keep the URL and canonical stable. Compare subsequent page/query performance over comparable periods after recrawling; no ranking outcome is promised.

Git publishing review: the inherited `git.deploymentEnabled=false` guard is retained, the sole GitHub workflow performs typecheck/build only, and the repository hooks list was empty. This task branch can be pushed without publishing the site. No merge or default-branch change is part of this task.

## Release — 30 September 2026

Deployed source `febbedd49335a5625930099c7c0557e0d95461ec`, Vercel `dpl_2nWrgrqHCDEMkhAe1HRTpVnDRJyg`. Built as a production candidate, inspected its HTML through authenticated Vercel curl, then promoted. Canonical and www aliases independently resolve to that READY deployment and source. Public memorial HTML contains the new wording section and the expected JS/CSS build hashes. Cloud build passed.

Hosted synthetic proof save/read confirmed target Supabase and private R2 storage with restored SVG content. The initial assertion compared unnormalised SVG whitespace; corrected comparison passed. Both synthetic fixtures and their scoped artwork were removed. No emails, generation, order or payment. Previous compatible deployment: `dpl_J7N13RYDfRXiY1k7VpfLRyZC7JL1`.
