// Branded 1200 x 630 share images (Open Graph / Twitter) for the home page and the indexable
// category and landing pages (owner msg 5167). Retired slugs 301 to one of these in vercel.json.
// Regenerate with scripts/generate-og-images.mjs. Merchant product pages keep their product photo.
export const ogImageSlugs = [
  'memorial-plaques', 'bench-plaques', 'brass-plaques', 'stainless-steel-plaques', 'custom-plaques',
  'garden-plaques', 'opening-plaques', 'portrait-plaques', 'ai-plaque-design',
];
export const defaultShareImagePath = '/site-images/og/og-home.jpg';
export const shareImagePathFor = (slug) => (slug && ogImageSlugs.includes(slug) ? `/site-images/og/og-${slug}.jpg` : undefined);
