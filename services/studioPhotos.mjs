// Studio photos of the catalogue plaques (owner msgs 7739-7966, 29-30 Oct 2026: "really nice studio product shots",
// then "do batches and update the website for relevant pages each batch"). Each is a real-looking studio shot on a plain
// backdrop, made with the designer's own realistic preview from the plaque's exact layout and example wording (the same
// as its flat drawing), read back word for word, checked by eye, and shown to the owner in its batch. Plain .mjs so the
// build checks can read it too.
// Product pages lead with the studio photo; the in-place photo (services/vettedPhotos.mjs, if any) and the flat design
// view (still the Shopping image_link) follow. Cards that would otherwise show the flat drawing show it instead.
// Files (scripts/publish-studio-photos.py): public/site-images/studio-photo/<slug>.webp (1200 px), <slug>-600.webp and
// thumbs/<slug>.webp (160 px), all marked IPTC DigitalSourceType trainedAlgorithmicMedia (file metadata, no label).
// Value: the date the photo went live, used as that page's lastmod in sitemap-products.xml.
export const studioPhotos = new Map([
  ['aged-brass-150x50-rect-plaque', '2026-10-30'],
  ['aged-brass-150x65-rect-plaque', '2026-10-30'],
  ['aged-brass-210x148-rect-plaque', '2026-10-30'],
  ['aged-brass-225x65-rect-plaque', '2026-10-30'],
  ['aged-brass-225x75-rect-plaque', '2026-10-30'],
  ['brushed-brass-150x50-rect-plaque', '2026-10-30'],
  ['brushed-brass-150x65-rect-plaque', '2026-10-30'],
  ['brushed-brass-150x75-rect-plaque', '2026-10-30'],
  ['brushed-brass-200x50-rect-plaque', '2026-10-30'],
  ['brushed-brass-225x75-rect-plaque', '2026-10-30'],
  ['brushed-stainless-150x65-rect-plaque', '2026-10-30'],
  ['brushed-stainless-150x75-rect-plaque', '2026-10-30'],
  ['brushed-stainless-210x148-rect-dark-wood-plaque', '2026-10-30'],
  ['brushed-stainless-300x200-rect-dark-wood-plaque', '2026-10-30'],
  ['orbital-brass-matt-lacquer-150x50-rect-plaque', '2026-10-30'],
  ['orbital-brass-matt-lacquer-150x65-rect-plaque', '2026-10-30'],
  ['orbital-brass-matt-lacquer-210x148-rect-plaque', '2026-10-30'],
  ['orbital-brass-matt-lacquer-297x210-rect-plaque', '2026-10-30'],
  ['polished-brass-150x75-rect-plaque', '2026-10-30'],
  ['polished-brass-225x75-rect-plaque', '2026-10-30'],
]);

export const studioPhotoPath = slug => `/site-images/studio-photo/${slug}.webp`;
