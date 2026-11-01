# PIM read-only wood-species wording audit

Checked 2026-11-01T15:29:37+00:00. Source: `/home/coding-agent/workspace/projects/pim-pack-outer-border-20261009` at `97fc522`. No repository edits, builds, commits, deploys, backend writes or customer actions. Public HTTP GETs only.

## Summary

- **35 customer-facing source fields/lines** describing PIM backing boards or wooden display examples: **21 oak**, **14 mahogany** occurrences across 5 files.
- **21 additional generator source lines (24 descriptive fields)** repeat those claims; editing only generated metadata would leave regeneration risk.
- **31 additional source lines** contain species in asset keys, filenames or sitemap URLs; these are technical identifiers, not independent wood-specification claims.
- Live: **32 routes requested**, **32 successful responses**, **19 requested routes** contain oak/mahogany in visible text, image alt text, title/ARIA or meta content; 96 matching fields/text nodes, {'oak': 50, 'mahogany': 46}. Counts include repeated images, alt/caption duplication and redirected URLs; not unique product claims.
- No walnut, beech, ash, sapele, teak, birch, maple, hardwood or other searched species were found describing PIM boards/easels/stands in the audited storefront source. Existing purchasing choices/FAQs already use “Light or dark wood” / “wooden backing”.

## Exact customer-facing source contexts

| Source | Exact context |
|---|---|
| `app/page.tsx:43` | `<span>RUBY · POLISHED BRASS ON OAK</span>` |
| `app/page.tsx:220` | `<span>NELL · ORBITAL BRASS ON DARK MAHOGANY</span>` |
| `app/your-free-sketch/page.tsx:52` | `<img src="/images/examples/scene-ruby-1024.webp" srcSet="/images/examples/scene-ruby-480.webp 480w, /images/examples/scene-ruby-640.webp 640w, /images/examples/scene-ruby-1024.webp 1024w" sizes="(max-width:760px) 90vw, 42vw" width="1024" height="1365" alt="Ruby’s cat portrait and engraved kitchen scene on a polished brass plaque with oak backing." loading="eager" fetchPriority="high" />` |
| `app/your-free-sketch/page.tsx:53` | `<figcaption>Ruby · polished brass on oak · illustrative plaque example</figcaption>` |
| `lib/freestanding.ts:47` | 'Polished brass on light oak, supported by a stand behind the board. A portrait for a side table or a quiet corner of home.', |
| `lib/freestanding.ts:64` | 'Polished stainless steel on dark mahogany, with a rear stand. Keep a loved one’s portrait and your own words somewhere you pass each day.', |
| `lib/hero-images.ts:15` | caption: 'Polished brass on oak · brushed stainless steel', |
| `lib/image-assets.json:90` | "caption": "Max · polished brass on light oak with a rear stand", |
| `lib/image-assets.json:91` | "alt": "Border collie portrait and tribute for Max on polished brass with smooth brass caps, light oak backing and a rear easel stand on a side table", |
| `lib/image-assets.json:121` | "caption": "Anne Bennett · polished stainless steel on mahogany with a rear stand", |
| `lib/image-assets.json:122` | "alt": "Illustrative memorial for fictional Anne Bennett, with an engraved portrait on polished stainless steel, silver caps and dark mahogany backing supported by a rear stand on a windowsill", |
| `lib/image-assets.json:183` | "caption": "Alfie · polished brass on light oak", |
| `lib/image-assets.json:184` | "alt": "Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps", |
| `lib/image-assets.json:245` | "caption": "Nell · orbital brass on dark mahogany", |
| `lib/image-assets.json:246` | "alt": "Full sleeping-cat portrait of Nell above a memorial inscription on orbital brass, with a bevelled mahogany board and brass screw caps", |
| `lib/image-assets.json:276` | "caption": "Willow · aged brass on dark mahogany", |
| `lib/image-assets.json:277` | "alt": "Willow stable nameplate with an engraved horse head, the name Willowbrook Belle and owner names Sarah and James, on aged brass and dark mahogany", |
| `lib/image-assets.json:307` | "caption": "Willow · polished brass on light oak", |
| `lib/image-assets.json:308` | "alt": "Horse memorial for Willow, 2006–2024, with a head portrait and tribute on polished brass and light oak, with brass screw caps", |
| `lib/image-assets.json:400` | "caption": "Charlie · aged brass on dark mahogany", |
| `lib/image-assets.json:401` | "alt": "Charlie the tabby cat beside a fuller memorial inscription on aged brass, mounted on dark mahogany and brick with matching screw caps", |
| `lib/image-assets.json:431` | "caption": "Molly · orbital brass on dark mahogany", |
| `lib/image-assets.json:432` | "alt": "Molly the calico cat beside a family tribute on orbital brass and bevelled mahogany with matching screw caps", |
| `lib/image-assets.json:524` | "caption": "Rosie · polished brass on light oak", |
| `lib/image-assets.json:525` | "alt": "Young ginger-cat portrait of Rosie beside a family inscription on polished brass and square-edged light oak, with brass screw caps", |
| `lib/image-assets.json:690` | "caption": "Ruby · brushed stainless steel on light oak with a rear stand", |
| `lib/image-assets.json:691` | "alt": "Siamese cat portrait and family inscription for Ruby on brushed stainless steel with silver screw caps and light oak backing, supported by a rear easel on a table", |
| `lib/image-assets.json:716` | "caption": "Willow · brushed brass on light oak with a rear stand", |
| `lib/image-assets.json:717` | "alt": "Horse portrait beside a tribute for Willow on brushed brass with smooth brass caps, light oak backing and a visible rear easel stand on a table", |
| `lib/image-assets.json:747` | "caption": "Ruby · polished brass on light oak", |
| `lib/image-assets.json:748` | "alt": "Illustrative cat portrait plaque for Ruby, with her kitchen scene engraved in polished brass on light oak, fixed to a plaster wall with brass cover caps", |
| `lib/image-assets.json:809` | "caption": "Helen · brushed steel on oak with a rear stand", |
| `lib/image-assets.json:810` | "alt": "Illustrative family portrait plaque for Helen Williams, with her dining-room scene engraved on brushed stainless steel and light oak backing supported by a rear easel bracket", |
| `lib/image-assets.json:871` | "caption": "Poppy · orbital brass on mahogany", |
| `lib/image-assets.json:872` | "alt": "Illustrative landscape memorial plaque for Poppy the rabbit, with an engraved portrait and familiar surroundings beside a family inscription on orbital brass and mahogany", |

## Generator duplicates (preserve fixes through regeneration)

| Source | Exact context |
|---|---|
| `scripts/prepare-example-images.mjs:38` | 'Max · polished brass on light oak with a rear stand', |
| `scripts/prepare-example-images.mjs:39` | 'Border collie portrait and tribute for Max on polished brass with smooth brass caps, light oak backing and a rear easel stand on a side table', |
| `scripts/prepare-example-images.mjs:44` | 'Anne Bennett · polished stainless steel on mahogany with a rear stand', |
| `scripts/prepare-example-images.mjs:45` | 'Illustrative memorial for fictional Anne Bennett, with an engraved portrait on polished stainless steel, silver caps and dark mahogany backing supported by a rear stand on a windowsill', |
| `scripts/prepare-example-images.mjs:56` | 'Alfie · polished brass on light oak', |
| `scripts/prepare-example-images.mjs:57` | 'Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps', |
| `scripts/prepare-example-images.mjs:68` | 'Nell · orbital brass on dark mahogany', |
| `scripts/prepare-example-images.mjs:69` | 'Full sleeping-cat portrait of Nell above a memorial inscription on orbital brass, with a bevelled mahogany board and brass screw caps', |
| `scripts/prepare-example-images.mjs:74` | 'Willow · aged brass on dark mahogany', |
| `scripts/prepare-example-images.mjs:75` | 'Willow stable nameplate with an engraved horse head, the name Willowbrook Belle and owner names Sarah and James, on aged brass and dark mahogany', |
| `scripts/prepare-example-images.mjs:80` | 'Willow · polished brass on light oak', |
| `scripts/prepare-example-images.mjs:81` | 'Horse memorial for Willow, 2006–2024, with a head portrait and tribute on polished brass and light oak, with brass screw caps', |
| `scripts/prepare-example-images.mjs:98` | 'Charlie · aged brass on dark mahogany', |
| `scripts/prepare-example-images.mjs:99` | 'Charlie the tabby cat beside a fuller memorial inscription on aged brass, mounted on dark mahogany and brick with matching screw caps', |
| `scripts/prepare-example-images.mjs:104` | 'Molly · orbital brass on dark mahogany', |
| `scripts/prepare-example-images.mjs:105` | 'Molly the calico cat beside a family tribute on orbital brass and bevelled mahogany with matching screw caps', |
| `scripts/prepare-example-images.mjs:122` | 'Rosie · polished brass on light oak', |
| `scripts/prepare-example-images.mjs:123` | 'Young ginger-cat portrait of Rosie beside a family inscription on polished brass and square-edged light oak, with brass screw caps', |

| `scripts/prepare-example-images.mjs:17` | ['scene-ruby', 'output/scene-plaques-16/01-ruby-scene.png', 'Ruby · polished brass on light oak', 'Illustrative cat portrait plaque for Ruby, with her kitchen scene engraved in polished brass on light oak, fixed to a plaster wall with brass cover caps'], |
| `scripts/prepare-example-images.mjs:19` | ['scene-helen', 'output/scene-plaques-16/03-helen-scene.png', 'Helen · brushed steel on oak with a rear stand', 'Illustrative family portrait plaque for Helen Williams, with her dining-room scene engraved on brushed stainless steel and light oak backing supported by a rear easel bracket'], |
| `scripts/prepare-example-images.mjs:21` | ['scene-poppy', 'output/scene-plaques-16/05-poppy-scene.png', 'Poppy · orbital brass on mahogany', 'Illustrative landscape memorial plaque for Poppy the rabbit, with an engraved portrait and familiar surroundings beside a family inscription on orbital brass and mahogany'], |

## Live routes with species wording

| Requested live route | Status / matching fields | Species |
|---|---|---|
| https://portraitsinmetal.com/ | 200 / 8 | mahogany, oak |
| https://portraitsinmetal.com/plaques | 200 / 6 | mahogany, oak |
| https://portraitsinmetal.com/dog-memorial-plaques | 200 / 4 | oak |
| https://portraitsinmetal.com/cat-memorial-plaques | 200 / 1 | mahogany |
| https://portraitsinmetal.com/horse-memorial-plaques | 200 / 4 | mahogany, oak |
| https://portraitsinmetal.com/pet-memorial-plaques | 200 / 6 | mahogany, oak |
| https://portraitsinmetal.com/brass-plaques | 200 / 6 | mahogany, oak |
| https://portraitsinmetal.com/stainless-steel-plaques | 200 / 3 | mahogany, oak |
| https://portraitsinmetal.com/plaques/brass-dog-portrait-plaque | 200 / 4 | mahogany, oak |
| https://portraitsinmetal.com/plaques/brass-cat-portrait-plaque | 200 / 5 | mahogany, oak |
| https://portraitsinmetal.com/plaques/stainless-steel-cat-portrait-plaque | 200 / 3 | mahogany, oak |
| https://portraitsinmetal.com/plaques/brass-horse-portrait-plaque | 200 / 5 | mahogany, oak |
| https://portraitsinmetal.com/plaques/stainless-steel-portrait-memorial-plaque | 200 / 2 | mahogany, oak |
| https://portraitsinmetal.com/plaques/brass-companion-portrait-plaque | 200 / 2 | mahogany, oak |
| https://portraitsinmetal.com/materials | 200 / 3 | oak |
| https://portraitsinmetal.com/gallery | 200 / 27 | mahogany, oak |
| https://portraitsinmetal.com/guides/choosing-a-photo-for-engraving | 200 / 2 | oak |
| https://portraitsinmetal.com/about | 200 / 3 | mahogany |
| https://portraitsinmetal.com/your-free-sketch | 200 / 2 | oak |

### Exact live examples

**https://portraitsinmetal.com/**
- alt: “Illustrative cat portrait plaque for Ruby, with her kitchen scene engraved in polished brass on light oak, fixed to a plaster wall with brass cover caps”
- text: “RUBY · POLISHED BRASS ON OAK”
- alt: “Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps”
- alt: “Willow stable nameplate with an engraved horse head, the name Willowbrook Belle and owner names Sarah and James, on aged brass and dark mahogany”
- alt: “Illustrative memorial for fictional Anne Bennett, with an engraved portrait on polished stainless steel, silver caps and dark mahogany backing supported by a rear stand on a windowsill”
- text: “Polished stainless steel on dark mahogany, with a rear stand. Keep a loved one’s portrait and your own words somewhere you pass each day.”
- alt: “Full sleeping-cat portrait of Nell above a memorial inscription on orbital brass, with a bevelled mahogany board and brass screw caps”

**https://portraitsinmetal.com/gallery**
- alt: “Illustrative cat portrait plaque for Ruby, with her kitchen scene engraved in polished brass on light oak, fixed to a plaster wall with brass cover caps”
- text: “Ruby · polished brass on light oak”
- alt: “Border collie portrait and tribute for Max on polished brass with smooth brass caps, light oak backing and a rear easel stand on a side table”
- text: “Polished brass on light oak, supported by a stand behind the board. A portrait for a side table or a quiet corner of home.”
- alt: “Illustrative memorial for fictional Anne Bennett, with an engraved portrait on polished stainless steel, silver caps and dark mahogany backing supported by a rear stand on a windowsill”
- text: “Polished stainless steel on dark mahogany, with a rear stand. Keep a loved one’s portrait and your own words somewhere you pass each day.”
- alt: “Illustrative family portrait plaque for Helen Williams, with her dining-room scene engraved on brushed stainless steel and light oak backing supported by a rear easel bracket”

**https://portraitsinmetal.com/materials**
- alt: “Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps”
- text: “Polished brass on oak · brushed stainless steel”
- meta: “Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps”

**https://portraitsinmetal.com/your-free-sketch**
- alt: “Ruby’s cat portrait and engraved kitchen scene on a polished brass plaque with oak backing.”
- text: “Ruby · polished brass on oak · illustrative plaque example”

**https://portraitsinmetal.com/dog-memorial-plaques**
- alt: “Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps”
- text: “Alfie · polished brass on light oak”
- meta: “Spaniel portrait memorial for Alfie, 2011–2024, in polished brass on square-edged light oak with brass screw caps”

## Exclusions and scope boundaries

- **Willow** is the horse/example name (including “Willowbrook Belle”), not a board species. Preserve names and inscriptions. No tree-inscription species claim was classified as backing material.
- `scripts/verify-etchmaster.mjs:516`, `:537`, `:545`: “A single oak leaf” / “An oak leaf” are image-generation test subjects, not boards; preserve.
- Asset names such as `max-oak-easel`, `anne-mahogany-easel`, `ruby-oak-easel`, `willow-oak-easel` and existing image sitemap URLs are references, not additional prose claims. Do not blindly rename assets or customer/tree text.
- `public/design-pack/renderer.mjs:1`: “olive” is the bundled Three.js CSS colour keyword (`olive:8421376`), not a wood description.
- Current public source areas audited: `app/`, `components/`, `lib/`, `public/`, plus image-preparation scripts. Historical `docs/` and artwork `output/` archives are not current storefront copy and were not counted. Authenticated/customer proof content, text burnt into images and dynamically revealed client-only UI were not fetched or visually inspected.
- Live check parses server HTML visible text and descriptive attributes; scripts/styles and inline hydration data are excluded. This is not a browser interaction test.
- Search terms: oak, walnut, mahogany, beech, ash, sapele, teak, birch, maple, hardwood, softwood, pine, cedar, cherry, elm, sycamore, iroko, acacia, bamboo, rosewood, ebony, poplar, larch, spruce, fir, yew, chestnut, alder, basswood, meranti, rubberwood, willow, cypress, redwood, hemlock, hickory, wenge, zebrano, mango, olive.

## Neutral wording already present

- `lib/catalog.ts:211`: “The optional board adds £59.50 for A5, £85 for A4 or £128 for A3. Light or dark wood, with a square or bevelled edge, costs the same. If you choose a freestanding wooden display, the rear stand is included at no extra charge.”
- The species claims above are inconsistent with those species-neutral product options. Suggested follow-up only: use “light wood” / “dark wood” in PIM product descriptions, captions and alt text, retaining factual/customer names and existing asset paths unless a separate asset migration is planned. No changes performed.
