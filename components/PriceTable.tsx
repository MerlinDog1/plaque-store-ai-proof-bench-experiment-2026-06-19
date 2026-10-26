import React from 'react';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { GROUND_STAKE_PRICE, GROUND_STAKE_WIDTH_MM, WOOD_BACKING_EXTRA_MM, estimatePlaquePrice, estimateWoodAddOn } from '../services/pricing';
import { designWithStakeHref, groundStakeVisibleMm, onBoardAndStake } from '../services/groundStake';
import { Material, Shape, type PlaqueState } from '../types';
import { TrackedPrice } from './TrackedPrice';

// Prices by size and metal (owner msgs 6430 and 6436, 25 Oct 2026: "price is kind of hidden a bit"). The homepage
// shows six popular sizes and every category page its own four, in place of a single steel price per size. Three
// columns cover every finish: mirror steel and polished or orbital brass cost the same as brushed brass, and aged
// brass about a quarter more than stainless steel. Each price links to that exact plaque, so the amount never changes
// on the next page.

export type PriceTableSize = {
  /** "A5 · 210 × 148 mm": the part before " · " is the name, the rest the size. */
  label: string;
  widthMm: number;
  heightMm: number;
  shape?: 'oval' | 'circle';
  /** What fits, e.g. "A name, dates and a short tribute". */
  fits?: string;
};

const columns = [
  { key: 'steel', label: 'Stainless steel', material: 'brushed-stainless' },
  { key: 'brass', label: 'Brass', material: 'brushed-brass' },
  { key: 'aged', label: 'Aged brass', material: 'aged-brass' },
] as const;

type Offer = (typeof merchantOffers)[number];

/** The plain catalogue plaque (no wood backing) of this size in this metal. */
export function offerFor(size: PriceTableSize, material: string): Offer | undefined {
  return merchantOffers.find(offer => !offer.preset.wood && offer.preset.material === material
    && offer.preset.width === size.widthMm && offer.preset.height === size.heightMm
    && (offer.preset.shape || 'rect') === (size.shape || 'rect'));
}

export const formatGbp = (price: number) => price.toLocaleString('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  maximumFractionDigits: 2,
});

/** One sentence for every price table: what the prices include, and which finishes share a column. */
export const priceTableIncludes = 'Prices include engraving, fixings and UK delivery. Mirror steel and polished or orbital brass cost the brass price.';
export const priceTableIncludesOnStake = 'Prices include the oak board, the black steel ground stake, engraving, fixings and UK delivery. Mirror steel and polished or orbital brass cost the brass price.';

/** The tree page's prices (owner msg 6506): the plaque on the light oak board with the ground stake, priced as the
 * designer and the server price it. */
export const onStakePrice = (offer: Offer) => estimatePlaquePrice(onBoardAndStake(offer.preset as Partial<PlaqueState>) as PlaqueState);

// The board is WOOD_BACKING_EXTRA_MM larger than the plate each way, with the stake's visible part below it, as in
// the designer's preview.
const mountOf = (size: PriceTableSize) => {
  const board = { w: size.widthMm + WOOD_BACKING_EXTRA_MM, h: size.heightMm + WOOD_BACKING_EXTRA_MM };
  return { board, stakeMm: groundStakeVisibleMm(board.h) };
};

/** A plate drawn to scale on its oak board and ground stake; `span` is the largest board width or board-and-stake
 * height in the table, so every drawing shares one scale and the stakes stand on one ground line. */
function MountedPlate({ size, span }: { size: PriceTableSize; span: number }) {
  const { board, stakeMm } = mountOf(size);
  const margin = WOOD_BACKING_EXTRA_MM / 2;
  const across = `${(margin / board.w) * 100}%`;
  const down = `${(margin / board.h) * 100}%`;
  const shape = size.shape ? ` is-${size.shape}` : '';
  return (
    <span className="price-table-mount" style={{ width: `${(board.w / span) * 100}%`, aspectRatio: `${board.w} / ${board.h + stakeMm}` }}>
      <span className={`price-table-board${shape}`} style={{ aspectRatio: `${board.w} / ${board.h}` }}>
        <span className={`cat-size-plate${shape}`} style={{ top: down, bottom: down, left: across, right: across }} />
      </span>
      <span className="price-table-stake" style={{ width: `${(GROUND_STAKE_WIDTH_MM / board.w) * 100}%` }} />
    </span>
  );
}

/** The wood backing board for an A5 plaque, the size most people choose a board for. */
export const a5BoardPrice = formatGbp(estimateWoodAddOn({
  width: 210, height: 148, shape: Shape.Rect, material: Material.BrushedSteel, wood: true,
} as PlaqueState));
export const groundStakePrice = formatGbp(GROUND_STAKE_PRICE);

export function PriceTable({ sizes, caption, compact = false, mount }: {
  sizes: PriceTableSize[];
  /** Read out by screen readers before the table. */
  caption: string;
  /** Phones: leave out the "what fits" lines (the homepage table). */
  compact?: boolean;
  /** 'stake': each plate on the oak board and ground stake, priced with both, each price opening the designer on
   * that plaque on the board and stake (the tree page, owner msg 6506). */
  mount?: 'stake';
}) {
  const onStake = mount === 'stake';
  const widest = Math.max(...sizes.map(size => size.widthMm));
  const span = Math.max(...sizes.map(size => {
    const { board, stakeMm } = mountOf(size);
    return Math.max(board.w, board.h + stakeMm);
  }));
  return (
    <div className={`price-table-wrap${compact ? ' is-compact' : ''}${onStake ? ' is-on-stake' : ''}`}>
      <table className="price-table">
        <caption className="price-table-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            {columns.map(column => (
              <th scope="col" key={column.key}>
                <span className={`price-swatch is-${column.key}`} aria-hidden="true" />
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map(size => {
            const [name, ...rest] = size.label.split(' · ');
            const dims = rest.join(' · ');
            return (
              <tr key={size.label}>
                <th scope="row">
                  <span className="price-table-size">
                    {/* Each plate drawn to scale against the largest in the table. */}
                    <span className="price-table-stage" aria-hidden="true">
                      {onStake ? <MountedPlate size={size} span={span} />
                        : <span className={size.shape ? `cat-size-plate is-${size.shape}` : 'cat-size-plate'} style={{ width: `${(size.widthMm / widest) * 100}%`, aspectRatio: `${size.widthMm} / ${size.heightMm}` }} />}
                    </span>
                    <span className="price-table-text">
                      <span className="price-table-name">{name}</span>
                      {dims && <span className="price-table-dims">{dims}</span>}
                      {size.fits && <span className="price-table-fits">{size.fits}</span>}
                    </span>
                  </span>
                </th>
                {columns.map(column => {
                  const offer = offerFor(size, column.material);
                  if (!offer) return <td key={column.key}>–</td>;
                  const amount = onStake ? onStakePrice(offer) : offer.price;
                  const price = formatGbp(amount);
                  return (
                    <td key={column.key}>
                      <a href={onStake ? designWithStakeHref(offer.slug) : `/${offer.slug}`} aria-label={`${size.label}, ${column.label.toLowerCase()}${onStake ? ' on an oak board and ground stake' : ''}: ${price}`}>
                        <TrackedPrice value={amount} product={offer.slug}>{price}</TrackedPrice>
                      </a>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The homepage's six sizes, from a bench plaque to a large dedication. */
export const homePriceSizes: PriceTableSize[] = [
  { label: 'Bench · 150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates' },
  { label: 'Bench · 225 × 75 mm', widthMm: 225, heightMm: 75, fits: 'A longer dedication' },
  { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'Most memorials and house names' },
  { label: 'Round · 200 mm', widthMm: 200, heightMm: 200, shape: 'circle', fits: 'A short dedication' },
  { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'Openings and longer words' },
  { label: 'Large · 400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A family memorial, a poem or a history' },
];
