import React, { useEffect, useState } from 'react';
import { merchantImageQuery, merchantOffers } from '../services/merchantCatalogue.mjs';
import { studioPhotoPath, studioPhotos } from '../services/studioPhotos.mjs';
import { categoryParentFor, materialStories, photo600, type ProductFamily } from '../services/commerce';
import { optimisedSrcSet } from '../services/imageUrls';
import { promoVideoPath } from '../services/promoVideo.mjs';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { ProofPdfStack } from './FeatureSections';
import { samplePdfFor, sampleProofPageFor } from './CatalogueDetails';
import { DesignLink } from './Shopfront';
import { PriceTable, formatGbp, priceTableIncludes, type PriceTableSize } from './PriceTable';
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
  { tone: 'light', label: 'light oak', short: 'oak', file: 'light-wood', story: 'Light wood backing' },
  { tone: 'dark', label: 'dark walnut', short: 'walnut', file: 'dark-wood', story: 'Dark wood backing' },
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
  /** The wood-backed versions, in light oak and dark walnut. */
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
};
/** A chip narrows the grid: by finish (`finishes`), by size group (`group`) or to wood-backed cards (`board`). */
export type TemplateChip = { key: string; label: string; finishes?: Finish[]; group?: string; board?: true };

type CardImage = { src: string; srcSet?: string; drawing: boolean };
/** `label`: "Polished stainless steel on dark walnut" (screen readers, swatch titles); `short`: "Polished steel on walnut",
 * on the photo. */
type CardOption = { slug: string; finish: Finish; tone?: WoodTone; price: number; days: number; title: string; label: string; short: string; image: CardImage };
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
 * finish left off for want of a picture is cheaper than the card's from-price, which would then be wrong. */
export function resolveCard(card: TemplateCard): ResolvedCard {
  const name = sizeName(card);
  const offers = merchantOffers.filter(offer => offer.preset.width === card.width && offer.preset.height === card.height
    && offer.preset.shape === (card.shape || 'rect') && Boolean(offer.preset.wood) === Boolean(card.board));
  const options: CardOption[] = [];
  const unpictured: Offer[] = [];
  for (const finish of templateFinishes) {
    for (const wood of card.board ? woods : [undefined]) {
      const offer = offers.find(item => item.preset.material === finish.key && (!wood || item.preset.woodTone === wood.tone));
      if (!offer) continue;
      const image = cardImage(offer);
      if (!image) { unpictured.push(offer); continue; }
      options.push({ slug: offer.slug, finish: finish.key, tone: wood?.tone, price: offer.price, days: offer.productionDays, title: offer.title,
        label: wood ? `${finish.label} on ${wood.label}` : finish.label, short: wood ? `${finish.short} on ${wood.short}` : finish.short, image });
    }
  }
  if (!options.length) throw new Error(`Category template: no catalogue plaque for ${name}`);
  const from = Math.min(...options.map(option => option.price));
  const hidden = unpictured.find(offer => offer.price < from);
  if (hidden) throw new Error(`Category template: ${hidden.slug} has no picture and is cheaper than the ${name} card's from-price`);
  const lead = options.find(option => option.finish === card.lead && (!card.board || option.tone === (card.leadTone || 'light')));
  if (!lead || lead.image.drawing) throw new Error(`Category template: the ${name} card's lead finish needs a studio photo`);
  return { card, name, options, lead, from };
}

/** The production days on a page: the usual figure, then aged brass and wood backing where the page sells them. */
export function leadTimeNote(cards: ResolvedCard[]) {
  const options = cards.flatMap(item => item.options);
  const usual = Math.min(...options.map(option => option.days));
  const aged = options.filter(option => option.finish === 'aged-brass' && !option.tone).map(option => option.days);
  const wood = options.filter(option => option.tone).map(option => option.days);
  const range = (days: number[]) => (Math.min(...days) === Math.max(...days) ? `${days[0]}` : `${Math.min(...days)}–${Math.max(...days)}`);
  const extra = [aged.length && Math.max(...aged) > usual ? `aged brass ${range(aged)}` : '', wood.length ? `wood-backed ${range(wood)}` : ''].filter(Boolean);
  return `made in the UK in ${usual} working days after you approve${extra.length ? ` (${extra.join(', ')})` : ''}`;
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

function GridCard({ item, finishes, mounted, priority, wide }: { item: ResolvedCard; finishes?: Finish[]; mounted: boolean; priority: number; wide: boolean }) {
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
  const choose = (finish: Finish, tone?: WoodTone) => setPicked({ finish, tone });
  const swatch = (key: string, file: string, label: string, option: CardOption, selected: boolean, onPick: () => void) => (mounted
    ? <button type="button" key={key} className={`cat-tpl-swatch${selected ? ' is-selected' : ''}`} style={swatchStyle(file)}
      aria-pressed={selected} aria-label={`${label}, ${formatGbp(option.price)}`} title={label} onClick={onPick} />
    : <a key={key} className={`cat-tpl-swatch${selected ? ' is-selected' : ''}`} style={swatchStyle(file)} href={`/${option.slug}`}
      data-price={option.price} aria-label={`${label}, ${formatGbp(option.price)}`} title={label} />);
  return (
    <li className={`cat-tpl-card${item.card.board ? ' is-board' : ''}`} data-options={item.options.length}>
      <div className={`cat-tpl-photo${current.image.drawing ? ' is-drawing' : ''}${wide ? ' is-wide' : ''}`}>
        <img src={current.image.src} srcSet={current.image.srcSet} sizes={current.image.srcSet ? '(max-width: 720px) 46vw, 290px' : undefined}
          alt={`${current.title}, shown with example wording${current.image.drawing ? ' (flat design view)' : ''}`} width="600" height="600"
          loading={priority < 4 ? 'eager' : 'lazy'} fetchPriority={priority === 0 ? 'high' : undefined} decoding="async" />
        {/* What the photo shows, so a from-price beside it is never read as that finish's price. */}
        <span className="cat-tpl-finish">{current.short}{current.image.drawing ? ' · design view' : ''}</span>
      </div>
      <h3 className="cat-tpl-card-title">
        <a className="cat-tpl-card-link" href={`/${current.slug}`}>{item.name}<span className="cat-tpl-sr">, {current.label.toLowerCase()}</span></a>
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
    </li>
  );
}

function ProductGrid({ id, cards, chips, wide, mounted }: { id: string; cards: ResolvedCard[]; chips: TemplateChip[]; wide: boolean; mounted: boolean }) {
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
  // Counted as plaques (each size in each finish and wood), as on the catalogue's own product pages.
  const plaques = cards.reduce((sum, item, index) => sum + (shown[index]
    ? item.options.filter(option => !finishChip || finishChip.finishes!.includes(option.finish)).length : 0), 0);
  const pick = (chip: TemplateChip) => {
    if (chip.key === 'all') { setFinishKey(null); setCardKey(null); return; }
    if (chip.finishes) setFinishKey(key => (key === chip.key ? null : chip.key));
    else setCardKey(key => (key === chip.key ? null : chip.key));
  };
  const active = (chip: TemplateChip) => (chip.key === 'all' ? !finishKey && !cardKey : chip.key === finishKey || chip.key === cardKey);
  return (
    <section className="cat-tpl-grid-section" id={id} aria-label="Plaques to choose from">
      <div className={`cat-tpl-toolbar${mounted ? '' : ' is-static'}`}>
        <p className="cat-tpl-count" aria-live="polite">{plaques} plaques</p>
        <div className="cat-tpl-chips" role="group" aria-label="Narrow the plaques" aria-hidden={mounted ? undefined : true}>
          {chips.map(chip => (
            <button type="button" key={chip.key} className="cat-tpl-chip" aria-pressed={active(chip)} tabIndex={mounted ? undefined : -1} onClick={() => pick(chip)}>{chip.label}</button>
          ))}
        </div>
      </div>
      {/* Computers: full rows (6 cards in 3 columns, 10 in 5, otherwise 4). */}
      <ul className="cat-tpl-grid" style={{ '--cat-tpl-cols': cards.length % 4 === 0 ? 4 : cards.length % 5 === 0 ? 5 : cards.length % 3 === 0 ? 3 : 4 } as React.CSSProperties}>
        {cards.map((item, index) => (
          <React.Fragment key={item.name + (item.card.board ? ' board' : '')}>
            {shown[index] && <GridCard item={item} finishes={finishChip?.finishes} mounted={mounted} priority={index} wide={wide} />}
          </React.Fragment>
        ))}
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
const cheapestOf = (size: PriceTableSize) => merchantOffers
  .filter(offer => !offer.preset.wood && offer.preset.width === size.widthMm && offer.preset.height === size.heightMm && offer.preset.shape === (size.shape || 'rect'))
  .sort((a, b) => a.price - b.price)[0];

/** Every size drawn to one scale beside an everyday object, each linking to its cheapest plaque at that price; the
 * size × metal price table folded below it. */
function SizeStrip({ id, title, intro, scale, reference, sizes, tableSizes, note, more }: {
  id: string; title: string; intro: string; scale: 'wall' | 'bench'; reference: keyof typeof REFERENCES;
  sizes: TemplateSize[]; tableSizes: TemplateSize[]; note?: React.ReactNode; more?: React.ReactNode;
}) {
  const ref = REFERENCES[reference];
  const plate = (widthMm: number, heightMm: number) => ({ width: `calc(${widthMm}px * var(--cat-tpl-mm))`, height: `calc(${heightMm}px * var(--cat-tpl-mm))` });
  return (
    <section className="shop-section cat-tpl-sizes" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{title}</h2>
      <p className="cat-tpl-section-intro">{intro}</p>
      <p className={`cat-tpl-scale-ref is-${scale}`}>
        <span className={`cat-tpl-plate is-${reference}`} style={plate(ref.widthMm, ref.heightMm)} aria-hidden="true" /> {ref.label}.
      </p>
      <ul className={`cat-tpl-scale is-${scale}`}>
        {sizes.map(size => {
          const offer = cheapestOf(size);
          if (!offer) throw new Error(`Category template: no plaque ${size.widthMm} × ${size.heightMm}`);
          return (
            <li key={size.label}>
              <a className="cat-tpl-scale-link" href={`/${offer.slug}`}>
                <span className={`cat-tpl-plate${size.shape ? ` is-${size.shape}` : ''}`} style={plate(size.widthMm, size.heightMm)} aria-hidden="true" />
                <b>{size.label}</b>
                <small>{size.fits}</small>
                <strong>from <TrackedPrice value={offer.price} product={offer.slug}>{formatGbp(offer.price)}</TrackedPrice></strong>
              </a>
            </li>
          );
        })}
      </ul>
      <details className="cat-tpl-fold">
        <summary>Compare all sizes and prices<span aria-hidden="true">+</span></summary>
        <div>
          <PriceTable sizes={tableSizes} caption={`${title} Prices by size and metal.`} />
          <p className="shop-smallprint">{priceTableIncludes}{note && <> {note}</>}</p>
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

function ProofBlock({ id, sampleSlug, sampleNote, steps, subject, designHref, onLaunch, onRequestDesign }: {
  id: string; sampleSlug: string; sampleNote?: string; steps: [string, string][]; subject: string; designHref?: string;
  onLaunch?: () => void; onRequestDesign?: () => void;
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
        <figcaption><a href={samplePdfFor(sampleSlug)} target="_blank" rel="noopener">Sample proof (PDF) ↗</a> {sampleNote || `${sample.size} ${sample.label.toLowerCase()}${sample.preset.wood ? ` on ${sample.preset.woodTone === 'dark' ? 'dark walnut' : 'light oak'}` : ''}.`}</figcaption>
      </figure>
      <div className="cat-tpl-actions">
        <DesignLink onStart={onLaunch} href={designHref}>Design online</DesignLink>
        <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp cat-tpl-whatsapp"><WhatsAppIcon /> Send words on WhatsApp</ContactLink>
      </div>
      <p className="cat-tpl-small cat-tpl-proof-links">
        Prefer us to lay it out? <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Send us your words</a>
        {' · '}<a href={promoVideoPath}>Watch the designer in action</a>
      </p>
    </section>
  );
}

function FinishesRow({ id, wood }: { id: string; wood: boolean }) {
  // The materials page's own words for each finish: its short tone, and the longer line on computers.
  const story = (title: string) => materialStories.find(item => item.title === title) || { tone: '', copy: '' };
  const tiles = [
    ...templateFinishes.map(finish => ({ key: finish.key, file: finish.file, label: finish.label, ...story(finish.story) })),
    ...(wood ? woods.map(entry => ({ key: entry.tone, file: entry.file, label: `${entry.label[0].toUpperCase()}${entry.label.slice(1)} board`, ...story(entry.story) })) : []),
  ];
  return (
    <section className="shop-section cat-tpl-finishes" id={id} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>The finishes, side by side.</h2>
      <p className="cat-tpl-section-intro">Solid brass or stainless steel, laser cut to size, etched and infilled by hand. <a href="/materials">Compare the finishes ↗</a></p>
      <ul className="cat-tpl-finish-row">
        {tiles.map(tile => (
          <li key={tile.key}>
            <img src={`/site-images/finish/${tile.file}-480.webp`} alt={`${tile.label}, close up`} width="480" height="270" loading="lazy" decoding="async" />
            <strong>{tile.label}</strong>
            <span className="cat-tpl-finish-tone">{tile.tone}</span>
            <span className="cat-tpl-finish-copy">{tile.copy}</span>
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

export type TemplateConfig = {
  /** Anchors: `${prefix}-grid`, -questions, -sizes, -proof, -finishes, -wording, -materials (other pages link to
   * /memorial-plaques#memorial-wording). */
  prefix: string;
  title: string;
  /** Two lines under the H1. */
  intro: React.ReactNode;
  cards: TemplateCard[];
  /** 'wide': 4:3 photos, for pages of thin bench strips. */
  photos?: 'square' | 'wide';
  chips: TemplateChip[];
  faqTitle: string;
  sizes: { title: string; intro: string; scale: 'wall' | 'bench'; reference: keyof typeof REFERENCES; sizes: TemplateSize[]; tableSizes: TemplateSize[]; note?: React.ReactNode; more?: React.ReactNode };
  sampleSlug: string;
  sampleNote?: string;
  steps?: [string, string][];
  wording: { title: string; intro?: string; inscriptions: Inscription[]; link: { href: string; label: string } };
  moreTitle: string;
  related?: React.ReactNode;
  closing: { title: string; copy: React.ReactNode };
  designHref?: string;
};

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
  const cards = config.cards.map(resolveCard);
  const fromLabel = product.startingFrom.replace(/^from/, 'From');
  return (
    <div className="shopfront cat-page cat-tpl" data-prerendered="true">
      <header className="cat-tpl-head">
        <div className="shop-breadcrumb cat-tpl-crumbs">
          <a href="/">Home</a>
          <span>/</span>
          {parent && <><a href={`/${parent.slug}`}>{parent.title}</a><span>/</span></>}
          <span>{product.title}</span>
        </div>
        <h1>{config.title}</h1>
        <p className="cat-tpl-intro">{config.intro}</p>
        <p className="cat-hero-buy"><strong className="shop-product-price"><TrackedPrice value={displayedPriceValue(product.startingFrom)} product={product.slug}>{fromLabel}</TrackedPrice></strong>
          <span> · engraving, fixings and UK delivery included · free PDF proof before you pay · {leadTimeNote(cards)}</span></p>
      </header>
      <ProductGrid id={id('grid')} cards={cards} chips={config.chips} wide={config.photos === 'wide'} mounted={mounted} />
      <FaqAccordion id={id('questions')} title={config.faqTitle} faqs={faqs} subject={subject} />
      <SizeStrip id={id('sizes')} {...config.sizes} />
      <ProofBlock id={id('proof')} sampleSlug={config.sampleSlug} sampleNote={config.sampleNote} steps={config.steps || defaultSteps} subject={subject}
        designHref={config.designHref} onLaunch={onLaunch} onRequestDesign={onRequestDesign} />
      <FinishesRow id={id('finishes')} wood={config.cards.some(card => card.board)} />
      <WordingBlock id={id('wording')} {...config.wording} />
      <section className="shop-section cat-tpl-more" id={id('materials')}>
        <details className="cat-tpl-fold">
          <summary>{config.moreTitle}<span aria-hidden="true">+</span></summary>
          <div>
            {product.seoIntro && <p>{product.seoIntro}</p>}
            {(product.seoSections || []).map(section => <React.Fragment key={section.title}><h3>{section.title}</h3><p>{section.copy}</p></React.Fragment>)}
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
