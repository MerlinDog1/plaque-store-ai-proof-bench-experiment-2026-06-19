# Eight category templates, live-only release candidate — 1 November 2026

**PREVIEW ONLY. Not live; no production deployment, promotion or domain assignment.**
The owner will review the preview before Cody releases it. Base: `ec24ba1`, the source of live
`dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8`. Branch: `codex/instaplaque-template-release-20261101`.

## Included and excluded

Included: the products-first template on memorial, bench, garden, tree, brass, stainless steel, opening and
custom; the slim cookie bar site-wide; the sixteen finish crops. Ported from `df652c9..3f71827` only.
The title, description, H1 and canonical of every template page equal live.

Excluded: all four occasion pages (house name, donor recognition, church, professional brass), category v2 on
portrait, homepage schema additions, anonymous/default Vercel visit counting, the Statistics switch and the
combined-preview cookie/privacy text. Live's `/cookies`, `/privacy`, feed, sitemap, product pages, designer,
backend and analytics implementations are retained. No database, ads, Merchant Center or live settings changed.

`51c25fa` is the live-only port. The independent files were applied as the Stage 2 delta; Shopfront only gains
the template branch, CSS only the template/player/slim-notice rules, and package.json only the template check.
The cookie component retains live's functions and button order; the full wording still says optional analytics,
recording with typing hidden, and ads. The short phone wording is the reviewed slim bar. No anonymous-counting
claim. All consent sources (`index.html`, `index.tsx`, Meta, PostHog, replay, Vercel redaction and the static
notice fallback) are unchanged from `ec24ba1`.

### Owner follow-up: separate proof and video (message 8603)

`1d9070b` is a separate commit for this request on all eight pages. The free-proof section has only its heading,
three steps, sample PDF image/link, Design online / Send words on WhatsApp buttons, the design-form line and any
page-specific organisation note. Immediately after it is a distinct “See the designer in action” section.
The film is **350 × 438 px on a 390 × 844 phone**, **480 × 600 px on a 1440 × 900 desktop**, centred, with a
75svh height cap. The existing source film is actually **4:5**, not 9:16; its aspect ratio is preserved without
cropping or stretching. Tap-to-play, lazy poster, preload none, no autoplay and existing tracking remain.
One short footnote, from catalogue days: “*Sped up. Most plaques are made in 5 working days; aged brass 7,
wood-backed 10–15.” The watch-page link stays underneath. No large disclaimer beside the film.
First screens, LCP photos, cards, prices and “Aged brass: 7 working days” lines are unchanged by this follow-up.

### Per-page off switch

`templatePages` in `services/categoryTemplateSwitch.ts` (re-exported by `CategoryTemplatePages.tsx`) is the shared
switch. Set a slug to false, or remove it, to restore **live's original layout AND FAQs/schema**, not category v2.
Seven changed FAQ arrays in commerce keep their exact live alternatives; memorial's FAQs were already unchanged.
The final build enables all eight. Release check manifests intentionally require these eight; if a future release
changes that approved set, update its test expectations too. The fallback build check below runs the render/build
script without the eight-template postbuild assertions, then verifies every page against live.

### Absent-route links removed

Five links to four unpublished routes were dropped with their surrounding invitation sentences:

- Memorial: `/church-plaques` (“For an agreed church memorial or pew inscription…”).
- Brass: `/house-name-plaques` and `/professional-brass-plaques` (“Naming a place?…”).
- Opening: `/donor-recognition-plaques` and `/church-plaques` (“Thanking supporters?…”).

No replacement route was invented. All other contextual links remain. The template static check now validates
**every** internal link, including designer links (previously excluded), against files in this build.

## Verification and evidence

Evidence root (workspace): `output/instaplaque-category-template-20261101/release/`.
Reference: untouched `ec24ba1` built first with `cody-job -- npm run build`, all postbuild checks passing;
copy retained at `tmp/cat-release/ref-ec24ba1-dist`. package-lock.json is identical, so node_modules is a symlink
to the Stage 2 worktree's already-installed dependencies. No source files in another worktree were modified.

- `npx tsc --noEmit -p tsconfig.check.json`: **PASS** (`logs/typecheck-final.log`).
- Final `cody-job -- npm run build` plus all postbuild checks: **PASS** (`logs/release-build-final.log`), with the same JS/CSS bundle names as the browser-tested build..
- `check-category-template-browser.cjs`: **PASS**, 24 runs (eight phone, desktop and no-JS cases), 58 cards
  exercised. All first cards start at 296 px (steel 325 px); no overflow or JS errors; LCP remains a studio card
  photo; video loads once only after tapping, plays/pauses, zero measured layout shift. Every chip and swatch,
  tree preset and opening planner passed. JavaScript-off: H1, cards, card/swatch links, prices and six FAQs remain.
- `check-cookie-banner-clear.cjs`: **PASS**, seven live routes at 390 × 844 and 1440 × 900, including home,
  three templates, portrait, a product and designer; notice 52 px / 58 px, all required headings/buttons/cards clear.
  Accept/Reject persist yes/no for analytics/replay/ads, Settings opens /cookies, scrolled contact bar stays tappable.
- `check-category-pages-browser.cjs`: **PASS**, portrait equals reference section geometry, images, links and SEO
  at 390 / 1440 px (7435 / 6617 px main height).
- `check-posthog-analytics.cjs`, `check-promo-video-tracking.cjs`, `check-session-replay.cjs`,
  `check-analytics-redaction.mjs`, `check-google-purchase.cjs`: **PASS**, logs retained.
- Template static gate: **PASS**, 58 studio-led cards, all 504 unique-within-page internal destinations built;
  exact SEO/FAQs, catalogue prices/lead times and 3,282 independently checked opening-planner dates.
- All-switches-off build: **PASS**: all 200 routes reduce to notice-only changes, zero content differences; all eight original FAQ arrays/schema restored. Final switches and release build restored afterward (`fallback-route-diff-vs-ec24ba1.json`)..

| Page | First card, notice open | New phone screens |
| --- | --- | --- |
| /memorial-plaques | 296 px | 7.13 |
| /bench-plaques | 296 px | 6.04 |
| /garden-plaques | 296 px | 6.86 |
| /tree-memorial-plaques | 296 px | 6.83 |
| /brass-plaques | 296 px | 6.47 |
| /stainless-steel-plaques | 325 px | 6.36 |
| /opening-plaques | 296 px | 7.02 |
| /custom-plaques | 296 px | 6.67 |

### Intended check changes

- `check-category-template.mjs`: eight templates, current SEO, exact FAQs/schema, cards/links/prices/timing, assets,
  opening planner; absent occasion links removed; separate video immediately after proof with short footnote.
- `check-from-prices.mjs`: template cards/swatch/size prices replace removed old-layout tiles; no occasion routes.
- `check-category-template-browser.cjs`: keeps every interaction/no-JS check; verifies the large film and 75% cap.
  The old 6.7-screen budget becomes 7.6 because the owner explicitly asked for a larger separate video section;
  actual page lengths are reported, not hidden. `SMALL_SCREENSHOTS=1` saves only phone first-screen JPEGs.
- `check-cookie-banner-clear.cjs`: only live routes, including portrait; expanded to both 390 and 1440 widths.
- `check-category-pages-browser.cjs`: compares portrait's full section geometry, images, links and metadata with
  the actual live-source build at both widths. It does NOT assert the combined preview's unapproved v2 layout.
- `check-google-purchase.cjs`: the live test harness was stale (expected the library on evaluation). It now fires
  the live bootstrap's `load` event and timer. Production code remains unchanged; purchase/consent assertions stay.
- `check-template-release-scope.py`: file-by-file gate described below; switches-off mode proves live fallback.

### Route diff

`python3 scripts/check-template-release-scope.py /home/coding-agent/workspace/tmp/cat-release/ref-ec24ba1-dist dist /home/coding-agent/workspace/output/instaplaque-category-template-20261101/release/route-diff-vs-ec24ba1.json`

**PASS:** 2,191 reference files → 2,207 release files. Eight routes change content, exactly the intended eight;
192 HTML routes differ only in the cookie notice; three standalone HTML files are byte-identical.
All eight titles/descriptions/H1s/canonicals match the reference exactly. Sitemap is **byte-identical**;
no other non-bundle file changed, no page/file removed, only the sixteen finish WebPs added (plus hash-named
JS/CSS bundles). Full HTML is compared after normalising bundle filenames and removing only the static cookie
section, so structured data and hidden markup are included, not just visible text. `/cookies`, `/privacy`, home,
portrait and all product routes therefore retain their exact live content.

### Screenshots

`after/`: eight small 390 × 844 first-screen JPEGs with the notice. `release-vs-stage2-first-screens.jpg` pairs
release and Stage 2 per page; `telegram/` contains its <=1600 px / <=600 KB copy.
`telegram/memorial-proof-and-video-phone.jpg`: the two distinct sections (390 × 937, about 61 KB).
Only small PIL JPEG previews were opened for review, never the full-size Stage 2 PNGs.

The paired phone first screens have the same layout, copy, photos, first-card positions and 52 px notice.
The short phone notice was already the same wording in Stage 2; desktop now uses live's consent wording without
anonymous counting. Screenshot pixels differ slightly because Stage 2 used Vercel image optimisation/2× PNGs and
this local build uses originals/1× JPEGs. No first-screen layout difference was found.
Below the first screen, intentional differences are the owner-requested separated/larger proof/video sections
and the five absent-route links removed above. These are not presented as notice-only differences.

## Preview

**Ready, target preview:** https://instaplaque-etn8xqef9-dullaghan31-3959s-projects.vercel.app (`dpl_Y65CRMBo73eaE9h84eanyEMD3mDz`), built from `6dea61f`.
Cloud build and every postbuild gate passed. Local API probes returned 403 JSON; no checkpoint or re-login.
Hosted smoke checks: **13/13 HTTP 200**, through `vercel curl`, requests spaced ten seconds apart: all eight
templates, home, cookies, privacy, portrait and a product. Each matches the browser-tested local build
for body copy, title/description/H1/canonical, JSON-LD and the live consent bootstrap; all template card counts
and the separate video/short footnote are present. (`hosted-http-results.json`, `hosted-content-results.json`.)
Hosted interactions were not re-run in a browser; the complete interaction checks ran on localhost.
`vercel inspect instaplaque.co.uk` before and after confirms **production unchanged** at
`dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8` (Ready, target production). No production command was run.
All task browsers and the localhost server were closed; unrelated processes were left alone.

The existing `.vercel/project.json` was copied from Stage 2; project remains `instaplaque`, scope
`dullaghan31-3959s-projects`, not a new project. Git deployment is disabled in vercel.json; the task branch push
cannot publish production. Probe `https://api.vercel.com/v2/user` must be JSON (unauthenticated 403) before deploying;
HTML means a checkpoint, not expired login. Preview deploy only:

```sh
flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock \
  vercel deploy --yes --scope dullaghan31-3959s-projects
```

## Production release — Cody only, AFTER the owner's yes

These are instructions, **not actions taken by this task**. First inspect `instaplaque.co.uk`; if live is no longer
`dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8`, reconcile the intervening production changes before release. Use this worktree,
verified pushed SHA and existing `.vercel/project.json`; keep all eight intended switches enabled.

1. Re-run typecheck, the build with all postbuild checks and the release scope gate against the verified live source.
2. Probe the API; if checkpointed, wait as above, never re-login to “fix” a checkpoint.
3. Under the shared lock, stage a production build without moving domains:

```sh
flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock \
  vercel deploy --prod --skip-domain --yes --scope dullaghan31-3959s-projects
```

4. Inspect that staged deployment: Ready, target production, correct project/source. Use `vercel curl` against its
   deployment URL to check all eight pages, home, portrait, cookies/privacy, a product, consent, assets and feed.
   Confirm the first screen, proof/video split and interactive designer entry. Do not create orders in smoke tests.
5. Only after those checks, under the lock:

```sh
flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock \
  vercel promote <verified-staged-deployment-id> --yes --scope dullaghan31-3959s-projects
```

6. Independently inspect both apex and www aliases, verify public pages and sitemap, then resubmit the sitemap
   (not the Merchant feed; the feed is unchanged): from `/home/coding-agent/workspace`, run
   `python3 -I output/instaplaque-google-visibility-tools/post_release_submit.py gsc`.
   Record the receipt, deployment id, full source SHA and rollback in HANDOVER.md. Watch Search Console afterward.

Rollback (only if a release has happened):

```sh
flock /home/coding-agent/workspace/tmp/instaplaque-vercel-deploy.lock \
  vercel promote dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8 --yes --scope dullaghan31-3959s-projects
```

Verify aliases/content, then resubmit the reverted sitemap. No database rollback is required.
