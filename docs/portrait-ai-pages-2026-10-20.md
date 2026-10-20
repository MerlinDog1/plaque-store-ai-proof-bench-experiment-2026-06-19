# Portrait plaques, AI design and the proof PDF — 20 October 2026

Owner msg 5178: "I want a section on homepage and a whole fresh page that is entirely just about
portrait plaques, you can say using our portraits in metal technology and subtle link to other site
etc. Use assets from that page. Have a section in the homepage and another whole page dedicated to
taking your ai design from concept to reality. Use imagen to make images as needed for that one.
Also have something on wherever it makes sense that shows hey we'll send you a great looking pdf
with all the dimensions and fixing info etc yeah. Make a fresh pdf if you need assets. All the
while do whatever you can to boost organic traffic".

Branch `codex/instaplaque-portrait-ai-pages-20261020`, built on the live release `2b82cc2`.

## New pages

- **`/portrait-plaques`** (`ShopPortraitPlaques` in `components/FeaturePages.tsx`)
  - **Search metadata:** title "Portrait Plaques UK | Engraved From Your Photo | InstaPlaque"; H1
    "Personalised portrait plaques".
  - **Calls to action:** WhatsApp or email your photo. A subtle text link "Request a free sketch
    online" goes to Portraits in Metal `/free-proof`, with UTM tags.
  - **Real Millie photographs:** the owner's photo, the engraving artwork and the finished plaque, plus a
    close-up of the plaque.
  - **Illustrative gallery:** seven designs, captioned as illustrative.
  - **Sizes, finishes and display:** A5/A4/A3, six finishes, 1.5 mm metal, wall-fixed, backing,
    folded or easel. From £95.50 (A5), UK mainland delivery.
  - **Photo tips and FAQs:** six FAQs, with FAQPage schema.
  - **Closing link:** a subtle link to portraitsinmetal.com.
  - **Facts:** these follow the live PIM site checked on 17 and 20 October: free sketch, six finishes,
    A5/A4/A3, hand paint-infilled, dispatch normally 5–10 working days, UK mainland delivery. PIM
    currently shows a launch price of £76.40 until 31 October; this page uses the standard £95.50.
- **`/ai-plaque-design`** (`ShopAiDesign`)
  - **Search metadata:** title "Turn Your AI Plaque Design Into a Real Plaque | InstaPlaque"; H1 "Turn
    your AI design into a real plaque".
  - **Calls to action:** WhatsApp, the design form or email.
  - **Concept → plaque pair** for the Margaret Rose example.
  - **Four steps** and a **what-changes table:** 3D/glow/garbled text become engraved lines and
    real fonts.
  - **Proof PDF showcase:** the same Margaret Rose design.
  - **Second pair:** a Willow Cottage house sign.
  - **Tips, FAQs and close:** tips, six FAQs (FAQPage schema) and a closing call to action.
- **Structured data:** both pages carry Service plus BreadcrumbList plus FAQPage in the prerender
  and after hydration, via `portraitSchema` / `aiDesignSchema` and the visible FAQs.
- **Share images:** branded 1200×630 cards, `og-portrait-plaques.jpg` and `og-ai-plaque-design.jpg`.
  The generator now supports cards outside the catalogue and a per-card kicker.

## Homepage and site changes

- **Homepage, after "Want us to take care of the design?":**
  - `ProofPdfShowcase`: "A proof you can check properly.", a stacked image of the PDF pages and a
    link to the sample PDF.
  - `HomeAiSection`: the concept → plaque pair, "Send us your design" on WhatsApp, and "How it
    works" linking to `/ai-plaque-design`.
  - `HomePortraitSection`: Millie's real photo and finished plaque plus Alfie and Thomas
    illustrations, "See portrait plaques", WhatsApp, and a subtle "More at Portraits in Metal" link.
  - The old "Our sister site" block is removed.
- **How it works:** a proof showcase, "Prefer us to design it? You'll get a proof like this."
- **Design form:**
  - Its "Review your emailed proof" step links to the sample proof.
  - Reference images over 2 MB are now shrunk in the browser to a JPEG (2048, then 1600, then 1200 px)
    instead of being refused. ChatGPT PNGs are 2.4–3.2 MB.
  - Label: "large images are resized". The note mentions AI designs.
- **Navigation:** the header gets **Portraits**. On phones Materials is hidden so four links still
  fit. The footer adds Portrait plaques and AI design to plaque.
- **Internal links:**
  - The memorial and garden guides now link to `/portrait-plaques`. They no longer say "sister brand"
    or "in preview".
  - The contact page's ChatGPT hint links to `/ai-plaque-design`.
- **About page, per the owner's 17 October feedback** (msg 4908, "didn't like all the sister company
  sole trader stuff"; prepared on the unreleased portrait branch):
  - No "sister brand" or "sole trader" wording.
  - Portraits in Metal is "our portrait studio".
  - `businessContact.legalForm` is removed, along with the contact-page "sole trader" small print and
    the legal contact page's "Trading identity" row. The Terms still say "not VAT registered".
  - The image-honesty note now says real photographs are labelled as such.
- **Mobile bar:** `MobileContactBar showDesign={false}` (WhatsApp plus Email) on the portrait page.

## Organic search

- **Sitemap:** the two new URLs, with image entries, and today's `lastmod` on the 14 pages changed
  today. `check-live-seo` now expects 22 editorial URLs, prerendered H1s, visible FAQs and FAQ
  schema, and homepage links to both pages.
- **Internal links:** the header, footer, homepage sections, guides, contact page and design form
  all link to the new pages.
- **`public/llms.txt`:** a plain summary of the pages for AI search tools.
- **Sample proof PDF:** `public/samples/instaplaque-sample-proof.pdf` (3 pages, 544 KB, selectable
  text, titled) can be indexed.
- **Analytics:** both paths are added to the PostHog public path list. Contact links on the pages use
  the `hero` and `page` placements.

## Assets

- **Portraits in Metal images:** copied from portraitsinmetal.com `/images/...` into
  `public/site-images/portraits/` (2.3 MB in total).
- **AI images:** generated with `image_generate` (OpenAI gpt-image; Google Imagen isn't connected),
  output in `output/instaplaque-ai-page/`, web copies in `public/site-images/ai/`.
  - Concepts `ai-concept-memorial` and `ai-concept-house` were made from text.
  - `ai-real-memorial` was made from the proof's plate artwork, so it matches the PDF.
  - `ai-real-house` was made from the house concept.
  - All are labelled as illustrations of a fictional example.
- **Sample proof:** generator `output/instaplaque-sample-proof/source/sample_html.py` plus
  `render.mjs` (EB Garamond 400/400 italic/500 embedded). Run `python3 sample_html.py`, then
  `cody-job node render.mjs OUT.pdf`. Page images are in `public/site-images/proof/` (1400 and 760
  wide). The fictional Margaret Rose garden plaque: 300 × 200 mm brushed brass, a rose-and-vine
  border, four Ø15 mm caps 16 mm from each edge (268 × 168 mm between centres), with specification,
  fitting steps and approval. Price is a placeholder.

## Checks

- **Build:** typecheck, posthog, consent, redaction, purchase and build (all postbuild checks,
  including the updated live-SEO check) pass.
- **Local browser checks at 390 and 1440 px:**
  - No page errors and no horizontal overflow on home, portrait, AI, how-it-works and about.
  - The phone nav reads Memorial | Bench | Openings | Portraits.
  - The portrait page bar shows WhatsApp and Email only.
  - The About page has no "sister" or "sole trader".
  - The design form accepted a real 2.6 MB AI PNG as a shrunk JPEG.
  - `/samples/instaplaque-sample-proof.pdf` returns 200 application/pdf.

## Release — about 21:52 UTC (owner msg 5193 "Publish")

- **Release:** live `dpl_6wifdbq5WGwSzQhU3gMbXnhJ9ZRd` (`index-_aX5f43b.js`, sha256
  `370c51d7613da2b5…`, the same as the local build). Both health endpoints are OK. Rollback:
  `dpl_BDFdvxSqAhkRNsPn5cCALgNzGPwd`.
- **Pre-check:** live was still `dpl_BDFdvx…`, so nobody else had deployed.
- **Candidate check:** the sample PDF matched the local file byte for byte, and both new pages had
  their H1 and share card.
- **Live checks:**
  - Home, portrait, AI, memorial, garden, how-it-works, about, contact, design-request and design all
    return 200 with the new bundle.
  - `sitemap.xml`, `llms.txt`, the sample PDF and the new images are served with the right types.
  - The sitemap lists both new URLs. About has no "sister" or "sole trader".
  - The browser check at 390 and 1440 px with analytics blocked passes: no errors and no overflow.
    The phone nav reads Memorial | Bench | Openings | Portraits, and the portrait page bar is
    WhatsApp and Email. The design form accepted a 2.6 MB AI PNG as a shrunk JPEG; nothing was
    submitted.

## Phone contact bar appears on scroll — released about 22:09 UTC

Owner msg 5196 (a screenshot with the bottom bar circled): "What about if these didn't appear until
you scrolled down and they had a tiny like highlight animation when they appeared?" Commit `8bbc657`.

- **When it shows:** `MobileContactBar` (Design / WhatsApp / Email; WhatsApp / Email on the portrait
  page) stays hidden while the page's own `.shop-hero-choices` buttons are on screen or still below
  the fold. It slides up once they have scrolled off the top, using an IntersectionObserver.
  `<main>` scrolls under the sticky header, so the buttons stop intersecting about 13 px before
  their bottom edge reaches 0. The test is therefore "not intersecting and above mid-screen", not
  `bottom <= 0`. The bar hides again when you scroll back to the top.
- **Highlight:** the first reveal plays two soft teal glow pulses on the WhatsApp button
  (`shop-bar-glow`); later reveals only slide. Reduced-motion users get neither. Without JS the bar
  stays hidden and the page buttons remain. While the bar is hidden, the cookie banner sits at the
  bottom edge.
- **Checks:**
  - Typecheck and build (all postbuild checks) pass.
  - At 390 px, locally and live, on home, memorial and portrait: the bar is hidden at the top,
    visible with the highlight after scrolling, highlight cleared after the glow, hidden again at
    the top, and back again without a replay. No page errors.
- **Demo clip:** `output/instaplaque-mobile-bar/bar-reveal-demo.mp4`, recorded with Playwright
  using `/usr/bin/ffmpeg` symlinked as `~/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux`.
- **Release:** live `dpl_7SNmV88h5iMYaW1AqTUrsu4LFgQf` (`index-BbfNuxCX.js`, sha256
  `58d698d43874409d…`, the same as the local build); health endpoints OK. Rollback:
  `dpl_6wifdbq5WGwSzQhU3gMbXnhJ9ZRd`.

## Willow Cottage illustration re-shot — released about 22:16 UTC

Owner msg 5198, with a screenshot of the "Made in metal" house sign circled: "You'll need to do that image
again so fits the wall better". The old picture had the sign running up to the door frame and not
looking fixed to the wall.

- **New image:** `ai-real-house` was regenerated with `image_generate`, using the previous image as
  the design reference: the same engraved brushed-steel oval, now flat, level and centred on
  white-painted brick, about 1.5 bricks wide and under 3 courses high, with the door frame only at the
  far edge. The source is `output/instaplaque-ai-page/ai-real-house-v2.png`. Same file names
  (`public/site-images/ai/ai-real-house-640/1200.webp`); the live cache-control is
  `max-age=0, must-revalidate`, so no rename was needed. Alt text updated. Commit `576e779`.
- **Release:** live `dpl_6oFFiLU8XivENvzXna1bkGtoYbJH` (`index-BwzcBT9V.js`, sha256
  `8b18c7ffec749854…`, the same as the local build). The live image is byte-identical to the
  repository copy, and the phone check of the section showed no errors. Rollback:
  `dpl_7SNmV88h5iMYaW1AqTUrsu4LFgQf`.

## Preferred rose plaque and matching proof — released about 22:26 UTC

Owner msgs 5199 and 5205 ("Also this rose plaque is better actually", "See this one"): the fuller
rose-and-vine version (generated from the AI concept, `ai-real-memorial-from-concept.png`) replaces
the proof-derived one as "The plaque we make" on home and `/ai-plaque-design`. Commit `ccd859a`.

- **Retouch:** one top-centre vine stroke had a red tint, which engraving infill would never have.
  It is recoloured to black (green-to-red ratio test, brass area only). The result is
  `output/instaplaque-ai-page/ai-real-memorial-rose-final.png`.
- **Sample proof:** the plate now follows that photo. Lettering is upright at the photo's
  proportions (name 30 mm font size, 19.5 mm capitals; other lines 14–14.5 mm). Corner roses are
  larger, with three petal rings. Vines are leafier (3.5 waves per top half, 3 per side), with veined
  leaves and a centre V under a leaf with curling tendrils. The cap-height callout was dropped from
  the drawing; the spec table gives it. The previous generator is saved as
  `source/sample_html.before-rose-match.py`. The PDF, proof page images and the AI share card were
  regenerated.
- **Release:** live `dpl_BsVM7nacMAiyb29Pz7yt4LEaaNgf`. The bundle is unchanged (`index-BwzcBT9V.js`);
  the changed image, PDF and card files are byte-identical live. Rollback:
  `dpl_6oFFiLU8XivENvzXna1bkGtoYbJH`.

## Sample proof border traced from the chosen plaque — released about 22:37 UTC

Owner msg 5209: "No you'll need to use imagen and trace to get border correct" (the hand-drawn vine
border didn't match the chosen photo closely enough). Commit `45731dd`.

1. **Line art:** `image_generate` (OpenAI gpt-image, with the retouched rose photo as reference, 3:2)
   produced flat black-on-white line art of the border only: corner roses, leafy vines,
   tendrils, and the centre leaf with curls top and bottom; no text. Saved as
   `output/instaplaque-sample-proof/border/rose-border-lineart.png`.
2. **Trace:**
   - Doubled with Lanczos, thresholded at 140 and cropped to the ink (aspect 1.602).
   - Traced with **potrace 1.16** (`potrace -s --flat -t 12 -a 1.1 -O 0.35`) into one vector path:
     `border/border.svg`, 160 KB.
   - potrace was installed today with `sudo apt-get install potrace`; `apt-get remove potrace` undoes
     it.
3. **Placement:**
   - `sample_html.py` embeds the traced path in the plate as a nested SVG in the box 10–290 ×
     9–191 mm.
   - It is masked clear for 10.5 mm around each of the four screw caps, so no engraving runs under a
     cap or hole.
   - The art's clear middle (about 202 × 115 mm) holds the unchanged wording.
   - The previous generator is saved as `sample_html.before-traced-border.py`.
4. **Output:** the PDF (3 pages, 762 KB) and proof page images were regenerated.
5. **Release:** live `dpl_FpYhtGvBHURdPnnkkGsDE15H8jJH`. The bundle is unchanged
   (`index-BwzcBT9V.js`); the PDF and page images are byte-identical live. Rollback:
   `dpl_BsVM7nacMAiyb29Pz7yt4LEaaNgf`.

## Sample PDF link versioned — released about 22:54 UTC

Owner msg 5217 (phone screenshot of the first sample proof): "This wants updating too right? The
pdf". The live file was already the traced-border version (sha256 `168cad6281c7…`, last-modified
22:37 UTC). The phone was showing the copy Chrome had kept from an earlier visit.
`sampleProofPdf` and the design-form link now use `/samples/instaplaque-sample-proof.pdf?v=3`; bump
the number whenever the PDF changes. Commit `2a821d5`. Live `dpl_7ozNAjg73UxbARZppVd1ZTodGeBx`
(`index-ByhiNXyg.js`, the same as the local build); rollback `dpl_FpYhtGvBHURdPnnkkGsDE15H8jJH`.

## Proof and AI image URLs versioned — released about 23:00 UTC

Owner msg 5220: "I think you had or have the old one on homepage still". The live homepage already
served the traced-border previews: every proof and AI image matched the repository byte for byte,
and a fresh 390 px browser showed the new art. The owner's phone was showing images cached from an
earlier visit. `featureImageVersion = 'v=3'` (in `FeatureSections.tsx`) is now appended to the proof
page images and to the AI concept/plaque images on home and the AI page; bump it whenever one is
redrawn under the same file name. Commit `22d7e0c`. Live `dpl_2C2nqMKWWAW6QGbJg3nCCL9xaYhb`
(`index-DhcGNtTK.js`, the same as the local build); rollback `dpl_7ozNAjg73UxbARZppVd1ZTodGeBx`.

