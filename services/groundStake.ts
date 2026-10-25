// The black steel ground stake offered with a wood backing board (owner msg 6378, 25 Oct 2026), as on the
// Nicola order: a 30 mm square stake on a bracket at the back of the board. Price and rules live in
// checkoutPolicy.mjs (shared with the server); this is how much of it the 2D and 3D previews show.

// About 60% of the board's height shows below it, as in the Nicola order's illustration, within 90–160 mm.
export const groundStakeVisibleMm = (boardHeightMm: number) =>
  Math.round(Math.min(160, Math.max(90, boardHeightMm * 0.6)));

// The tree page's link (owner msg 6394): opens the designer on its A5 plaque already on the light oak board and
// ground stake, as on the Nicola order. App.tsx reads it once, then drops it from the address.
export const DESIGN_WITH_STAKE_HREF = '/design?backing=stake';
export const DESIGN_WITH_STAKE_PARAM = { name: 'backing', value: 'stake' } as const;
