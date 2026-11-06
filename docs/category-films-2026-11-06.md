# Category films — 6 November 2026 (PREVIEW ONLY)

Owner msg 10199: unique homepage-style films for the 13 category pages and mapped product pages.
Based on page-improvements `4f72e04`, preserving the stage-three pages. Cookie branch
`origin/codex/instaplaque-cookie-bigger-20261106` merged in `b60d791`.

## v2 films (owner msg 10243, 6 Nov 2026)

The 13 films were remade as v2 (`<slug>-20261106-v2`, 26.53 s, 796 frames): the WhatsApp half now shows a different,
bespoke example design per page (sketch/logo/document/voice note/photo in, illustrative bespoke proof out), and six
pages have new real designer captures with better wording. The v1 files were never live, so the importer removes them
from `public/videos`. Cue windows come from each descriptor: design 0–11.07 s (frame 332), WhatsApp 11.07–23.47 s
(frame 704), both 23.47–26.53 s; portrait WhatsApp only. `check-promo-video.mjs` seeks into the middle of each
film's own windows. Film source: `projects/instaplaque-category-films-20261106`, branch
`codex/instaplaque-category-films-v2-20261106`; media and report: `output/instaplaque-category-films-v2-20261106/`.

v2 preview: https://instaplaque-kmjpw9n14-dullaghan31-3959s-projects.vercel.app (`dpl_25muGWnEThvH17Ji9ww72CSGySXN`,
preview / Ready, from `14b70eb`). Typecheck, local and cloud build with all postbuild guards, 175 mappings, 43/43
playback and cue cases, 36 template-browser cases and 16/16 paced hosted checks passed. Production stayed
`dpl_EN5TJhoAY3gizahUEiQG9hji4mr2` before and after. Evidence: `output/instaplaque-category-films-v2-20261106/site/`.

## Implementation

- `services/categoryFilms.mjs`: one versioned descriptor per category. Import only the complete, audited media
  batch with `node scripts/import-category-films.mjs /absolute/path/to/media-output`. The importer requires all
  13 READY markers, 39 verification receipts, verified web checksums, silent 4:5 H.264, and the expected duration.
  Disclosures, production qualifications and text descriptions come from the final manifest, not generic claims.
- Each category film leads its page, as the homepage film does (owner msg 10240, 6 Nov 2026: "bang at the top of
  their respective pages just like the home page"; branch `codex/instaplaque-films-top-20261106`). The twelve
  template pages have two hero buttons (Design online, Design on WhatsApp) under the title and facts line, then the
  film (`CategoryFilmFigure`) on phones; on computers the film sits beside the title, facts line and buttons, with the
  breadcrumb kept at the top. The portrait page's hero has its film under its two buttons on phones and in place of the
  Millie close-up on computers; the close-up follows the hero. The click-to-play block after the proof is gone.
- The films play like the homepage film: poster preloaded in the HTML, the MP4 requested only after the page's load
  event and only for the copy on screen, silent and looping, paused off screen and in background tabs; reduced motion
  and Save-Data show the poster and a play button. While it plays, the hero button for what it shows lights up
  (`.cat-film-hero` rules in `shopfront.css`). Portrait has a photo-to-proof description, WhatsApp-only cues and no
  link to the wording designer. The products follow the film, so the first card is below a phone's first screen.
- All 175 exact product pages use `productCategoryFor`, the same stable category as their breadcrumb: nonrectangular
  plaques → custom; long narrow rectangles → bench; other rectangles → brass or stainless steel by material.
  This is one template change, not 175 independent edits. The mapping does not depend on browsing history.
- Standard cues remain frame 332 and 566 at 30fps. Portrait cues WhatsApp only. Watch-event deduplication includes
  the film ID so different films on the same route remain independent; consent gating is unchanged.
- Homepage, `/video`, its VideoObject, thumbnails, transcript and video sitemap use the original `promoVideo.mjs`.
  The general guide link on other categories is explicitly labelled as a different, general designer guide.

## Verification and preview

Actual check results and final preview receipt are recorded in the task media directory's `SITE-REPORT.md` (films at
the top: `output/instaplaque-films-top-20261106/REPORT.md`).
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

## Ready preview receipt

https://instaplaque-9islru9kh-dullaghan31-3959s-projects.vercel.app

`dpl_5Fj5WvK913X5gQm6rMLUfKKvL9fj`, independently inspected preview / Ready, from application commit `aec5ab4c8bee7fecd61966f0cf3fceba74a9723a`.
Typecheck, full local/cloud build and postbuild passed; 175 mappings, 43 playback cases, 36 category-layout cases,
and 51 paced hosted checks passed. Final screenshots were personally inspected. Production independently remains
`dpl_EN5TJhoAY3gizahUEiQG9hji4mr2` before and after. No production deployment, promotion, alias or environment change.
Complete evidence: workspace `output/instaplaque-category-films-20261106/SITE-REPORT.md`. Local servers stopped.
