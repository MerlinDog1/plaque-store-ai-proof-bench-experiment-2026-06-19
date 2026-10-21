# Fixes from the independent review — 21 October 2026

Owner msg 5231 answered the independent review (output/instaplaque-review-20261021/ on the VPS)
point by point. Real photos and social proof are the owner's to supply later.

## Released about 05:57 UTC — commit `931d4dd`

- **Trader details:**
  - The address, always without the house number, is in the footer of every page, on the contact
    page and in the Organization schema (index.html and merchantPolicyOrganization).
  - The owner's name, Liam Dullaghan, is on the legal pages only:
    - Terms say InstaPlaque is a trading name of him.
    - Privacy names him as data controller and adds the right to complain to the ICO.
  - Values live in `businessContact` (`traderName`, `address`, `postalAddress`).
- **Proof promise:** now "within 3 working hours" on home and the design-request page.
- **Have us design it:**
  - Category, landing and product heroes add "Prefer us to design it? Have us design it – free
    proof".
  - It opens /design-request prefilled with that product's size and material (`onRequestDesign` →
    `handleNavigate('design-request', slug)`).
- **Phone heroes:**
  - Price, then Design online / Chat on WhatsApp, straight under the photo, all on the first
    screen.
  - Buttons sit at y 630–732 at 390 × 844.
  - The lead line and the ChatGPT note are removed from these heroes; the homepage keeps them.
  - Product titles are smaller (26 px on phones).
- **Captions:**
  - No "AI-generated", "Digitally rendered", "Illustrative", "Design example" or "fictional example"
    captions remain. The AI page keeps only the customers' "AI concept" labels.
  - The memorial photo says "Shown: aged brass on dark wood, A5 £178. Brushed stainless steel from
    £95.50."
  - Product images say "Shown with an example inscription. Your wording replaces it."
  - About explains that pictures show example designs and that the proof confirms everything.
  - The product FAQ no longer calls the image a digital illustration.
- **Schema:**
  - Product schema appears only on the 175 exact product pages; the homepage ItemList is plain links.
  - Product breadcrumbs (visible and schema) are Home → category (bench, brass, stainless or custom)
    → product.
  - `check-product-policies` now asserts exactly 175 Product pages and none on the homepage or the
    category and landing pages.
- **/quote:** 301 to /custom-plaques. It is removed from the routes, prerender and sitemap (21
  editorial URLs), and the in-app "Request a quote" button now opens the design form.
- **H1s:** About is "About InstaPlaque: engraved plaques made in the UK"; Materials is "Plaque
  materials: brass & stainless steel".
- **Designer:** the 150 × 50 preset now reads "Compact bench plaque · Smallest" instead of an internal
  default label.
- **Phone speed:** the hidden desktop home photo uses a `<picture>` source that points phones at the
  bench tile they already load.
- **Portrait page:** "UK delivery included", in line with how-it-works.
- **Release:** live `dpl_5hQcQi8bCd9VretcmsUVcWytyVmg` (`index-D4ElwMd4.js`, the same as the local
  build); health OK. Rollback: `dpl_2C2nqMKWWAW6QGbJg3nCCL9xaYhb`.
- **Live browser check of 17 pages at 390 px:**
  - No banned captions, and the owner's name only on Terms and Privacy.
  - The address everywhere, never with a house number.
  - Buttons above the fold, and the design form prefilled "210 × 148 mm | Brushed stainless steel".
  - No page errors. /quote returns 308 to /custom-plaques.

## Portraits in Metal phone number (same request)

- Branch `codex/pim-phone-number-20261021` (`c05e987`) in the PIM repository, from the live
  `53d4967`.
- `lib/business.ts` and the Organization telephone now use 07464 843841.
- Live `dpl_6iv394UTZAMhk5NLgfV1rrkEmojz`; rollback `dpl_9tF1ges3j7sYHmaap5qPAmqm9YqZ`. The live
  pages show only the new number.

## Next

Product pages: realistic photos generated with the designer's realistic-preview pipeline, specs and
size/finish links in the empty block, and sample proof PDFs.
