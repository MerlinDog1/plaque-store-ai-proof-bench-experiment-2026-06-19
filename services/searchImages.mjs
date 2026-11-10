// Search/share derivatives only. Page photos, Merchant feed and other schemas stay unchanged.
export const stainlessSearchSlug = 'brushed-stainless-150x65-rect-plaque';
export const gardenSearchPhoto = 'brushed-brass-210x148-rect-light-wood-plaque';
export const searchPhotoFor = slug => slug === stainlessSearchSlug ? slug : slug === 'garden-plaques' ? gardenSearchPhoto : undefined;
export const searchImagePath = (photo, ratio = '1x1') => `/site-images/search/${photo}-${ratio}-v1.${ratio === 'og' ? 'jpg' : 'webp'}`;
export const searchSchemaImages = (slug, base) => {
  const photo = searchPhotoFor(slug);
  return photo ? ['1x1', '4x3', '16x9'].map(ratio => new URL(searchImagePath(photo, ratio), base).href) : undefined;
};
export const searchPrimaryImage = (slug, base) => {
  const images = searchSchemaImages(slug, base);
  return images ? { '@type': 'ImageObject', url: images[0], width: 1200, height: 1200 } : undefined;
};
export const studioShareImageFor = slug => {
  const photo = searchPhotoFor(slug);
  return photo ? searchImagePath(photo, 'og') : undefined;
};
export const studioShareAltFor = slug => slug === stainlessSearchSlug
  ? 'Brushed stainless steel 150 × 65 mm memorial plaque for Norma Bradshaw, photographed in a studio.'
  : slug === 'garden-plaques'
    ? 'Brushed brass cherry-tree memorial plaque for Jim Partridge on a light oak board, photographed in a studio.'
    : `${String(slug).replaceAll('-', ' ')} photographed in a studio.`;
