# Four SEO landing-page candidates — PREVIEW ONLY, 31 October 2026

## Scope and source

Prepared for the owner's selection, not publication. Based on live-source record `ec24ba1` on
`codex/instaplaque-feed-studio-photos-20261031`, in the isolated worktree
`projects/instaplaque-seo-pages-20261031`, branch `codex/instaplaque-seo-landing-pages-20261031`.
No production deployment, alias/promotion, account settings, Search Console submission,
database write, enquiry, email, model generation or payment is part of this work.
`HANDOVER.md` is untouched. Git deployment is disabled in `vercel.json`; `codex/` pushes do not publish.

| Candidate | URL path | Featured catalogue choices |
| --- | --- | --- |
| House names | `/house-name-plaques` | 150 × 50 steel/brass strips, polished brass 200 × 150, aged brass oval 250 × 150 |
| Donor/recognition | `/donor-recognition-plaques` | Small brass and steel donor plates, 300 × 200 brass on light oak, 400 × 300 brass dedication |
| Church | `/church-plaques` | 150 × 50 polished brass and 225 × 75 brushed brass strips, A5 polished brass on dark wood, A4 portrait steel |
| Professional practices | `/professional-brass-plaques` | Small brushed brass strip, polished brass 200 × 150, A5 brushed brass on light oak, A4 orbital brass |

Each uses the existing category components, type, colours, product cards, price table, proof,
wording cards, folded questions and CTAs. No new design system or photos were created.
Existing catalogue images are labelled as examples, not customer commissions. The donor and
practice heroes show an existing opening-plaque configuration with explicit example wording,
not a newly invented donor/practice job. These pages lead with their product image; they do not
repeat the film's five-day headline next to a ten/fifteen-day wood-backed configuration.

The new copy lives in `services/occasionLandingPages.ts`; the category adapter is
`components/OccasionCategoryPages.tsx`. Source data is shared by React and prerendering.
`services/merchantCatalogue.mjs`, catalogue products, the pricing engine and
`services/shopInformation.ts` supply all prices, sizes, selected production days and the
existing production FAQ. No new customer price is typed into copy. The hero distinguishes the
cheapest plate from the pictured configuration; every primary design link has an exact
`/design?plaque=` preset even before hydration. Existing landing defaults are preserved.

## Search and internal links

All four candidates have unique metadata, canonical/OG metadata, one H1, visible breadcrumbs,
CollectionPage, FAQPage and the finaliser's ItemList of the exact linked products. Category pages
carry no Product offer or fabricated reviews. `scripts/finalise-public-html.mjs` already handles
these pages generically; the new output check proves that it does.

Four sitemap entries were added; only the three existing incoming-link pages' dates changed.
Small contextual links: brass → house/practice; opening → donor; memorial → church. No global
navigation expansion. The old `/donor-plaques` → opening redirect is deliberately preserved;
the new donor candidate has its own distinct route until the owner chooses it.

The research handoff reports “brass donor plaques”: 31 Search Console impressions, average
position 17. That supplied evidence informs the candidate; it is not published as customer copy,
not independently re-queried here and not interpreted as search volume. No volume or ranking
promise is made.

## Reverified rules and sources (31 October)

Two read-only helpers verified official pages; the parent read their findings and additionally
fetched the ARB company-name page. URLs are also available to readers in the relevant page.

- Church of England [DAC permissions](https://www.churchofengland.org/resources/churchcare/making-changes-your-building-and-churchyard/talk-your-dac-about-permissions):
  “The faculty jurisdiction is how we manage change to our church buildings, their contents, and
  our churchyards”; “For most works, you will need a faculty”; “Never start any work before you
  have permission.” We recommend parish/DAC discussion before ordering and do not promise an exemption.
- [Chester's plaque guidance](https://www.chesterdiocese.org/content/plaques-) says a faculty is
  always needed for introducing a memorial plaque. Its linked [official memorial-tablet PDF](https://www.chesterdiocese.org/_files/ugd/519181_eb20dfb7b4804a7a8df26129dae550ba.pdf)
  applies an exceptional-case test and **strongly discourages**, rather than bans, small memorial
  plaques on furniture. These restrictions are expressly attributed to Chester, not imposed as
  a universal rule. A design proof, parish conversation or DAC advice is not installation permission.
- [SRA Transparency Rule 4](https://www.sra.org.uk/solicitors/standards-regulations/transparency-rules/)
  specifies website disclosures and letterhead/email authorisation information. It does not
  establish a requirement for an entrance plaque. No placeholder SRA numbers or authorisation
  wording are offered as a template.
- [GDC 6.6.10–11](https://standards.gdc-uk.org/pages/principle6/principle6) says **should** display
  team information (including registration numbers where appropriate), GDC-regulated status and
  the nine principles where patients can see them. It does **not** prescribe a particular poster
  or plaque. [GDC advertising guidance](https://www.gdc-uk.org/standards-guidance/standards-and-guidance/gdc-guidance-for-dental-professionals/guidance-on-advertising)
  also says named registrants must include their registration number in publicity information.
  A simple name plate is not represented as satisfying all those provisions.
- [RCVS chapter 23](https://www.rcvs.org.uk/veterinary-professionals/conduct-and-guidance/supporting-guidance/23-protection-of-title-advertising-and-endorsement):
  23.16 treats practice names as advertising; 23.32 restricts holding out someone as a specialist
  or advanced practitioner unless appropriately registered/listed. No plaque-certification claim.
- [ARB company names](https://arb.org.uk/architect-information/using-title-architect-within-company-name/)
  confirms “architect” is legally protected and its use in a limited-company/LLP name requires
  Board permission. The copy says to use titles only when entitled and check proposed names/marks.
- Accountants: generic accurate-name and entitlement advice only; no unverified ICAEW/ICAS rule.

## What was deliberately omitted

Competitor names/prices; wrong historic starting prices; the US hospice example; RBGE donation
prices/terms; Gift Aid benefit/naming-rights claims; supposed universal church wording, sizes,
waiting periods or acceptance of externally made plaques; unverified Canterbury/Our Lady of
Ransom/St Helen's examples; automatic advertising/planning-consent exemptions; unverified
ICAEW and CQC/dentist rating statements; an RCVS “hospital” rule not verified in the final evidence;
claims of sales volume/popularity; invented endorsements, commissions, ratings or search volumes.
Existing site production/material/fixing wording is reused, not competitor claims.

## Sister-site overlap and release prerequisite

House-name intent overlaps **Metal House Signs**. This candidate is deliberately limited to
simple engraved catalogue name plates; decorative signs, cut lettering and house numbers are
referred to MHS. Portrait and pet landing pages were not created; PIM's portrait focus and its
existing InstaPlaque links are unchanged.

The brief expected an existing MHS footer link, but **none exists in the supplied live source**.
The older `instaplaque-sister-links` report describes PIM, not MHS. Current PIM links are contextual
links with `utm_source=instaplaque`, `utm_medium=referral` and placement-specific campaign/content;
this candidate follows that pattern for MHS, not the removed “sister brand” footer wording.

MHS's checked-in `site.yaml` still says the proposed domain is unregistered and `indexable: false`;
its latest report records only a preview. Do not fabricate a live destination. For owner review,
the link uses the existing verified HTTP-200 preview:
https://metal-house-signs-kiuwjaxsa-dullaghan31-3959s-projects.vercel.app/

**Before any future publication, confirm MHS's live destination and replace this preview-only link.**
This is documented in code as well. It does not block comparing these preview candidates.

## Verification and review record

- Initial typecheck passed; final typecheck/build and browser results are recorded below.
- Existing `check:live-seo` and `check:from-prices` now cover all four candidates.
- New postbuild `check:occasion-landings` checks unique metadata across the sitemap, H1/canonical,
  exact visible/schema FAQ parity, collections/breadcrumbs/product lists, catalogue card prices,
  incoming contextual links, explicit designer presets, every internal link/anchor and image source.
- Initial complete build passed every existing postbuild check and the new check: four pages,
  271 internal links. No remote crawling was used.
- `scripts/check-occasion-landings-browser.mjs` checks 390/1440 px locally on port 4383, saves
  first-screen and full-page screenshots, checks hydration/metadata, images, overflow, FAQ toggle,
  designer price/dimensions and direct-preset entry. External tracking and all API/writes are blocked.
- Screenshots and browser-results.json: workspace `output/instaplaque-seo-pages-20261031/screenshots/`.
- Build/typecheck logs: workspace `tmp/seo-pages-{build,typecheck}.log`.
- Preview deployment uses the existing InstaPlaque project and the shared deploy lock only; no
  production flags, promotion, aliases or domain changes.

### Local verification complete

Application checkpoint: `2b5198ca2922d5fd7ce5b789e7b23484e1b3884e`.
Final typecheck and full build passed, including every existing postbuild check and both extended
SEO/from-price checks. All 175 Merchant products/policies passed. The feed is byte-identical to
the live-source record's built feed, SHA256
`7c654ebcf6dfd8032e78f867c4312b8d1b6fb0b8f60d0e076e8f4b09cfa9675e`.

Eight 390/1440 px hydrated browser cases passed: metadata/canonical/H1, loaded images, both
window and main-pane horizontal bounds, FAQ open/close, primary CTA exact designer price and
physical dimensions. Direct product-preset entry also passed at both widths. No JavaScript
page errors. Sixteen final PNGs were saved; the two first-screen contact sheets and four desktop
full-page overviews were visually inspected. The layout is the existing category design and all
four pages remain readable at phone width.

The first screenshot pass exposed a **test-harness** mistake: the app scrolls `main`, not `window`.
Those captures were replaced after correcting the harness to reset and assert the real scroller.
First-screen images are actual 390 × 844 and 1440 × 1000 viewports. The full-page images keep the
same width and expand the capture height to expose the entire fixed-height app scroll pane;
the viewport is restored before the interaction checks. No application change was needed.

Screenshot filenames: `<page-path-without-slash>-{390,1440}-{top,full}.png` in the directory above.
`review-top-390.jpg` and `review-top-1440.jpg` show all four first screens together.

### Preview build check correction

The first preview upload was only 334 KB, but its build was stopped by the new image-path check:
Vercel's responsive `/_vercel/image?url=…` URLs are generated only with `VERCEL=1`, and the check
incorrectly looked for a literal `dist/_vercel/image` file. No candidate was published by that
failed build. Corrected the check to validate the original local image plus Vercel's configured
width/quality; do not skip image checking. A full local `VERCEL=1` build is required before
retrying the final preview, to cover this actual cloud rendering mode as well as plain local mode.
