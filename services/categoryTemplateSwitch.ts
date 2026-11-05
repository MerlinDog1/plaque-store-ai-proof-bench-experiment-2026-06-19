// Release switches: the original eight restore ec24ba1's page AND FAQs when disabled.
// Stage 3 landing pages have no earlier live page; removing a route also needs its sitemap/links removed.
// Shared by the render config and commerce/prerendered schema; no template imports in commerce.
export const templatePages: Record<string, boolean> = {
  'memorial-plaques': true,
  'bench-plaques': true,
  'garden-plaques': true,
  'tree-memorial-plaques': true,
  'brass-plaques': true,
  'stainless-steel-plaques': true,
  'opening-plaques': true,
  'custom-plaques': true,
  'house-name-plaques': true,
  'donor-recognition-plaques': true,
  'church-plaques': true,
  'professional-brass-plaques': true,
};
