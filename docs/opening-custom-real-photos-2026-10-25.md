# Opening and custom pages: real-looking photos (25 Oct 2026)

The same plan as the garden, brass and stainless pages (owner msgs 6270, 6281): plain wording, and every plaque photo
on the page one the owner has seen. Wording sent first (msg 6305), photos before release (msg 6312).

## Opening page: top photo and four picks

| Slot | Product | Wording and setting |
| --- | --- | --- |
| Top photo `category/opening-hero-v3` | A4 brushed stainless, no border (the from-price plaque; its product page shows a square crop) | THE MEADOWS / COMMUNITY HUB / was officially opened by / Councillor Anne Fielding / on 14 March 2026, on pale limestone cladding by a door |
| Pick 1 | `brushed-stainless-297x210-rect-light-wood-plaque` | THE ARTHUR LEE / ROOM / Opened on 9 September 2024, on sage tongue-and-groove panelling |
| Pick 2 | `brushed-brass-300x200-rect-light-wood-plaque` | THE CLUBHOUSE / was officially opened by / Mark Dawson / on 7 September 2024, on brick under a porch |
| Pick 3 | `brushed-stainless-400x300-rect-dark-wood-plaque` | MILL LANE / SURGERY / was officially opened by / Dr Helen Price / on 2 June 2025, on buff brick in a porch |
| Pick 4 | `orbital-brass-matt-lacquer-297x210-rect-plaque` | The brass page's pavilion plaque (Jean Harper), reused |

## Custom page: top photo and its four shape tiles (no pick row)

| Slot | Product | Wording and setting |
| --- | --- | --- |
| Top photo `category/custom-hero-v3` | 250 × 150 brushed stainless oval | HAWTHORN / HOUSE, on a red brick cottage wall by a sage-green door |
| Oval tile | `aged-brass-250x150-oval-plaque` | Grandad's Garden, from the garden page |
| Circle tile | `brushed-stainless-200x200-circle-plaque` | THE OLD / SCHOOL / 1874, on grey stone |
| Large tile | `orbital-brass-matt-lacquer-400x300-rect-plaque` | In loving memory of / GEORGE & MARY / FENTON / George 1925 – 2008 / Mary 1928 – 2019, scalloped, on an old stone garden wall |
| Portrait tile | Bramble | Unchanged (signed off with the memorial page) |

The six products above have new example wording, drawings, thumbs and sample PDFs. Versions: catalogue photos `?v=2`,
feed images `?v=9`, PDFs `?v=9`. `export_examples.py` labels The Old School as a house name. The written wording ideas
on both pages lost the invented mayors and towns.

Kept versions: opening top v1, Arthur Lee v2, clubhouse v1, surgery v2, Hawthorn v1, Old School v2 (rounder), Fenton
v2 (more matt). All word-perfect and on their layout outlines. Port 4318 is taken by another long-running service
(server/vps.mjs), so stencil servers use other ports.

Working files: `workspace/output/instaplaque-opening-custom-20261025/` (`garden.py` there holds the seven specs).
