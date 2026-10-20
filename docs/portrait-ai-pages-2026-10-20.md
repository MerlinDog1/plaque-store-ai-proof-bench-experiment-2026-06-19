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

NOT DEPLOYED: waiting for the owner's go-ahead.
