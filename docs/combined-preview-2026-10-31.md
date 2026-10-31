# Combined preview: category pages v2 + four occasion pages + anonymous visit statistics — 31 October 2026

**PREVIEW ONLY. Not merged into the live source, not live.** Owner go: msg 8314 ("OK do this"), replying to msg
8273, which offered to put the three previews together with four fixes into one preview for approval.

- **Branch:** `codex/instaplaque-combined-preview-20261031`, from the live source `ec24ba1`
  (`codex/instaplaque-feed-studio-photos-20261031`, live as dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8).
- **Merged:** `codex/instaplaque-category-pages-v2-20261031` (862177e, docs/category-pages-v2-2026-10-31.md),
  `codex/instaplaque-seo-landing-pages-20261031` (4481023, docs/seo-landing-pages-2026-10-31.md) and
  `codex/instaplaque-cookieless-stats-20261031` (32ea493, docs/cookieless-stats-2026-10-31.md).

## How the branches were combined

- Category pages v2 and the occasion pages both changed `components/CategoryLanding.tsx`. The v2 layout is kept
  (photo-first heroes, studio-photo picks, folded price tables, `CategoryProof` instead of the old steps, quality and
  proof rows). The occasion pages' additions are carried onto it: hero `intro`, catalogue-photo `src`/`srcSet`,
  `designHref` (Design online opens the pictured plaque), and an optional `notice` section.
- The occasion pages keep their own heading-first hero (`photoFirst: false`), as in their preview, so a search
  visitor sees the title and price on the first phone screen. The other category pages are photo-first as in v2.
- The occasion pages' proof row is now the v2 `CategoryProof` with the pictured plaque's own sample PDF
  (`sampleSlug: page.heroSlug`); their own three steps are kept. `proofCopy` and `film` no longer exist.
- `package.json` postbuild runs both branches' checks (`check:statistics` … `check:google-purchase`, then
  `check:occasion-landings`). `shopfront.css` keeps both appended blocks.

## The four fixes promised in msg 8273

1. **Cookie notice.** Shortened to the length of the notice before visit counting, while still naming the
   recordings, the ad cookies, the anonymous count after Reject and the Settings page (`components/MetaConsent.tsx`).
   On phones it now sits at the top of the screen (`shopfront.css`, last block), so it no longer takes the taps for a
   page's Design online / Design on WhatsApp buttons, the Design/WhatsApp/Email bar or the designer's Continue
   button (site audit item 1). Computers keep the bottom-centre card. New local check:
   `scripts/check-cookie-banner-clear.cjs`.
2. **No Metal House Signs link.** The house name page's notice pointed at MHS's private preview; it is removed until
   MHS has a live domain. `check-occasion-landings.mjs` now asserts there is no such link.
3. **Practices page photo.** `professional-brass-plaques` uses the orbital brass 200 × 150 on dark wood studio photo
   ("THE STUDIO"), a name plate, instead of the donor page's clubhouse opening plaque. Its designer link and "Design
   online starts with the pictured plaque at £162" follow the same product.
4. **Privacy wording.** The statistics paragraphs on the privacy and cookies pages say Vercel records approximate
   location (country, region and town or city), matching Vercel's Web Analytics data points, not just country.

## Checks (local, 31 Oct 2026)

- `npx tsc --noEmit`: pass. `npm run build` with every postbuild check: pass (log: workspace
  `output/instaplaque-combined-preview-20261031/build2.log`).
- Served with `PORT=4390 HOST=127.0.0.1 REVIEW_FOLLOWUP_CHECK_INTERVAL_MS=0 cody-job -- node server.mjs`:
  - `check-category-pages-browser.cjs`: 9 category pages, phone and desktop, PASS.
  - `check-occasion-landings-browser.mjs`: 8 phone/desktop cases PASS.
  - `check-site-statistics-browser.cjs`: 5/5 consent cases PASS (no choice, Reject, Accept, off before a choice,
    off after Accept).
  - `check-cookie-banner-clear.cjs`: with the notice open on a 390 × 844 phone, the hero buttons on the home,
    memorial, house name, practices and a product page, the designer's Continue button and the scrolled-in contact
    bar all receive their own taps.
- Screenshots: workspace `output/instaplaque-combined-preview-20261031/` (`banner-shots/`, `category-shots/`,
  `occasion-shots/`).

## Deployed preview

- https://instaplaque-71953q1r8-dullaghan31-3959s-projects.vercel.app (Vercel login/protection applies).
- `dpl_C6FwCsVctpDwZZCJp3R1yQKpzRm1`, target **preview**, **Ready**, built from `cf000e5`; one `vercel deploy` under
  the shared lock (workspace `tmp/instaplaque-vercel-deploy.lock`). Cloud build and every postbuild check passed
  (including `check:statistics` and `check:occasion-landings`).
- Hosted spot checks (`vercel curl`): house name page has no Metal House Signs link; practices page uses the
  orbital brass 200 × 150 dark wood plaque; the bundle has the new notice and location wording and not the old
  notice text.
- Production unchanged: `instaplaque.co.uk` still `dpl_EswXoDLFZF7164E7ZrU1JP5MRMe8` after the deploy.

## Release

Nothing goes live without the owner's approval of this preview. To release later: deploy this branch with
`vercel deploy --prod --skip-domain`, check it, then `vercel promote`, as in HANDOVER.md; resubmit the sitemap,
because it gains the four occasion pages.
