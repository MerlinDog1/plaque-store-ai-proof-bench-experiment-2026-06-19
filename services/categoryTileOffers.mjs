import { merchantOffers } from './merchantCatalogue.mjs';

// A setting/shape tile offers a choice of metals, not just the pictured finish. Resolve its starting
// product from the same catalogue used by the designer and feed; never maintain a separate price here.
export const categoryTileGroups = {
  'grave-nameplate': { width: 150, height: 50, shape: 'rect' },
  'garden-wall': { width: 200, height: 150, shape: 'rect' },
  oval: { shape: 'oval' },
  circle: { shape: 'circle' },
  large: { width: 400, height: 300, shape: 'rect' },
};

export function categoryTileOffers(group) {
  const choice = categoryTileGroups[group];
  if (!choice) throw new Error(`Unknown category tile group: ${group}`);
  return merchantOffers.filter(({ preset: p }) => !p.wood && p.shape === choice.shape
    && (!choice.width || p.width === choice.width) && (!choice.height || p.height === choice.height));
}

export function cheapestCategoryTileOffer(group) {
  const offer = categoryTileOffers(group).reduce((low, item) => !low || item.price < low.price ? item : low, null);
  if (!offer) throw new Error(`No catalogue offer for category tile: ${group}`);
  return offer;
}
