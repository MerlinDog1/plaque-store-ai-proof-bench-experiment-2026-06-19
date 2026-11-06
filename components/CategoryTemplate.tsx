import React, { useEffect, useState } from 'react';
import { merchantImageQuery, merchantOffers } from '../services/merchantCatalogue.mjs';
import { studioPhotoPath, studioPhotos } from '../services/studioPhotos.mjs';
import { categoryParentFor, materialStories, photo600, type ProductFamily } from '../services/commerce';
import { optimisedSrcSet } from '../services/imageUrls';
import { categoryFilmFor } from '../services/categoryFilms.mjs';
import { CategoryFilmFigure } from './PromoVideo';
import { designWithStakeHref, groundStakeVisibleMm } from '../services/groundStake';
import { GROUND_STAKE_LENGTH, GROUND_STAKE_THICKNESS_MM, GROUND_STAKE_WIDTH_MM, WOOD_BACKING_EXTRA_MM } from '../services/pricing';
import { finishOutdoors } from '../services/catalogueContent';
import { PLANNER_LAST_DAY, approveBy } from '../services/occasionPlanner';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { ProofPdfStack } from './FeatureSections';
import { samplePdfFor, sampleProofPageFor } from './CatalogueDetails';
import { DesignLink } from './Shopfront';
import { ShopHero, homeTagline } from './ShopHero';
import { PriceTable, formatGbp, onStakePrice, priceTableIncludes, priceTableIncludesOnStake, type PriceTableSize } from './PriceTable';
import type { Inscription } from './CategoryLanding';

// The "products first" category template (owner msg 8384, 1 Nov 2026: "stick with studio shots… the layouts and
// contents all suck for what they are. You need to research and find stuff to copy"). The layout follows workspace
// output/instaplaque-competitor-research-20261101 (ux/REPORT.md section c, memorial/REPORT.md section c): a short title
// block with one facts line, a sticky chip row, a two-column grid of studio photos with one card per size and real-metal
// finish swatches, the page's own six questions straight after it, sizes drawn to scale with the price table folded,
// a short proof block, the finishes side by side, three wording ideas and a closing strip. Each page is a config
// (components/CategoryTemplatePages.tsx). Every price comes from the catalogue (merchantOffers, priced by
// estimatePlaquePrice); no amount is typed into the copy. Only studio photos lead a card; a finish without one shows
// its flat design view, labelled as such, and a finish with neither (only an in-place photo) is left off the card.
// Stage 2 (garden, tree, brass, stainless, opening, custom) added: metal-only pages (`finishes`), the tree page's
// light solid wood board and ground stake (`mount: 'stake'`), link chips, card badges, a grid-end tile and page-specific sections.

type Offer = (typeof merchantOffers)[number];
export type Finish = 'polished-brass' | 'brushed-brass' | 'orbital-brass-matt-lacquer' | 'aged-brass' | 'polished-stainless' | 'brushed-stainless';
export type WoodTone = 'light' | 'dark';

/** Warm to cool, the order of the swatches on every card. `file`: the close-up in public/site-images/finish/
 * (scripts/make-finish-swatches.py, cropped from the materials page's photographs of each finish). */
export const templateFinishes: Array<{ key: Finish; label: string; short: string; file: string; story: string }> = [
  { key: 'polished-brass', label: 'Polished brass', short: 'Polished brass', file: 'polished-brass', story: 'Polished brass' },
  { key: 'brushed-brass', label: 'Brushed brass', short: 'Brushed brass', file: 'brushed-brass', story: 'Brushed brass' },
  { key: 'orbital-brass-matt-lacquer', label: 'Orbital brass', short: 'Orbital brass', file: 'orbital-brass', story: 'Orbital brass' },
  { key: 'aged-brass', label: 'Aged brass', short: 'Aged brass', file: 'aged-brass', story: 'Aged brass' },
  { key: 'polished-stainless', label: 'Polished stainless steel', short: 'Polished steel', file: 'polished-stainless', story: 'Mirror stainless' },
  { key: 'brushed-stainless', label: 'Brushed stainless steel', short: 'Brushed steel', file: 'brushed-stainless', story: 'Brushed stainless steel' },
];
const woods: Array<{ tone: WoodTone; label: string; short: string; file: string; story: string }> = [
  { tone: 'light', label: 'light wood', short: 'light wood', file: 'light-wood', story: 'Light wood backing' },
  { tone: 'dark', label: 'dark wood', short: 'dark wood', file: 'dark-wood', story: 'Dark wood backing' },
];
export const BRASS: Finish[] = ['polished-brass', 'brushed-brass', 'orbital-brass-matt-lacquer', 'aged-brass'];
export const STAINLESS: Finish[] = ['polished-stainless', 'brushed-stainless'];
const finishLabel = (finish: Finish) => templateFinishes.find(item => item.key === finish)!.label;
const swatchStyle = (file: string): React.CSSProperties => ({ backgroundImage: `url(/site-images/finish/swatch-${file}.webp)` });

/** One card: one catalogue size (or that size on a wood board), every finish on it. */
export type TemplateCard = {
  width: number;
  height: number;
  shape?: 'rect' | 'oval' | 'circle';
  /** The wood-backed versions, in light wood and dark wood. */
  board?: boolean;
  /** "A5", "A4": shown before the millimetres. */
  name?: string;
  /** What fits, in a few words. */
  fits: string;
  /** Chip filter group (e.g. 'small'), if the page has size chips. */
  group?: string;
  /** The finish (and wood) pictured first. Needs a studio photo. */
  lead: Finish;
  leadTone?: WoodTone;
  /** A short tag on the photo, e.g. "The usual size". */
  badge?: string;
  /** The lead photo's alt text, where it says more than the generic line (the garden page's first cards, page-1 SEO,
   * owner msgs 10401-10408): what that studio photo shows. Other finishes keep the generic line. */
  leadAlt?: string;
};
/** A chip narrows the grid: by finish (`finishes`), by size group (`group`) or to wood-backed cards (`board`). `note`:
 * one line shown under the chips while it is on (e.g. aged brass's extra days). */
export type TemplateChip = { key: string; label: string; finishes?: Finish[]; group?: string; board?: true; note?: string };
/** A chip that opens another page instead (the garden page's "On a ground stake" opens the tree page). */
export type TemplateLinkChip = { href: string; label: string };
/** What a page sells: only some finishes (the brass and stainless steel pages), or every plaque on the light solid wood board and
 * ground stake (the tree page, owner msg 6506: priced with both, opening the designer on that plaque on both). */
export type CardScope = { finishes?: Finish[]; mount?: 'stake' };

type CardImage = { src: string; srcSet?: string; drawing: boolean };
/** `label`: "Polished stainless steel on dark wood" (screen readers, swatch titles); `short`: "Polished steel on dark wood",
 * on the photo. `href`: the product page, or on the tree page the designer on that plaque on the board and stake. */
type CardOption = { slug: string; href: string; finish: Finish; tone?: WoodTone; price: number; days: number; title: string; label: string; short: string; image: CardImage;
  /** The catalogue plaque that gets made (on the tree page, the plate's light-wood-board version): its days are `days`. */
  made: string };
export type ResolvedCard = { card: TemplateCard; name: string; options: CardOption[]; lead: CardOption; from: number };

export function sizeName(card: Pick<TemplateCard, 'width' | 'height' | 'shape' | 'name'>) {
  const mm = card.shape === 'circle' ? `${card.width} mm round` : `${card.width} × ${card.height} mm${card.shape === 'oval' ? ' oval' : ''}`;
  return card.name ? `${card.name} · ${mm}` : mm;
}

/** The studio photo, else the flat design view, else nothing (only an in-place photo: not used on these cards). */
function cardImage(offer: Offer): CardImage | null {
  if (studioPhotos.has(offer.slug)) {
    const src = photo600(studioPhotoPath(offer.slug));
    return { src, srcSet: optimisedSrcSet(src, 600, [320, 480]), drawing: false };
  }
  if (offer.image.startsWith('/site-images/merchant/')) {
    const src = offer.image + merchantImageQuery;
    return { src, srcSet: optimisedSrcSet(src, 1500, [320, 480]), drawing: true };
  }
  return null;
}

/** A card's options from the catalogue. Throws (failing the build) if the card's lead has no studio photo, or if a
 * finish left off for want of a picture is cheaper than the card's from-price, which would then be wrong.
 * On the tree page (`mount: 'stake'`) each option is the plate on the light solid wood board and ground stake: pictured by
 * the studio photo of the plate on its light solid wood board, priced with the board and stake as the designer prices it
 * (onStakePrice), and opening the designer on that plaque on both (designWithStakeHref). */
export function resolveCard(card: TemplateCard, scope: CardScope = {}): ResolvedCard {
  const name = sizeName(card);
  const stake = scope.mount === 'stake';
  const sized = merchantOffers.filter(offer => offer.preset.width === card.width && offer.preset.height === card.height
    && offer.preset.shape === (card.shape || 'rect'));
  const offers = sized.filter(offer => (stake ? Boolean(offer.preset.wood) && offer.preset.woodTone === 'light' : Boolean(offer.preset.wood) === Boolean(card.board)));
  const bare = (offer: Offer) => {
    const plate = sized.find(item => !item.preset.wood && item.preset.material === offer.preset.material);
    if (!plate) throw new Error(`Category template: no plate without backing for ${offer.slug}`);
    return plate;
  };
  const priceOf = (offer: Offer) => (stake ? onStakePrice(bare(offer)) : offer.price);
  const options: CardOption[] = [];
  const unpictured: Offer[] = [];
  for (const finish of templateFinishes.filter(item => !scope.finishes || scope.finishes.includes(item.key))) {
    for (const wood of card.board && !stake ? woods : [undefined]) {
      const offer = offers.find(item => item.preset.material === finish.key && (!wood || item.preset.woodTone === wood.tone));
      if (!offer) continue;
      const image = cardImage(offer);
      if (!image) { unpictured.push(offer); continue; }
      if (stake) {
        const plate = bare(offer);
        options.push({ slug: plate.slug, href: designWithStakeHref(plate.slug), finish: finish.key, tone: 'light', price: priceOf(offer), days: offer.productionDays, made: offer.slug,
          title: `${plate.title}, on a light solid wood board and ground stake`, label: `${finish.label} on a light solid wood board`, short: `${finish.short} on light wood`, image });
        continue;
      }
      options.push({ slug: offer.slug, href: `/${offer.slug}`, finish: finish.key, tone: wood?.tone, price: offer.price, days: offer.productionDays, made: offer.slug, title: offer.title,
        label: wood ? `${finish.label} on ${wood.label}` : finish.label, short: wood ? `${finish.short} on ${wood.short}` : finish.short, image });
    }
  }
  if (!options.length) throw new Error(`Category template: no catalogue plaque for ${name}`);
  const from = Math.min(...options.map(option => option.price));
  const hidden = unpictured.find(offer => priceOf(offer) < from);
  if (hidden) throw new Error(`Category template: ${hidden.slug} has no picture and is cheaper than the ${name} card's from-price`);
  const lead = options.find(option => option.finish === card.lead && (!card.board || option.tone === (card.leadTone || 'light')));
  if (!lead || lead.image.drawing) throw new Error(`Category template: the ${name} card's lead finish needs a studio photo`);
  return { card, name, options, lead, from };
}

/** The usual production days on a page: the fewest of its plaques (catalogue days). The facts line under the H1 gives
 * only this figure (review fix, 1 Nov 2026): 5, or 10 on the tree page, where every plaque is on a board. Plaques that
 * take longer say so on their card (cardDays), and the page's timing question gives every figure. */
export function usualDays(cards: ResolvedCard[]) {
  return Math.min(...cards.flatMap(item => item.options.map(option => option.days)));
}
const dayRange = (days: number[]) => (Math.min(...days) === Math.max(...days) ? `${days[0]}` : `${Math.min(...days)}–${Math.max(...days)}`);

/** The catalogue's standard production time (most plaques; the facts line's figure on every page but the tree's). */
const STANDARD_DAYS = Math.min(...merchantOffers.map(offer => offer.productionDays));
/** A card's lead-time line, whenever a plaque behind it (in the chosen chip's finishes) takes longer than the standard
 * days, naming the slowest: "Made in 10 working days" when they all do (wood-backed cards, every card on the tree page),
 * otherwise the slower finish and its days ("Aged brass: 7 working days"). No line means every plaque on the card is
 * made in the standard days. scripts/check-category-template.mjs checks it against the catalogue. */
function cardDays(allowed: CardOption[]) {
  const slow = allowed.filter(option => option.days > STANDARD_DAYS);
  if (!slow.length) return '';
  if (slow.length === allowed.length) return `Made in ${dayRange(allowed.map(option => option.days))} working days`;
  const finishes = [...new Set(slow.map(option => option.finish))];
  return `${finishes.length === 1 ? finishLabel(finishes[0]) : 'Some finishes'}: ${dayRange(slow.map(option => option.days))} working days`;
}

/** Client-only behaviour (swatch buttons, chips) after the app has mounted; the static HTML keeps plain links. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function defaultOption(item: ResolvedCard, allowed: CardOption[]) {
  if (allowed.includes(item.lead)) return item.lead;
  const tone = item.lead.tone;
  return allowed.find(option => !option.image.drawing && option.tone === tone) || allowed.find(option => !option.image.drawing) || allowed[0];
}

function GridCard({ item, finishes, mounted, priority, wide, stake }: { item: ResolvedCard; finishes?: Finish[]; mounted: boolean; priority: number; wide: boolean; stake: boolean }) {
  const allowed = finishes ? item.options.filter(option => finishes.includes(option.finish)) : item.options;
  const [picked, setPicked] = useState<{ finish: Finish; tone?: WoodTone } | null>(null);
  const filterKey = finishes ? finishes.join(',') : '';
  // A finish chip shows each card in that metal again, from its own from-price.
  useEffect(() => setPicked(null), [filterKey]);
  const fallback = defaultOption(item, allowed);
  const current = (picked && allowed.find(option => option.finish === picked.finish && option.tone === picked.tone)) || fallback;
  const from = Math.min(...allowed.map(option => option.price));
  const price = picked ? formatGbp(current.price) : `from ${formatGbp(from)}`;
  const finishRow = templateFinishes.filter(finish => allowed.some(option => option.finish === finish.key));
  const days = cardDays(allowed);
  const choose = (finish: Finish, tone?: WoodTone) => setPicked({ finish, tone });
  const swatch = (key: string, file: string, label: string, option: CardOption, selected: boolean, onPick: () => void) => (mounted
    ? <button type="button" key={key} className={`cat-tpl-swatch${selected ? ' is-selected' : ''}`} style={swatchStyle(file)}
      aria-pressed={selected} aria-label={`${label}, ${formatGbp(option.price)}`} title={label} onClick={onPick} />
    : <a key={key} className={`cat-tpl-swatch${selected ? ' is-selected' : ''}`} style={swatchStyle(file)} href={option.href}
      data-price={option.price} aria-label={`${label}, ${formatGbp(option.price)}`} title={label} />);
  const alt = item.card.leadAlt && current === item.lead ? item.card.leadAlt
    : stake ? `${current.title}: shown on its light solid wood board, the ground stake not pictured, with example wording`
    : `${current.title}, shown with example wording${current.image.drawing ? ' (flat design view)' : ''}`;
  return (
    <li className={`cat-tpl-card${item.card.board ? ' is-board' : ''}`} data-options={item.options.length} data-offers={item.options.map(option => option.made).join(' ')}>
      <div className={`cat-tpl-photo${current.image.drawing ? ' is-drawing' : ''}${wide ? ' is-wide' : ''}`}>
        <img src={current.image.src} srcSet={current.image.srcSet} sizes={current.image.srcSet ? '(max-width: 720px) 46vw, 290px' : undefined}
          alt={alt} width="600" height="600"
          loading={priority < 4 ? 'eager' : 'lazy'} fetchPriority={priority === 0 ? 'high' : undefined} decoding="async" />
        {item.card.badge && <span className="cat-tpl-badge">{item.card.badge}</span>}
        {/* What the photo shows, so a from-price beside it is never read as that finish's price. */}
        <span className="cat-tpl-finish">{current.short}{current.image.drawing ? ' · design view' : ''}</span>
      </div>
      <h3 className="cat-tpl-card-title">
        <a className="cat-tpl-card-link" href={current.href}>{item.name}<span className="cat-tpl-sr">, {current.label.toLowerCase()}</span></a>
      </h3>
      <p className="cat-tpl-fits">{item.card.fits}</p>
      <div className="cat-tpl-swatches" role="group" aria-label={`Finish for ${item.name}`}>
        {finishRow.map(finish => {
          const option = allowed.find(entry => entry.finish === finish.key && entry.tone === current.tone) || allowed.find(entry => entry.finish === finish.key)!;
          return swatch(finish.key, finish.file, finish.label, option, current.finish === finish.key, () => choose(finish.key, current.tone));
        })}
      </div>
      <div className="cat-tpl-buy">
        <p className="cat-tpl-price" aria-live="polite">
          <strong className="cat-tpl-amount"><TrackedPrice value={picked ? current.price : from} product={current.slug}>{price}</TrackedPrice></strong>
        </p>
        {item.card.board && <div className="cat-tpl-swatches is-wood" role="group" aria-label={`Wood board for ${item.name}`}>
          {woods.map(wood => {
            const option = allowed.find(entry => entry.finish === current.finish && entry.tone === wood.tone)!;
            return swatch(wood.tone, wood.file, `On ${wood.label}`, option, current.tone === wood.tone, () => choose(current.finish, wood.tone));
          })}
        </div>}
      </div>
      {days && <p className="cat-tpl-days" aria-live="polite">{days}</p>}
    </li>
  );
}

function ProductGrid({ id, cards, chips, links, end, wide, stake, mounted }: {
  id: string; cards: ResolvedCard[]; chips: TemplateChip[]; links?: TemplateLinkChip[]; end?: React.ReactNode; wide: boolean; stake: boolean; mounted: boolean;
}) {
  const [finishKey, setFinishKey] = useState<string | null>(null);
  const [cardKey, setCardKey] = useState<string | null>(null);
  // Ad and email links can open the page narrowed: ?finish=brass, ?size=large or ?board=yes (chip keys).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const finish = chips.find(chip => chip.finishes && chip.key === params.get('finish'));
    const card = chips.find(chip => !chip.finishes && (chip.key === params.get('size') || (chip.board && params.get('board') === 'yes')));
    if (finish) setFinishKey(finish.key);
    if (card) setCardKey(card.key);
  }, [chips]);
  const finishChip = chips.find(chip => chip.finishes && chip.key === finishKey);
  const cardChip = chips.find(chip => !chip.finishes && chip.key === cardKey);
  const shown = cards.map(item => (!cardChip || (cardChip.board ? Boolean(item.card.board) : item.card.group === cardChip.group))
    && (!finishChip || item.options.some(option => finishChip.finishes!.includes(option.finish))));
  // What the grid holds (review fix, 1 Nov 2026: "78 plaques" above ten cards read oddly): its cards, one per size (a
  // board makes a size of its own), and the finishes on them, both following the chips.
  const sizes = cards.filter((_, index) => shown[index]);
  const finishCount = new Set(sizes.flatMap(item => item.options.filter(option => !finishChip || finishChip.finishes!.includes(option.finish)).map(option => option.finish))).size;
  const count = `${sizes.length} ${sizes.length === 1 ? 'size' : 'sizes'} · ${finishCount} ${finishCount === 1 ? 'finish' : 'finishes'}`;
  const pick = (chip: TemplateChip) => {
    if (chip.key === 'all') { setFinishKey(null); setCardKey(null); return; }
    if (chip.finishes) setFinishKey(key => (key === chip.key ? null : chip.key));
    else setCardKey(key => (key === chip.key ? null : chip.key));
  };
  const active = (chip: TemplateChip) => (chip.key === 'all' ? !finishKey && !cardKey : chip.key === finishKey || chip.key === cardKey);
  const note = finishChip?.note || cardChip?.note;
  return (
    <section className="cat-tpl-grid-section" id={id} aria-label="Plaques to choose from">
      <div className={`cat-tpl-toolbar${mounted ? '' : ' is-static'}`}>
        <p className="cat-tpl-count" aria-live="polite">{count}</p>
        <div className="cat-tpl-chips" role="group" aria-label="Narrow the plaques" aria-hidden={mounted ? undefined : true}>
          {chips.map(chip => (
            <button type="button" key={chip.key} className="cat-tpl-chip" aria-pressed={active(chip)} tabIndex={mounted ? undefined : -1} onClick={() => pick(chip)}>{chip.label}</button>
          ))}
        </div>
        {/* Plain links, so they work before the script runs. */}
        {links && links.length > 0 && <div className="cat-tpl-chip-links">
          {links.map(link => <a key={link.href} className="cat-tpl-chip is-link" href={link.href}>{link.label} <span aria-hidden="true">↗</span></a>)}
        </div>}
      </div>
      {note && <p className="cat-tpl-chip-note" aria-live="polite">{note}</p>}
      {/* Computers: full rows (6 cards in 3 columns, 10 in 5, otherwise 4). */}
      <ul className="cat-tpl-grid" style={{ '--cat-tpl-cols': cards.length % 4 === 0 ? 4 : cards.length % 5 === 0 ? 5 : cards.length % 3 === 0 ? 3 : 4 } as React.CSSProperties}>
        {cards.map((item, index) => (
          <React.Fragment key={item.name + (item.card.board ? ' board' : '')}>
            {shown[index] && <GridCard item={item} finishes={finishChip?.finishes} mounted={mounted} priority={index} wide={wide} stake={stake} />}
          </React.Fragment>
        ))}
        {end && <li className="cat-tpl-ask">{end}</li>}
      </ul>
    </section>
  );
}

/** The page's own questions, folded: the same list as the prerendered FAQPage schema (ShopProduct passes it). */
function FaqAccordion({ id, title, faqs, subject }: { id: string; title: string; faqs: { question: string; answer: string }[]; subject: string }) {
  return (
    <section className="shop-section cat-tpl-faq" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      <div className="cat-tpl-faq-list">
        {faqs.map(faq => (
          <details key={faq.question}>
            <summary>{faq.question}<span aria-hidden="true">+</span></summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
      <p className="cat-tpl-small">Another question? <ContactLink channel="whatsapp" placement="page" subject={subject}>Ask us on WhatsApp</ContactLink></p>
    </section>
  );
}

export type TemplateSize = PriceTableSize & { fits: string };
const REFERENCES = {
  brick: { widthMm: 215, heightMm: 65, label: 'A house brick, 215 × 65 mm, to the same scale' },
  card: { widthMm: 86, heightMm: 54, label: 'A bank card, 86 × 54 mm, to the same scale' },
};
/** The cheapest plaque of a size without backing, in the page's finishes; brushed first among equal prices. */
const cheapestOf = (size: PriceTableSize, finishes?: Finish[]) => merchantOffers
  .filter(offer => !offer.preset.wood && offer.preset.width === size.widthMm && offer.preset.height === size.heightMm && offer.preset.shape === (size.shape || 'rect')
    && (!finishes || finishes.includes(offer.preset.material as Finish)))
  .sort((a, b) => a.price - b.price || Number(b.preset.material.startsWith('brushed')) - Number(a.preset.material.startsWith('brushed')))[0];

const toScale = (mm: number) => `calc(${mm}px * var(--cat-tpl-mm))`;
const plateStyle = (widthMm: number, heightMm: number): React.CSSProperties => ({ width: toScale(widthMm), height: toScale(heightMm) });

/** A plate on its light solid wood board with the ground stake below, to the strip's scale: the board is WOOD_BACKING_EXTRA_MM
 * larger each way, and the stake shows as much as the designer's preview and the price table draw. */
function StakeMount({ size }: { size: TemplateSize }) {
  const board = { w: size.widthMm + WOOD_BACKING_EXTRA_MM, h: size.heightMm + WOOD_BACKING_EXTRA_MM };
  const shape = size.shape ? ` is-${size.shape}` : '';
  return (
    <span className="cat-tpl-mount" aria-hidden="true">
      <span className={`cat-tpl-board${shape}`} style={plateStyle(board.w, board.h)}>
        <span className={`cat-tpl-plate${shape}`} style={plateStyle(size.widthMm, size.heightMm)} />
      </span>
      <span className="cat-tpl-stake" style={plateStyle(GROUND_STAKE_WIDTH_MM, groundStakeVisibleMm(board.h))} />
    </span>
  );
}

/** Every size drawn to one scale beside an everyday object, each linking to its cheapest plaque at that price; the
 * size × metal price table folded below it. On the tree page (`mount: 'stake'`) each plate stands on its light solid wood board and
 * ground stake, priced with both and opening the designer on it, as the price table does. */
function SizeStrip({ id, title, intro, scale, reference, sizes, tableSizes, note, more, mount, finishes }: {
  id: string; title: string; intro: string; scale: 'wall' | 'bench' | 'stake'; reference?: keyof typeof REFERENCES;
  sizes: TemplateSize[]; tableSizes: TemplateSize[]; note?: React.ReactNode; more?: React.ReactNode; mount?: 'stake'; finishes?: Finish[];
}) {
  const ref = reference && REFERENCES[reference];
  const onStake = mount === 'stake';
  return (
    <section className="shop-section cat-tpl-sizes" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      <p className="cat-tpl-section-intro">{intro}</p>
      {ref && <p className={`cat-tpl-scale-ref is-${scale}`}>
        <span className={`cat-tpl-plate is-${reference}`} style={plateStyle(ref.widthMm, ref.heightMm)} aria-hidden="true" /> {ref.label}.
      </p>}
      <ul className={`cat-tpl-scale is-${scale}`}>
        {sizes.map(size => {
          const offer = cheapestOf(size, finishes);
          if (!offer) throw new Error(`Category template: no plaque ${size.widthMm} × ${size.heightMm}`);
          const price = onStake ? onStakePrice(offer) : offer.price;
          return (
            <li key={size.label}>
              <a className="cat-tpl-scale-link" href={onStake ? designWithStakeHref(offer.slug) : `/${offer.slug}`}>
                {onStake ? <StakeMount size={size} />
                  : <span className={`cat-tpl-plate${size.shape ? ` is-${size.shape}` : ''}`} style={plateStyle(size.widthMm, size.heightMm)} aria-hidden="true" />}
                <b>{size.label}</b>
                <small>{size.fits}</small>
                <strong>from <TrackedPrice value={price} product={offer.slug}>{formatGbp(price)}</TrackedPrice></strong>
              </a>
            </li>
          );
        })}
      </ul>
      <details className="cat-tpl-fold">
        <summary>Compare all sizes and prices<span aria-hidden="true">+</span></summary>
        <div>
          <PriceTable sizes={tableSizes} mount={mount} caption={`${title} Prices by size and metal${onStake ? ', on a light solid wood board and ground stake' : ''}.`} />
          <p className="shop-smallprint">{onStake ? priceTableIncludesOnStake : priceTableIncludes}{note && <> {note}</>}</p>
          {more}
        </div>
      </details>
    </section>
  );
}

const defaultSteps: [string, string][] = [
  ['Add your words', 'Online, or send them on WhatsApp.'],
  ['Check your free PDF proof', 'Every word, size and fixing, to share before you pay.'],
  ['Approve, then we make it', 'Ask for changes until it’s right.'],
];

function ProofBlock({ id, sampleSlug, sampleNote, steps, subject, designHref, extra, onLaunch, onRequestDesign }: {
  id: string; sampleSlug: string; sampleNote?: string; steps: [string, string][]; subject: string; designHref?: string;
  extra?: React.ReactNode; onLaunch?: () => void; onRequestDesign?: () => void;
}) {
  const sample = merchantOffers.find(offer => offer.slug === sampleSlug);
  if (!sample) throw new Error(`Category template: no sample plaque ${sampleSlug}`);
  return (
    <section className="shop-section cat-tpl-proof" id="how-it-works" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>Free proof before you pay.</h2>
      <div className="cat-tpl-proof-copy">
        <ol className="cat-tpl-steps">
          {steps.map(([heading, copy]) => <li key={heading}><strong>{heading}.</strong> {copy}</li>)}
        </ol>
      </div>
      <figure className="cat-tpl-proof-sample" id={id}>
        <ProofPdfStack href={samplePdfFor(sampleSlug)} sizes="(max-width: 720px) 34vw, 300px" label="Open a sample proof (PDF)"
          front={sampleProofPageFor(sampleSlug, 1, `Sample proof cover: ${sample.title}, with example wording`)}
          back={sampleProofPageFor(sampleSlug, 2, `Measured drawing, finish and fixings for ${sample.title}`)} />
        <figcaption><a href={samplePdfFor(sampleSlug)} target="_blank" rel="noopener">Sample proof (PDF) ↗</a> {sampleNote || `${sample.size} ${sample.label.toLowerCase()}${sample.preset.wood ? ` on ${sample.preset.woodTone === 'dark' ? 'dark wood' : 'light wood'}` : ''}.`}</figcaption>
      </figure>
      <div className="cat-tpl-actions">
        <DesignLink onStart={onLaunch} href={designHref}>Design online</DesignLink>
        <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp cat-tpl-whatsapp"><WhatsAppIcon /> Send words on WhatsApp</ContactLink>
      </div>
      <p className="cat-tpl-small cat-tpl-proof-links">
        Prefer us to lay it out? <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Send us your words</a>
      </p>
      {extra}
    </section>
  );
}

/** The finishes as close-ups with the materials page's own words. `outdoors`: each metal's outdoor line from its
 * product pages (services/catalogueContent.ts) and the site's line on wood backing. */
function FinishesRow({ id, finishes, woodTones, title, intro, outdoors }: {
  id: string; finishes: Finish[]; woodTones: WoodTone[]; title?: string; intro?: React.ReactNode; outdoors?: boolean;
}) {
  // The materials page's own words for each finish: its short tone, and the longer line on computers.
  const story = (title: string) => materialStories.find(item => item.title === title) || { tone: '', copy: '' };
  const tiles = [
    ...templateFinishes.filter(finish => finishes.includes(finish.key)).map(finish => ({ key: finish.key, file: finish.file, label: finish.label, ...story(finish.story),
      outside: outdoors ? (finishOutdoors[finish.key] || '').replace(/^Yes\. /, '') : '' })),
    ...woods.filter(entry => woodTones.includes(entry.tone)).map(entry => ({ key: entry.tone, file: entry.file, label: `${entry.label[0].toUpperCase()}${entry.label.slice(1)} board`, ...story(entry.story),
      outside: outdoors ? 'Wood backing suits indoors or a sheltered spot; the metal on its own is made for outdoors.' : '' })),
  ];
  return (
    <section className="shop-section cat-tpl-finishes" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title || 'The finishes, side by side.'}</h2>
      <p className="cat-tpl-section-intro">{intro || 'Solid brass or stainless steel, laser cut to size, etched and infilled by hand.'} <a href="/materials">Compare the finishes ↗</a></p>
      <ul className={`cat-tpl-finish-row${outdoors ? ' has-outdoors' : ''}`}>
        {tiles.map(tile => (
          <li key={tile.key}>
            <img src={`/site-images/finish/${tile.file}-480.webp`} alt={`${tile.label}, close up`} width="480" height="270" loading="lazy" decoding="async" />
            <strong>{tile.label}</strong>
            <span className="cat-tpl-finish-tone">{tile.tone}</span>
            <span className="cat-tpl-finish-copy">{tile.copy}</span>
            {tile.outside && <span className="cat-tpl-finish-outdoors"><b>Outdoors:</b> {tile.outside}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function WordingBlock({ id, title, intro, inscriptions, link }: { id: string; title: string; intro?: string; inscriptions: Inscription[]; link: { href: string; label: string } }) {
  return (
    <section className="shop-section cat-tpl-wording" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {intro && <p className="cat-tpl-section-intro">{intro}</p>}
      <ul className="cat-tpl-wording-row">
        {inscriptions.map(example => (
          <li key={example.title}>
            <h3>{example.title}</h3>
            <blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote>
          </li>
        ))}
      </ul>
      <a className="shop-text-link" href={link.href}>{link.label} ↗</a>
    </section>
  );
}

/** The tree page's kit, drawn and labelled (memorial research c, /tree-memorial-plaques item 3): an A5 plate on its
 * light solid wood board on the black steel ground stake, to scale, with the sizes from services/checkoutPolicy.mjs. The stake's top
 * is fixed to the back of the board; below the ground it is drawn cut short (the list gives its full length). */
export function StakeKit({ id }: { id: string }) {
  const plate = { w: 210, h: 148 };
  const board = { w: plate.w + WOOD_BACKING_EXTRA_MM, h: plate.h + WOOD_BACKING_EXTRA_MM };
  const inset = WOOD_BACKING_EXTRA_MM / 2;
  const side = 44;
  const ground = board.h + groundStakeVisibleMm(board.h);
  const buried = 110;
  const stakeX = side + board.w / 2 - GROUND_STAKE_WIDTH_MM / 2;
  const marker = (n: number, x: number, y: number, toX: number, toY: number) => (
    <g key={n}>
      <line x1={x} y1={y} x2={toX} y2={toY} stroke="#203b32" strokeWidth="1.6" />
      <circle cx={x} cy={y} r="13" fill="#203b32" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">{n}</text>
    </g>
  );
  return (
    <section className="shop-section cat-tpl-kit" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>What you get.</h2>
      <div className="cat-tpl-kit-body">
        <svg className="cat-tpl-kit-drawing" viewBox={`0 0 ${board.w + side * 2} ${ground + buried + 8}`} role="img"
          aria-label="Drawing to scale: an A5 plate on its light solid wood board, on a black steel ground stake pushed into the ground">
          <rect x={stakeX} y={board.h / 2} width={GROUND_STAKE_WIDTH_MM} height={ground - board.h / 2} fill="#25292b" />
          <rect x={stakeX} y={ground} width={GROUND_STAKE_WIDTH_MM} height={buried - 14} fill="#25292b" opacity="0.3" />
          <path d={`M${stakeX} ${ground + buried - 14} l7.5 8 l7.5 -8 l7.5 8 l7.5 -8`} fill="none" stroke="#25292b" strokeWidth="1.6" opacity="0.5" />
          <rect x={side} y="0" width={board.w} height={board.h} rx="3" fill="#c89b62" stroke="#8d6534" strokeWidth="1.5" />
          <rect x={side + inset} y={inset} width={plate.w} height={plate.h} rx="1.5" fill="#dcc583" stroke="#a88a3f" strokeWidth="1.5" />
          {[34, 62, 80, 102].map((y, index) => <rect key={y} x={side + inset + (index === 1 ? 45 : 62)} y={inset + y} width={index === 1 ? 120 : 86} height={index === 1 ? 10 : 6} rx="2" fill="#5a4a2a" opacity="0.55" />)}
          <line x1="0" y1={ground} x2={board.w + side * 2} y2={ground} stroke="#6b5a3e" strokeWidth="2" />
          {marker(1, side + inset + 28, inset + 26, side + inset + 50, inset + 50)}
          {marker(2, side - 22, board.h - 30, side + 4, board.h - 30)}
          {marker(3, side + board.w + 22, board.h + 40, stakeX + GROUND_STAKE_WIDTH_MM, board.h + 40)}
        </svg>
        <ol className="cat-tpl-kit-list">
          <li><strong>Your plate</strong> in brass or stainless steel, 1.5 mm solid metal, engraved with your words.</li>
          <li><strong>A light solid wood board</strong>, {WOOD_BACKING_EXTRA_MM} mm bigger than the plate each way: {board.w} × {board.h} mm for an A5 plate.</li>
          <li><strong>A black steel ground stake</strong>, {GROUND_STAKE_LENGTH} long, {GROUND_STAKE_WIDTH_MM} mm wide and {GROUND_STAKE_THICKNESS_MM} mm thick, fixed to the back of the board.</li>
        </ol>
      </div>
      <p className="cat-tpl-small">Push the stake into the soil beside the tree, never into the tree itself. In hard or stony ground, make a pilot hole first.</p>
    </section>
  );
}

/** The production times on a page, by kind of plaque, from the catalogue's days for its cards. */
export function timingKinds(cards: ResolvedCard[]) {
  const options = cards.flatMap(item => item.options.map(option => ({ ...option, size: item.card.name || item.name })));
  const metal = options.filter(option => !option.tone && option.finish !== 'aged-brass');
  const aged = options.filter(option => !option.tone && option.finish === 'aged-brass');
  const boards = options.filter(option => option.tone);
  const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0]);
  // `label` heads a row of the planner; `inline` sits in a sentence.
  const kinds: { label: string; inline: string; days: number }[] = [];
  if (metal.length) kinds.push({ label: 'Stainless steel or brass', inline: 'stainless steel or brass', days: Math.max(...metal.map(option => option.days)) });
  if (aged.length) kinds.push({ label: 'Aged brass', inline: 'aged brass', days: Math.max(...aged.map(option => option.days)) });
  for (const days of [...new Set(boards.map(option => option.days))].sort((a, b) => a - b)) {
    const sizes = [...new Set(boards.filter(option => option.days === days).map(option => option.size))];
    kinds.push({ label: `On a wood board: ${sizes.join(', ')}`, inline: `${list(sizes)} on a wood board`, days });
  }
  return kinds;
}

/** "When is your opening?" (occasion research c, /opening-plaques item 2): for a date, the last day to approve the proof
 * and pay for each kind of plaque on the page, counted back in working days: the catalogue's production days, one
 * working day of delivery and one to spare. Without the script, the production times as one line. */
export function OccasionPlanner({ id, cards, subject, occasion = 'opening' }: { id: string; cards: ResolvedCard[]; subject: string; occasion?: string }) {
  const mounted = useMounted();
  const [date, setDate] = useState('');
  const kinds = timingKinds(cards);
  const [first, ...rest] = kinds;
  const today = mounted ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date()) : '';
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const show = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    ...(day.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) });
  return (
    <section className="shop-section cat-tpl-planner" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>When is your {occasion}?</h2>
      <p className="cat-tpl-section-intro">{first.label} plaques are made in {first.days} working days after you approve your proof and pay{rest.length
        ? ` (${rest.map(kind => `${kind.inline} ${kind.days}`).join(', ')})` : ''}, then delivered the next working day.</p>
      {mounted && <label className="cat-tpl-planner-field"><span>Date of the {occasion}</span>
        <input type="date" value={date} min={today} max={PLANNER_LAST_DAY} onChange={event => setDate(event.target.value)} /></label>}
      {valid && <ul className="cat-tpl-planner-list" aria-live="polite">
        {kinds.map(kind => {
          const by = approveBy(date, kind.days, today);
          return <li key={kind.label} className={by.status === 'late' ? 'is-late' : undefined} data-days={kind.days} data-approve-by={by.day}><span>{kind.label}</span>{
            by.status === 'late' ? <strong>Too close to promise: ask us first</strong>
              : by.status === 'unknown' ? <strong>Too far ahead to count: ask us</strong>
                : <strong>Approve and pay by {by.status === 'today' ? 'today' : show(by.day!)}</strong>}</li>;
        })}
      </ul>}
      <p className="cat-tpl-small">{valid && 'Counted back from your date: the working days to make it, one working day’s delivery and a day to spare, missing out weekends and bank holidays. '}Delivery dates are estimates, not guarantees. A fixed date? <ContactLink channel="whatsapp" placement="page" subject={subject}>Tell us on WhatsApp</ContactLink> before you order.</p>
    </section>
  );
}

export type TemplateConfig = {
  /** Anchors: `${prefix}-grid`, -questions, -sizes, -proof, -finishes, -wording, -materials (other pages link to
   * /memorial-plaques#memorial-wording). */
  prefix: string;
  title: string;
  /** The line under the H1 in the homepage's tagline style; the homepage's own (homeTagline) where a page has none. */
  tagline?: React.ReactNode;
  /** Two lines under the H1. */
  intro: React.ReactNode;
  cards: TemplateCard[];
  /** 'wide': 4:3 photos, for pages of thin bench strips. */
  photos?: 'square' | 'wide';
  chips: TemplateChip[];
  /** Chips that open another page (the garden page's ground stake and bench). */
  links?: TemplateLinkChip[];
  /** Only these finishes, on the cards and in the finishes row (the brass and stainless steel pages). */
  finishes?: Finish[];
  /** 'stake': every plaque on the light solid wood board and ground stake (the tree page). */
  mount?: 'stake';
  /** The facts line's from-price where the page's own is not a catalogue price (the custom page). */
  from?: { value: number; slug: string };
  /** What the prices include, in the facts line. */
  included?: string;
  /** A last, full-width tile in the grid (the custom page's free quote). */
  gridEnd?: React.ReactNode;
  faqTitle: string;
  /** A section of the page's own straight after the questions (the tree kit, the opening date planner). */
  afterQuestions?: (cards: ResolvedCard[], subject: string) => React.ReactNode;
  /** The finishes row straight after the questions (the material pages), with its own title, intro and outdoor lines. */
  finishesFirst?: boolean;
  finishesTitle?: string;
  finishesIntro?: React.ReactNode;
  outdoors?: boolean;
  sizes: { title: string; intro: string; scale: 'wall' | 'bench' | 'stake'; reference?: keyof typeof REFERENCES; sizes: TemplateSize[]; tableSizes: TemplateSize[]; note?: React.ReactNode; more?: React.ReactNode };
  sampleSlug: string;
  sampleNote?: string;
  steps?: [string, string][];
  /** Below the proof steps (the opening page's notes for schools, councils and companies). */
  proofExtra?: React.ReactNode;
  wording?: { title: string; intro?: string; inscriptions: Inscription[]; link: { href: string; label: string } };
  /** Visible sections after the wording ideas (anchors `${prefix}-${key}`). */
  guides?: TemplateGuide[];
  moreTitle: string;
  related?: React.ReactNode;
  closing: { title: string; copy: React.ReactNode };
  designHref?: string;
};

/** A section of short notes, each optionally linking to its own page (owner msg 10173, 5 Nov 2026, the page-1
 * improvements): what a metal is used for, memorial gardens, garden dedication signs, a closer look at aged brass.
 * The page-1 SEO sections (owner msgs 10401-10408, 6 Nov 2026) are the same block with only an H2 and paragraphs in
 * the intro's style; `beforeWording` puts one directly above the wording ideas instead of after them. */
export type TemplateGuide = {
  key: string;
  title: string;
  intro?: React.ReactNode;
  /** Paragraphs after the intro, in the same style. */
  paragraphs?: React.ReactNode[];
  items?: { title: string; href?: string; copy: React.ReactNode }[];
  /** After the notes (the aged brass sizes). */
  more?: React.ReactNode;
  beforeWording?: boolean;
};

function GuideBlock({ id, title, intro, paragraphs, items, more }: Omit<TemplateGuide, 'key' | 'beforeWording'> & { id: string }) {
  return (
    <section className="shop-section cat-tpl-guide" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      {intro && <p className="cat-tpl-section-intro">{intro}</p>}
      {(paragraphs || []).map((paragraph, index) => <p key={index} className="cat-tpl-section-intro">{paragraph}</p>)}
      {items && items.length > 0 && <ul className="cat-tpl-guide-list">
        {items.map(item => (
          <li key={item.title}>
            <h3>{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3>
            <p>{item.copy}</p>
          </li>
        ))}
      </ul>}
      {more}
    </section>
  );
}

/** A "more about" section's copy with its in-text link (`link`), on the first place its words appear. The words must be
 * in the copy: a missing anchor fails the build rather than quietly dropping the link. */
function linkedCopy(copy: string, link?: { text: string; href: string }) {
  if (!link) return copy;
  const at = copy.indexOf(link.text);
  if (at < 0) throw new Error(`Category template: "${link.text}" is not in its section's copy`);
  return <>{copy.slice(0, at)}<a href={link.href}>{link.text}</a>{copy.slice(at + link.text.length)}</>;
}

export function CategoryTemplatePage({ config, product, faqs, onLaunch, onRequestDesign }: {
  config: TemplateConfig;
  product: ProductFamily;
  faqs: { question: string; answer: string }[];
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  const mounted = useMounted();
  const subject = plaqueSubject(product.shortTitle);
  const parent = categoryParentFor(product.slug);
  const id = (name: string) => `${config.prefix}-${name}`;
  const stake = config.mount === 'stake';
  const cards = config.cards.map(card => resolveCard(card, { finishes: config.finishes, mount: config.mount }));
  const film = categoryFilmFor(product.slug);
  const fromValue = config.from ? config.from.value : displayedPriceValue(product.startingFrom);
  const fromLabel = config.from ? `From ${formatGbp(config.from.value)}` : product.startingFrom.replace(/^from/, 'From');
  const finishes = <FinishesRow id={id('finishes')} finishes={config.finishes || templateFinishes.map(finish => finish.key)}
    woodTones={stake ? ['light'] : config.cards.some(card => card.board) ? ['light', 'dark'] : []}
    title={config.finishesTitle} intro={config.finishesIntro} outdoors={config.outdoors} />;
  const crumbs = (
    <div className={`shop-breadcrumb ${film ? 'shop-hero-crumbs' : 'cat-tpl-crumbs'}`}>
      <a href="/">Home</a>
      <span>/</span>
      {parent && <><a href={`/${parent.slug}`}>{parent.title}</a><span>/</span></>}
      <span>{product.title}</span>
    </div>
  );
  const included = config.included || 'engraving, fixings & UK delivery included';
  const price = <TrackedPrice value={fromValue} product={product.slug}>{fromLabel}</TrackedPrice>;
  // The price row reads like the homepage's ("Bench plaques from £58.50 with UK delivery").
  const priceInRow = <TrackedPrice value={fromValue} product={product.slug}>{fromLabel.replace(/^From/, 'from')}</TrackedPrice>;
  return (
    <div className="shopfront cat-page cat-tpl" data-prerendered="true">
      {/* The page's own film at the top, as on the homepage (owner msg 10240, 6 Nov 2026), in the homepage's own hero
          (owner msg 10329: "we want to be matching the text size and layout of the homepage always"): the same kicker,
          title, tagline, intro and buttons, the film straight under the buttons on phones and beside the copy on
          computers, then the AI note, the price and the page's facts. The buttons light up as it plays. */}
      {film ? (
        <ShopHero
          className="cat-film-hero"
          crumbs={crumbs}
          kicker={<>Free proof · UK delivery · {price}</>}
          title={config.title}
          tagline={config.tagline || homeTagline}
          intro={config.intro}
          choices={<>
            <DesignLink onStart={onLaunch} href={config.designHref}>Design online</DesignLink>
            <ContactLink channel="whatsapp" placement="hero" subject={subject} className="shop-button shop-hero-choice-whatsapp">
              <WhatsAppIcon /> Design on WhatsApp
            </ContactLink>
          </>}
          film={className => <CategoryFilmFigure className={className} film={film} />}
        >
          <p className="shop-hero-ai-note">
            Made a design in ChatGPT? <ContactLink channel="whatsapp" placement="hero" subject={subject}>Send us the picture</ContactLink> and we’ll make it real.
          </p>
          <div className="shop-hero-price">
            <span>{product.title}</span>
            <strong>{priceInRow}</strong>
            <span>{included}</span>
          </div>
          <p className="shop-hero-note">
            Free proof before you pay · Made in {usualDays(cards)} working days · Or <ContactLink channel="email" placement="hero">email us</ContactLink>
          </p>
        </ShopHero>
      ) : (
        <header className="cat-tpl-head">
          {crumbs}
          <h1>{config.title}</h1>
          <p className="cat-tpl-intro">{config.intro}</p>
          <p className="cat-hero-buy"><strong className="shop-product-price">{price}</strong>
            <span> · {included} · free proof before you pay · made in {usualDays(cards)} working days</span></p>
        </header>
      )}
      <ProductGrid id={id('grid')} cards={cards} chips={config.chips} links={config.links} end={config.gridEnd} wide={config.photos === 'wide'} stake={stake} mounted={mounted} />
      <FaqAccordion id={id('questions')} title={config.faqTitle} faqs={faqs} subject={subject} />
      {config.afterQuestions?.(cards, subject)}
      {config.finishesFirst && finishes}
      <SizeStrip id={id('sizes')} {...config.sizes} mount={config.mount} finishes={config.finishes} />
      <ProofBlock id={id('proof')} sampleSlug={config.sampleSlug} sampleNote={config.sampleNote} steps={config.steps || defaultSteps} subject={subject}
        designHref={config.designHref} extra={config.proofExtra} onLaunch={onLaunch} onRequestDesign={onRequestDesign} />
      {!config.finishesFirst && finishes}
      {(config.guides || []).filter(guide => guide.beforeWording).map(({ key, beforeWording, ...guide }) => <GuideBlock key={key} id={id(key)} {...guide} />)}
      {config.wording && <WordingBlock id={id('wording')} {...config.wording} />}
      {(config.guides || []).filter(guide => !guide.beforeWording).map(({ key, beforeWording, ...guide }) => <GuideBlock key={key} id={id(key)} {...guide} />)}
      <section className="shop-section cat-tpl-more" id={id('materials')}>
        <details className="cat-tpl-fold">
          <summary>{config.moreTitle}<span aria-hidden="true">+</span></summary>
          <div>
            {product.seoIntro && <p>{product.seoIntro}</p>}
            {(product.seoSections || []).map(section => <React.Fragment key={section.title}><h3>{section.title}</h3><p>{linkedCopy(section.copy, section.link)}</p></React.Fragment>)}
          </div>
        </details>
        {config.related}
      </section>
      <section className="shop-closing cat-tpl-closing">
        <h2>{config.closing.title}</h2>
        <p>{config.closing.copy}</p>
        <div className="shop-closing-choices">
          <DesignLink onStart={onLaunch} className="shop-button-light" href={config.designHref}>Design online</DesignLink>
          <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Ask us on WhatsApp
          </ContactLink>
        </div>
        <p className="cat-tpl-portrait-link">A face or a pet on the plaque? <a href="/portrait-plaques">Add a portrait from a photo</a></p>
      </section>
      <MobileContactBar subject={subject} onDesign={onLaunch} designHref={config.designHref} />
    </div>
  );
}
