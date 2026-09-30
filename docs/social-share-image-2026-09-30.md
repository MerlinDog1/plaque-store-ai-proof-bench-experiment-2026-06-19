# InstaPlaque social sharing image — 30 September 2026

## Source and status

Branch: `codex/social-share-image`.
Application and asset commit: `85b76a45331b63428786abe3ce3158c1672d2fd0`.
Based on the verified oval release handover `e5cdfc530562171ab67ddf5cdfd66aab23af384f`.
Prepared for review; **not deployed**. The production oval release remains
`dpl_8eteXnsXvozn6fbmfswmpjd2dTHh`, source
`9f8e5d923e0793e7f0344455b7a54cab8c33605b`.

## Change

Replaces the unbranded close-up used for link previews with an editorial card
using the homepage's headline, cream/forest-green/brass palette and bench plaque
design example. The image is labelled “Design example”, rather than presented
as a customer commission.

Final asset: `public/site-images/instaplaque-social-v2.jpg`,
1200 × 630 pixels, RGB JPEG, 163,230 bytes.
Created using the **built-in image_gen tool**, with
`public/site-images/home-gallery-brass-bench.webp` as the image reference.
The generated PNG was exported as an optimised JPEG for the website.

Base HTML, client-side route metadata and prerendered pages now use the same
new image URL. Added Open Graph image type/dimensions/description and Twitter
image description. The old source image remains available for its page/catalogue
uses. Product images, merchant feed, page titles and descriptions are unchanged.
No backend, PDF, pricing, proof generation or purchase logic changed.

## Validation

- Production build passed, including existing API boot/sanitisation checks.
  Existing bundle-size advisory remains.
- All 194 built HTML pages have exactly one new Open Graph image and Twitter
  image, with expected dimensions/type and descriptive alt metadata.
- Emitted JPEG is byte-identical to the source asset.
- Built merchant feed matches production byte-for-byte.
- Visual inspection at final 1200 × 630 confirms readable copy, full plaque
  framing and the design-example label.
- Browser check on the local production preview verified the metadata on home
  and after clicking through to Memorial.
- Staged diff and credential-pattern review passed.

Local preview initially refused connection because the previous server had
stopped; starting Vite preview and opening a fresh tab resolved it. No remaining
local verification failure. A full typecheck was not repeated for this metadata
and image-only change. External social crawler previews and cache refreshes
remain unverified until deployment.

## Publication next step

Await an explicit publication request, reconcile any newer production source,
then deploy and verify the canonical/www aliases and public JPEG/metadata.
Preserve the migrated Supabase/private R2 configuration; read the migration
handover before deploying. Git-based automatic deployment is disabled in
`vercel.json`; the inspected CI workflow only checks/builds and no active Git
hook was present.

Image metadata follows the [Open Graph protocol](https://ogp.me/).

## Final image prompt

Built-in tool mode, single reference-based generation, opaque background.

```text
Use case: ads-marketing.
Create a finished Open Graph social-sharing card for InstaPlaque, based on its existing website. Landscape 1200 x 630 pixels (1.905:1). Make it elegant, calm, premium and exceptionally readable at small link-preview sizes.
Input image 1 is the existing website's brass memorial bench plaque photograph. Use that photograph as the right-hand product image, preserving the plaque, the existing engraved wording, the four screw heads, metal finish, weathered bench and natural garden setting. Do not invent additional products or change the inscription.
Composition: warm ivory background (#f8f6ee). Left half is spacious typography. Right half is a beautifully framed near-square crop of the supplied photograph, with the ENTIRE plaque visible and breathing room; the plaque must not be clipped. Straight editorial edges, subtle natural shadow, no collage and no phone/browser mockup.
Brand colours: dark forest green (#203e34), muted antique brass (#8b8055), warm ivory. Typography: refined Georgia-like serif for the headline, clean understated sans-serif for the supporting text. Match the quiet editorial look of the InstaPlaque website. No gradients behind text, no badges, no star ratings, no additional icons.
Exact text only, all spelled precisely:
Top-left wordmark: "InstaPlaque" as one word, Insta in bold dark green and Plaque in restrained antique brass.
Small category above the headline: "BRASS & STAINLESS STEEL PLAQUES"
Large headline, with generous line spacing and three lines:
"Some words"
"deserve to"
"stay."
Make only "stay." italic in muted brass; other headline lines dark green. This is the main focal point in the left half.
Small supporting line below: "Free online proof · UK delivery included"
Bottom-left website: "instaplaque.co.uk"
Discreet lower-right caption beneath the photograph: "Design example"
Use wide safe margins (at least 45px at final size). Do not add prices, production promises, buttons, fake testimonials or any other words. Output the finished card, not a mockup of it.
```
