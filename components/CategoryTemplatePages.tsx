import React from 'react';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import type { ProductFamily } from '../services/commerce';
import { MemorialMaterialLinks, memorialInscriptions } from './MemorialGuide';
import { SizeLinksFold } from './CategoryLanding';
import { BRASS, STAINLESS, type TemplateCard, type TemplateChip, type TemplateConfig, sizeName } from './CategoryTemplate';

// The pages on the "products first" template (components/CategoryTemplate.tsx), stage 1 of the rebuild (owner msg
// 8384, 1 Nov 2026): /memorial-plaques and /bench-plaques, from workspace
// output/instaplaque-competitor-research-20261101/memorial/REPORT.md section (c). Titles, meta descriptions and H1s
// are unchanged (we rank 5th on Google for "memorial bench plaques" with the bench page). The other category pages
// keep components/CategoryPages.tsx until their stage; their old memorial and bench configs stay there, so removing a
// slug from `templatePages` below restores that page's previous layout.
//
// Lead photos: one studio shot per card, mixing brass, steel and wood across each grid (owner msg 5927: "use mixture
// of materials, borders, woods etc"); every lead carries memorial wording. Sizes, finishes and prices all come from the
// catalogue. "What fits" lines describe the example wording each size is shown with.

const related = (content: React.ReactNode) => <p className="memorial-material-links cat-related">{content}</p>;
const metalChips: TemplateChip[] = [
  { key: 'all', label: 'All' },
  { key: 'brass', label: 'Brass', finishes: BRASS },
  { key: 'stainless', label: 'Stainless steel', finishes: STAINLESS },
];

// "What fits" lines stay within one line of a phone card (about 27 characters).
const memorialCards: TemplateCard[] = [
  { width: 150, height: 50, fits: 'A name and dates', group: 'small', lead: 'polished-brass' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'On an oak or walnut board', group: 'medium', lead: 'brushed-stainless', leadTone: 'dark' },
  { width: 200, height: 150, fits: 'A name, dates and a line', group: 'medium', lead: 'brushed-stainless' },
  { width: 148, height: 210, name: 'A5', fits: 'A short tribute, upright', group: 'medium', lead: 'orbital-brass-matt-lacquer' },
  { width: 297, height: 210, name: 'A4', fits: 'A longer tribute', group: 'large', lead: 'polished-stainless' },
  { width: 297, height: 210, name: 'A4', board: true, fits: 'A wall memorial on a board', group: 'large', lead: 'brushed-brass', leadTone: 'light' },
  { width: 250, height: 150, shape: 'oval', fits: 'A short memorial', group: 'medium', lead: 'aged-brass' },
  { width: 200, height: 200, shape: 'circle', fits: 'A short dedication', group: 'medium', lead: 'brushed-brass' },
  { width: 400, height: 300, fits: 'A family memorial or poem', group: 'large', lead: 'polished-brass' },
  { width: 400, height: 300, board: true, fits: 'Family memorial, on a board', group: 'large', lead: 'aged-brass', leadTone: 'light' },
];

const benchCards: TemplateCard[] = [
  { width: 150, height: 50, fits: 'A name and dates', lead: 'polished-stainless' },
  { width: 150, height: 65, fits: 'Name and dates, larger', lead: 'brushed-brass' },
  { width: 150, height: 75, fits: 'A name, dates and a line', lead: 'brushed-stainless' },
  { width: 200, height: 50, fits: 'Two names, or a longer line', lead: 'orbital-brass-matt-lacquer' },
  { width: 225, height: 65, fits: 'A long name and a verse', lead: 'polished-brass' },
  { width: 225, height: 75, fits: 'A longer dedication', lead: 'aged-brass' },
];

function memorialPage(): TemplateConfig {
  return {
    prefix: 'memorial',
    title: 'Personalised memorial plaques',
    intro: <>Solid brass or stainless steel, etched and infilled by hand, for a <a href="/bench-plaques">bench</a>, <a href="/garden-plaques">garden</a>, <a href="/tree-memorial-plaques">tree</a>, grave or wall.</>,
    cards: memorialCards,
    chips: [
      ...metalChips,
      { key: 'small', label: 'Small', group: 'small' },
      { key: 'medium', label: 'Medium', group: 'medium' },
      { key: 'large', label: 'Large', group: 'large' },
      { key: 'board', label: 'On a wood board', board: true },
    ],
    faqTitle: 'Memorial plaque questions.',
    sizes: {
      title: 'Sizes, drawn to scale.',
      intro: 'Measure the space first, then give the words room to breathe.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates' },
        { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A longer tribute' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A family memorial' },
      ],
      tableSizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates, for a bench' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, dates and a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A longer tribute or several names' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A family memorial, a poem or a portrait' },
      ],
      note: <>Oak or walnut backing is priced on each plaque. <a href="/plaque-sizes">See every size and price</a>.</>,
    },
    sampleSlug: 'brushed-stainless-210x148-rect-dark-wood-plaque',
    wording: {
      title: 'Memorial wording ideas.',
      inscriptions: memorialInscriptions,
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    moreTitle: 'More about memorial plaques',
    related: <><MemorialMaterialLinks />{related(<>For an agreed church memorial or pew inscription, see <a href="/church-plaques">church pew and dedication plaques</a>.</>)}</>,
    closing: {
      title: 'Not sure which size?',
      copy: 'Send a photo of the space and your words on WhatsApp: we’ll suggest a size and send a free proof. Several names or a bespoke size? Ask us too.',
    },
  };
}

function benchPage(): TemplateConfig {
  const first = sizeName(benchCards[0]);
  const last = sizeName(benchCards[benchCards.length - 1]);
  return {
    prefix: 'bench',
    title: 'Personalised bench plaques',
    intro: <>Solid brass or stainless steel, {first.replace(' mm', '')} to {last}, with screws. For a <a href="/garden-plaques">garden</a> or <a href="/tree-memorial-plaques">tree</a>?</>,
    cards: benchCards,
    photos: 'wide',
    chips: [
      { key: 'all', label: 'All' },
      { key: 'stainless', label: 'Stainless steel', finishes: STAINLESS },
      { key: 'brass', label: 'Brass', finishes: ['polished-brass', 'brushed-brass', 'orbital-brass-matt-lacquer'] },
      { key: 'aged', label: 'Aged brass', finishes: ['aged-brass'] },
    ],
    faqTitle: 'Bench plaque questions.',
    sizes: {
      title: 'Which size fits your bench?',
      intro: 'Measure the flat part of the backrest first: most top rails take a plaque 50 to 75 mm tall.',
      scale: 'bench',
      reference: 'card',
      sizes: benchCards.map(card => ({ label: sizeName(card), widthMm: card.width, heightMm: card.height, fits: card.fits })),
      tableSizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a short line' },
        { label: '200 × 50 mm', widthMm: 200, heightMm: 50, fits: 'Two names, or a longer line' },
        { label: '150 × 75 mm', widthMm: 150, heightMm: 75, fits: 'A name, dates and a line' },
        { label: '225 × 75 mm', widthMm: 225, heightMm: 75, fits: 'A longer dedication' },
      ],
      more: <SizeLinksFold title="Every bench plaque size and finish" offers={merchantOffers.filter(offer => offer.format === 'Bench')} />,
    },
    sampleSlug: 'brushed-stainless-150x50-rect-plaque',
    wording: {
      title: 'Bench plaque wording ideas.',
      inscriptions: [
        { title: 'A short remembrance', lines: ['In loving memory of', 'Margaret Ellis', '1942–2024', 'Always in our hearts'] },
        { title: 'A favourite place', lines: ['For David', 'Who loved this view', 'And everyone who shared it'] },
        { title: 'An invitation', lines: ['Sit awhile with', 'Nancy Bell', '1941–2022'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    moreTitle: 'More about choosing a bench plaque',
    related: related(<>Remembering someone? See <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">memorial wording ideas</a>. For a garden or a memorial tree, see <a href="/garden-plaques">garden plaques</a> and <a href="/tree-memorial-plaques">memorial tree plaques</a>.</>),
    closing: {
      title: 'Not sure which size fits?',
      copy: 'Send a photo of the bench rail and your words on WhatsApp: we’ll suggest a size and send a free proof. Replacing an old plaque? Send its size and hole positions.',
    },
  };
}

const templatePages: Record<string, () => TemplateConfig> = {
  'memorial-plaques': memorialPage,
  'bench-plaques': benchPage,
};

export const categoryTemplateSlugs = Object.keys(templatePages);

export function categoryTemplateFor(product: ProductFamily): TemplateConfig | undefined {
  return templatePages[product.slug]?.();
}
