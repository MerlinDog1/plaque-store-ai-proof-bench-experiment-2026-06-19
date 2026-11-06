# Category films — 6 November 2026 (PREVIEW ONLY)

Owner msg 10199: unique homepage-style films for the 13 category pages and mapped product pages.
Based on page-improvements `4f72e04`, preserving the stage-three pages. Cookie branch
`origin/codex/instaplaque-cookie-bigger-20261106` merged in `b60d791`.

## Implementation

- `services/categoryFilms.mjs`: one versioned descriptor per category. Import only the complete, audited media
  batch with `node scripts/import-category-films.mjs /absolute/path/to/media-output`. The importer requires all
  13 READY markers, 39 verification receipts, verified web checksums, silent 4:5 H.264, and the expected duration.
  Disclosures, production qualifications and text descriptions come from the final manifest, not generic claims.
- Twelve category templates use the shared category film block after the proof. Portrait has its own block after
  its process section, a photo-to-proof description and WhatsApp-only cues. It has no link to the wording designer.
- Categories retain products-first layout and manual play: no MP4 request before tapping. Lazy poster, pause/play,
  off-screen and background-tab pause, reduced-motion and Save-Data behavior are retained.
- All 175 exact product pages use `productCategoryFor`, the same stable category as their breadcrumb: nonrectangular
  plaques → custom; long narrow rectangles → bench; other rectangles → brass or stainless steel by material.
  This is one template change, not 175 independent edits. The mapping does not depend on browsing history.
- Standard cues remain frame 332 and 566 at 30fps. Portrait cues WhatsApp only. Watch-event deduplication includes
  the film ID so different films on the same route remain independent; consent gating is unchanged.
- Homepage, `/video`, its VideoObject, thumbnails, transcript and video sitemap use the original `promoVideo.mjs`.
  The general guide link on other categories is explicitly labelled as a different, general designer guide.

## Verification and preview

Actual check results and final preview receipt are recorded in the task media directory's `SITE-REPORT.md`.
The parent owns the media repository, manifest, rendering and final overall `REPORT.md`; this worktree owns site
integration only. Run typecheck, full build/postbuild, `scripts/check-category-film-mapping.mjs`,
`scripts/check-promo-video.mjs` and `scripts/check-category-template-browser.cjs` before deploying.

Use the established shared deployment lock. Only `vercel deploy --yes --scope dullaghan31-3959s-projects`:
no production flag, promotion, alias operations or environment changes. Probe api.vercel.com first; HTML security
checkpoints mean wait, not reauthenticate. Hosted checks use `vercel curl` and are paced. Production must remain
`dpl_EN5TJhoAY3gizahUEiQG9hji4mr2`. No ads, campaigns or Meta settings are changed.

## Merge verification correction

The larger cookie bar overlapped the first desktop row by 21.84px on tree/custom and 4.38px on opening/church/donor;
house had only 0.23px clearance (1440×900). These six desktop headers use 8px top padding instead of 18px, and the
tree/custom introductions use available width to avoid a second line. Wording, full-size uncropped product photos,
the larger notice, other categories and all phone layouts remain unchanged. The strict no-overlap assertion stays.

For local playback/cue checks use a server with both clean prerendered routes and HTTP Range support. Vite preview
falls back to homepage SSR on clean routes here, while `server.mjs` serves correct route HTML but lacks byte ranges.
The evidence directory includes a loopback-only range proxy over `server.mjs`; Vercel supplies ranges itself.
