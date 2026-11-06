import { occasionTemplateConfigs } from './OccasionTemplatePages';
import React from 'react';
import { templatePages } from '../services/categoryTemplateSwitch';
export { templatePages } from '../services/categoryTemplateSwitch';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import type { ProductFamily } from '../services/commerce';
import { DESIGN_WITH_STAKE_HREF } from '../services/groundStake';
import { MAX_PLAQUE_DIMENSION_MM, MIN_PLAQUE_DIMENSION_MM } from '../services/checkoutPolicy.mjs';
import { MemorialMaterialLinks, memorialInscriptions } from './MemorialGuide';
import { SizeLinksFold } from './CategoryLanding';
import { ContactLink, WhatsAppIcon } from './ContactOptions';
import { formatGbp, onStakePrice } from './PriceTable';
import { BRASS, OccasionPlanner, STAINLESS, StakeKit, type Finish, type TemplateCard, type TemplateChip, type TemplateConfig, type TemplateGuide, sizeName } from './CategoryTemplate';

// The pages on the "products first" template (components/CategoryTemplate.tsx), stage 1 of the rebuild (owner msg
// 8384, 1 Nov 2026): /memorial-plaques and /bench-plaques, from workspace
// output/instaplaque-competitor-research-20261101/memorial/REPORT.md section (c). Titles, meta descriptions and H1s
// are unchanged (we rank 5th on Google for "memorial bench plaques" with the bench page). The other category pages
// keep components/CategoryPages.tsx until their stage; their old memorial and bench configs stay there, so removing a
// slug from `templatePages` (services/categoryTemplateSwitch.ts) restores live's layout AND FAQs.
//
// Lead photos: one studio shot per card, mixing brass, steel and wood across each grid (owner msg 5927: "use mixture
// of materials, borders, woods etc"); every lead carries memorial wording. Sizes, finishes and prices all come from the
// catalogue. "What fits" lines describe the example wording each size is shown with.

const occasionLinks = (content: React.ReactNode) => <p className="memorial-material-links cat-related cat-stage3-links">{content}</p>;
const related = (content: React.ReactNode) => <p className="memorial-material-links cat-related">{content}</p>;
const metalChips: TemplateChip[] = [
  { key: 'all', label: 'All' },
  { key: 'brass', label: 'Brass', finishes: BRASS },
  { key: 'stainless', label: 'Stainless steel', finishes: STAINLESS },
];

// "What fits" lines stay within one line of a phone card (about 27 characters).
const memorialCards: TemplateCard[] = [
  { width: 150, height: 50, fits: 'A name and dates', group: 'small', lead: 'polished-brass' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'On light or dark wood', group: 'medium', lead: 'brushed-stainless', leadTone: 'dark' },
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
    // The homepage's hero has a tagline under the title (owner msg 10329): each page's line from its earlier live hero
    // (components/CategoryPages.tsx), or the homepage's own where that line would repeat the film's opening words
    // beside it (memorial: "Remember them in your own words"; opening: "Mark the occasion") or the page had none.
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
      note: <>Light or dark solid wood backing is priced on each plaque. <a href="/plaque-sizes">See every size and price</a>.</>,
    },
    sampleSlug: 'brushed-stainless-210x148-rect-dark-wood-plaque',
    wording: {
      title: 'Memorial wording ideas.',
      inscriptions: memorialInscriptions,
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    moreTitle: 'More about memorial plaques',
    related: <><MemorialMaterialLinks />{occasionLinks(<a href="/church-plaques">Church pew and dedication plaques</a>)}</>,
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
    tagline: 'A small place for a lasting memory.',
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
    // Page-1 SEO internal links (owner msgs 10401-10408, 6 Nov 2026): "garden memorial plaques" and "engraved stainless
    // steel plaques".
    related: related(<>Remembering someone? See <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">memorial wording ideas</a>. For a garden or a tree, see <a href="/garden-plaques">garden memorial plaques</a> and <a href="/tree-memorial-plaques">memorial tree plaques</a>. For other sizes in steel, see <a href="/stainless-steel-plaques">engraved stainless steel plaques</a>.</>),
    closing: {
      title: 'Not sure which size fits?',
      copy: 'Send a photo of the bench rail and your words on WhatsApp: we’ll suggest a size and send a free proof. Replacing an old plaque? Send its size and hole positions.',
    },
  };
}

// Stage 2 (1 Nov 2026, owner msgs 8384 and 8402): garden, tree, brass, stainless steel, opening and custom, from the
// research's section (c) for each (memorial, metal-business, occasion and ux REPORT.md). Titles, descriptions and H1s
// are the live ones. Leads chosen by the example wording on each studio photo, to suit the page (catalogueExamples).

type Offer = (typeof merchantOffers)[number];
/** The cheapest plaque of a size without backing in these finishes (brushed first among equal prices). */
function plate(width: number, height: number, finishes: Finish[], shape = 'rect'): Offer {
  const offer = merchantOffers
    .filter(item => !item.preset.wood && item.preset.width === width && item.preset.height === height && item.preset.shape === shape && finishes.includes(item.preset.material as Finish))
    .sort((a, b) => a.price - b.price || Number(b.preset.material.startsWith('brushed')) - Number(a.preset.material.startsWith('brushed')))[0];
  if (!offer) throw new Error(`Category template: no ${width} × ${height} ${shape} plaque in ${finishes.join(', ')}`);
  return offer;
}
const priceOf = (offer: Offer) => formatGbp(offer.price);
const ALL: Finish[] = [...BRASS, ...STAINLESS];
/** The catalogue's standard production time, the days most plaques take (the opening page's commemorative section). */
const STANDARD_DAYS = Math.min(...merchantOffers.map(offer => offer.productionDays));
/** The longest production time of plaques in a finish without backing, in catalogue days. */
const daysIn = (finish: Finish) => Math.max(...merchantOffers.filter(offer => offer.preset.material === finish && !offer.preset.wood).map(offer => offer.productionDays));
const boardChip: TemplateChip = { key: 'board', label: 'On a wood board', board: true };

// The first two cards' photos described (page-1 SEO, owner msgs 10401-10408): the A5 is a memorial, so it is called a
// garden memorial plaque; the oval names a garden and is not a memorial, so it is not.
const gardenCards: TemplateCard[] = [
  { width: 148, height: 210, name: 'A5', fits: 'A dedication, upright', lead: 'polished-stainless',
    leadAlt: 'Polished stainless steel garden memorial plaque, A5 upright, reading This rowan was planted in loving memory of Doreen Watts, 1934 to 2007' },
  { width: 250, height: 150, shape: 'oval', fits: 'A garden’s name', lead: 'aged-brass',
    leadAlt: 'Aged brass oval garden plaque reading Grandad’s Garden, with cream lettering' },
  { width: 200, height: 200, shape: 'circle', fits: 'A short dedication', lead: 'brushed-brass' },
  { width: 300, height: 200, fits: 'A community garden', lead: 'orbital-brass-matt-lacquer' },
  { width: 200, height: 150, fits: 'A name, dates and a line', lead: 'brushed-stainless' },
  { width: 297, height: 210, name: 'A4', fits: 'A longer tribute', lead: 'polished-brass' },
  { width: 150, height: 50, fits: 'Name and dates, for a post', lead: 'polished-stainless' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'For a sheltered spot', lead: 'brushed-brass', leadTone: 'light' },
];

// Page-1 improvements (owner msg 10173, 5 Nov 2026; Search Console 6 Oct-2 Nov): people search "memorial plaques for
// garden" (15th) and "garden memorial plaques" (18th), so the H1 says garden memorial plaques; "garden dedication signs"
// (6th, no clicks yet) gets its own section; and "memorial tree plaques" showed this page (43rd) rather than the tree
// page, so this page now links to the tree page by name.
const gardenGuides: TemplateGuide[] = [
  // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026): "memorial plaques for garden" 14.8, "garden memorial plaques" 18.1,
  // "garden plaques" 23.0. Every size named is on this page.
  {
    key: 'outdoors',
    title: 'Memorial plaques for the garden, made to last outdoors.',
    paragraphs: [
      'Every garden memorial plaque is cut from 1.5 mm solid brass or stainless steel, with etched, paint-filled lettering, so the plate itself is made for outdoor use. Stainless steel keeps its silver colour in the garden. Brass is warm and traditional, and it slowly mellows outside unless it is polished from time to time. Aged brass is sealed with matt lacquer to slow further ageing.',
      'For an open spot in the garden, choose the metal plate on its own. Save wood backing for a porch or a covered corner. A 200 × 150 mm or A5 plaque suits a name, dates and a short message. A4 or 300 × 200 mm suits a longer tribute or a shared memorial garden, and 150 × 50 mm suits just a name and dates on a post. Your screw holes are drawn on the proof, so you can check how it will sit before you pay.',
    ],
  },
  {
    key: 'remembrance',
    title: 'Memorial gardens and gardens of remembrance.',
    intro: 'For a garden of remembrance, a churchyard or your own garden.',
    items: [
      { title: 'In a garden of remembrance', copy: 'Crematoria, churches and councils often have rules on size, material and wording: check first. Your free proof is drawn to size, to show them before you pay.' },
      { title: 'In your own garden', copy: <>A name and dates fit 150 × 50 mm; A5 or 200 × 150 mm leaves room for a line of tribute. See <a href="/memorial-plaque-wording">memorial wording ideas</a>.</> },
      { title: 'Memorial tree plaques', href: '/tree-memorial-plaques', copy: 'Planting a tree in their memory? The plaque stands beside it on a light solid wood board and ground stake.' },
      { title: 'Memorial bench plaques', href: '/bench-plaques', copy: 'A name and dates for the top rail of a garden bench, from 150 × 50 mm.' },
    ],
  },
  {
    key: 'dedications',
    title: 'Garden dedication signs.',
    intro: 'To name a garden, thank the people who made it, or mark its opening.',
    items: [
      { title: 'Name a garden', copy: 'A 250 × 150 mm oval or a 200 mm round plate suits a short name such as “Grandad’s Garden”.' },
      { title: 'A school or community garden', copy: <>300 × 200 mm or A4 fits the garden’s name, who made it and the year. Thanking supporters? See <a href="/donor-recognition-plaques">donor plaques</a>.</> },
      { title: 'Opening plaques', href: '/opening-plaques', copy: 'Who opened the garden and when, with a planner for the last day to approve your proof.' },
    ],
  },
];

function gardenPage(): TemplateConfig {
  return {
    prefix: 'garden',
    title: 'Garden memorial plaques, made for outdoors',
    tagline: 'A dedication for a favourite place.',
    // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026). "Fixings", not "screws and caps": the 150 × 50 mm plates on this
    // page have screws only.
    intro: <>Memorial plaques for the garden in solid brass or stainless steel, made to stay outside all year. Fix one to a wall, fence, post or stone with the fixings included, and see your wording on a free proof before you pay.</>,
    cards: gardenCards,
    chips: [...metalChips, boardChip],
    links: [{ href: '/tree-memorial-plaques', label: 'On a ground stake' }, { href: '/bench-plaques', label: 'On a bench' }],
    faqTitle: 'Garden plaque questions.',
    sizes: {
      title: 'Sizes, drawn to scale.',
      intro: 'Keep the plaque above the planting, then choose a size that gives the words room.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates, for a post' },
        { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication and a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A longer tribute or two names' },
        { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A shared or community garden' },
      ],
      tableSizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a post or bench' },
        { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication and a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A shared garden or several names' },
      ],
      note: <>Metal on its own is made for outdoors. <a href="/plaque-sizes">See every size and price</a>.</>,
    },
    sampleSlug: 'a5-brushed-steel-personalised-plaque',
    outdoors: true,
    finishesIntro: 'Solid brass or stainless steel, laser cut to size, etched and infilled by hand. Near the sea or somewhere very exposed? Ask us before ordering.',
    wording: {
      title: 'Garden plaque wording ideas.',
      inscriptions: [
        { title: 'A short dedication', lines: ['In memory of', 'Margaret Ellis', '1942–2024', 'Always happiest in the garden'] },
        { title: 'A family tribute', lines: ['In loving memory of', 'David Thompson', '1951–2023', 'We remember you here,', 'in the garden you loved'] },
        { title: 'A garden of their own', lines: ['Grandad’s', 'Garden', 'Made with love, 2024'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    guides: gardenGuides,
    moreTitle: 'More about garden plaques',
    related: related(<>Remembering someone? See <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">wording ideas</a>. Planting a tree? See <a href="/tree-memorial-plaques">memorial tree plaques</a>. Opening a community garden? See <a href="/opening-plaques">opening plaques</a>.</>),
    closing: {
      title: 'Not sure which size?',
      copy: 'Send a photo of the spot and your words on WhatsApp: we’ll suggest a size and fixings and send a free proof.',
    },
  };
}

// Every tree plaque is shown and priced on the light solid wood board and black steel ground stake (owner msg 6506); the
// photos show each plate on its light solid wood board (no studio photo shows the stake), and the kit drawing shows all three.
const treeCards: TemplateCard[] = [
  { width: 210, height: 148, name: 'A5', fits: 'Suits most memorial trees', lead: 'brushed-brass', badge: 'Most popular size' },
  { width: 200, height: 150, fits: 'A name, dates and a line', lead: 'brushed-stainless' },
  { width: 148, height: 210, name: 'A5', fits: 'A dedication, upright', lead: 'aged-brass' },
  { width: 297, height: 210, name: 'A4', fits: 'A school or several names', lead: 'orbital-brass-matt-lacquer' },
  { width: 210, height: 297, name: 'A4', fits: 'A longer dedication, upright', lead: 'polished-stainless' },
  { width: 300, height: 200, fits: 'Long names, a wider plate', lead: 'polished-brass' },
];

function treePage(): TemplateConfig {
  const sizes = [
    { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
    { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication, a name and a message' },
    { label: '200 mm round', widthMm: 200, heightMm: 200, fits: 'A short dedication', shape: 'circle' as const },
    { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A school, an orchard or several names' },
  ];
  const plates = merchantOffers.filter(offer => !offer.preset.wood && sizes.some(size => size.widthMm === offer.preset.width && size.heightMm === offer.preset.height && offer.preset.shape === (size.shape || 'rect')));
  return {
    prefix: 'tree',
    title: 'Memorial tree plaques',
    tagline: 'A tree that grows, and their name beside it.',
    intro: <>Brass or stainless steel, on a light solid wood board and ground stake that stands beside the tree, never fixed to it.</>,
    cards: treeCards,
    mount: 'stake',
    included: 'light solid wood board, stake, engraving & UK delivery included',
    chips: metalChips,
    faqTitle: 'Memorial tree plaque questions.',
    afterQuestions: () => <StakeKit id="tree-kit" />,
    sizes: {
      title: 'Sizes, on the board and stake.',
      intro: 'Each drawn to scale, on its light solid wood board and stake. A5 suits most memorial trees; choose A4 for a school, an orchard or several names.',
      scale: 'stake',
      sizes,
      tableSizes: sizes,
      note: <>Fixing it to a post, wall or fence instead? The plate alone is from {priceOf(plate(200, 150, ALL))}: take the board and stake off at the designer’s Backing step.</>,
      more: <SizeLinksFold title="Just the plate, for a post, wall or fence" offers={plates} />,
    },
    sampleSlug: 'brushed-brass-210x148-rect-light-wood-plaque',
    sampleNote: 'Sample A5 brass plaque and light solid wood board. Your tree plaque proof will also include the ground stake.',
    designHref: DESIGN_WITH_STAKE_HREF,
    wording: {
      title: 'Tree plaque wording ideas.',
      inscriptions: [
        { title: 'A memorial tree', lines: ['This cherry tree was planted', 'in loving memory of', 'Jim Partridge', '1947 – 2025'] },
        { title: 'A school tree', lines: ['This tree was planted', 'by the children of', 'Ashfield Primary School', 'in memory of Mrs Long'] },
        { title: 'For a pet', lines: ['In loving memory of', 'Moss', '2009 – 2023', 'Forever by our side'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    moreTitle: 'More about memorial tree plaques',
    // Page-1 SEO internal link (owner msgs 10401-10408, 6 Nov 2026): "garden memorial plaques".
    related: related(<>For a wall, fence or post, see <a href="/garden-plaques">garden memorial plaques</a>. See also <a href="/memorial-plaques">memorial plaques</a> and <a href="/memorial-plaque-wording">memorial wording ideas</a>.</>),
    closing: {
      title: 'Not sure which size?',
      copy: 'Send a photo of the tree and your words on WhatsApp: we’ll suggest a size and send a free proof with the board and stake drawn in.',
    },
  };
}

const brassCards: TemplateCard[] = [
  { width: 200, height: 150, fits: 'A house name', lead: 'polished-brass' },
  { width: 210, height: 148, name: 'A5', fits: 'A memorial or a door plate', lead: 'aged-brass' },
  { width: 150, height: 50, fits: 'A bench: name and dates', lead: 'brushed-brass' },
  { width: 297, height: 210, name: 'A4', fits: 'An opening or a dedication', lead: 'orbital-brass-matt-lacquer' },
  { width: 250, height: 150, shape: 'oval', fits: 'A house name, oval', lead: 'brushed-brass' },
  { width: 200, height: 200, shape: 'circle', fits: 'A short dedication', lead: 'polished-brass' },
  { width: 225, height: 75, fits: 'A longer bench line', lead: 'orbital-brass-matt-lacquer' },
  { width: 297, height: 210, name: 'A4', board: true, fits: 'A room or an opening, on wood', lead: 'aged-brass', leadTone: 'light' },
];

function brassPage(): TemplateConfig {
  const from = (width: number, height: number) => priceOf(plate(width, height, BRASS));
  const aged = (width: number, height: number) => priceOf(plate(width, height, ['aged-brass']));
  return {
    prefix: 'brass',
    title: 'Custom engraved brass plaques',
    tagline: 'Warm, traditional and made to last.',
    intro: <>Polished, brushed, orbital or aged: 150 × 50 mm from {from(150, 50)}, A5 {from(210, 148)}, A4 {from(297, 210)}, 400 × 300 mm {from(400, 300)}.</>,
    cards: brassCards,
    finishes: BRASS,
    chips: [
      { key: 'all', label: 'All' },
      { key: 'polished', label: 'Polished', finishes: ['polished-brass'] },
      { key: 'brushed', label: 'Brushed', finishes: ['brushed-brass'] },
      { key: 'orbital', label: 'Orbital', finishes: ['orbital-brass-matt-lacquer'] },
      { key: 'aged', label: 'Aged', finishes: ['aged-brass'], note: `Aged brass: a hand-applied patina sealed with matt lacquer, with cream lettering. Made in ${daysIn('aged-brass')} working days after you approve.` },
      boardChip,
    ],
    faqTitle: 'Brass plaque questions.',
    finishesFirst: true,
    finishesTitle: 'The four brass finishes, side by side.',
    finishesIntro: 'Solid brass, laser cut to size, etched and infilled by hand.',
    outdoors: true,
    sizes: {
      title: 'Sizes, drawn to scale.',
      intro: 'Measure the space first, then give the words room to breathe.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
        { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A house name' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A door plate or a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or a longer tribute' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication or a history' },
      ],
      tableSizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A house name or a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or a longer tribute' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication, a history or a portrait' },
      ],
      note: <>Light or dark solid wood backing is priced on each plaque.</>,
      more: <SizeLinksFold title="Every brass size and finish" offers={merchantOffers.filter(offer => BRASS.includes(offer.preset.material as Finish) && !offer.preset.wood)} />,
    },
    sampleSlug: 'brushed-brass-210x148-rect-plaque',
    // Page-1 improvements (owner msg 10173, 5 Nov 2026): "brass plaques" 33rd, "custom brass" and "aged brass" about
    // 16th. The wording ideas are the ones live on this page before the template (components/CategoryPages.tsx).
    wording: {
      title: 'Brass plaque wording ideas.',
      intro: 'Start with the most important line, then add the rest beneath it.',
      inscriptions: [
        { title: 'A house name', lines: ['Holly House'] },
        { title: 'A memorial', lines: ['In loving memory of', 'James Ormerod', '1941 – 2019'] },
        { title: 'A thank you', lines: ['Presented to', 'Linda Fairclough', 'with thanks for twenty years'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    guides: [
      // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026): "custom brass plaques" 16.5, "custom engraved brass plaque" 15.9.
      // Directly above the wording ideas; sizes from checkoutPolicy.mjs.
      {
        key: 'custom',
        title: 'Custom brass plaques, made to your size.',
        beforeWording: true,
        paragraphs: [<>Every brass plaque is made to order: rectangles, ovals and circles in any size from {MIN_PLAQUE_DIMENSION_MM} mm up to {MAX_PLAQUE_DIMENSION_MM} mm each way. Your lettering is etched into 1.5 mm solid brass and paint-filled, in polished, brushed, orbital or aged brass. For a logo or crest, send it to us on WhatsApp before ordering and we’ll tell you whether it can be engraved and how it would look on your proof. For other shapes and made-to-measure ideas, see our <a href="/custom-plaques">custom plaques</a>.</>],
      },
      {
        key: 'uses',
        title: 'What brass plaques are used for.',
        intro: 'The traditional choice, warm against timber, brick and stone.',
        items: [
          { title: 'Memorial plaques', href: '/memorial-plaques', copy: 'A name, dates and a tribute for a wall, a grave or a garden.' },
          { title: 'Bench plaques', href: '/bench-plaques', copy: `Name and dates for the top rail, from ${from(150, 50)} for 150 × 50 mm.` },
          { title: 'House name plaques', href: '/house-name-plaques', copy: 'A house name, or a name and number, by the door or gate.' },
          { title: 'Practice plaques', href: '/professional-brass-plaques', copy: 'A traditional name plate for a solicitor, dentist, vet, architect or accountant.' },
          { title: 'Opening plaques', href: '/opening-plaques', copy: 'Who opened the building and when, usually on A4.' },
          { title: 'Church plaques', href: '/church-plaques', copy: 'Pew plates, memorials and dedications, in the wording your church has agreed.' },
          { title: 'Donor and recognition plaques', href: '/donor-recognition-plaques', copy: 'Thank a donor, a sponsor or everyone who helped.' },
        ],
      },
      {
        key: 'aged',
        title: 'Aged brass plaques.',
        intro: 'A hand-applied patina, sealed with matt lacquer, with cream lettering that stands out against the darker metal.',
        items: [
          { title: 'Sizes and prices', copy: `150 × 50 mm from ${aged(150, 50)}, A5 ${aged(210, 148)}, A4 ${aged(297, 210)}, fixings included. Made in ${daysIn('aged-brass')} working days after you approve your proof.` },
          { title: 'Every one is different', copy: 'Each patina is applied by hand, so every plaque has its own natural variation.' },
          { title: 'Outdoors', copy: 'The lacquer slows further ageing; outside, the patina keeps developing slowly, which suits natural gardens and older benches.' },
          { title: 'Looking after it', copy: 'Check the care instructions before using any polish or abrasive cleaner on the sealed finish.' },
        ],
        more: <SizeLinksFold title="Every aged brass size" offers={merchantOffers.filter(offer => offer.preset.material === 'aged-brass' && !offer.preset.wood)} />,
      },
    ],
    moreTitle: 'More about brass plaques',
    related: <>{related(<>Compare with <a href="/stainless-steel-plaques">stainless steel plaques</a>, or see <a href="/memorial-plaques">memorial plaques</a>, <a href="/bench-plaques">bench plaques</a> and <a href="/opening-plaques">opening plaques</a>. Wording help: <a href="/memorial-plaque-wording">memorial wording ideas</a>.</>)}{occasionLinks(<><a href="/house-name-plaques">House name plaques</a> · <a href="/professional-brass-plaques">Professional practice plaques</a></>)}</>,
    closing: {
      title: 'Not sure which finish?',
      copy: 'Send a photo of the spot and your words on WhatsApp: we’ll suggest a size and finish and send a free proof. Replacing an old plaque? Send us a photo of it.',
    },
  };
}

const stainlessCards: TemplateCard[] = [
  { width: 150, height: 50, fits: 'A bench: name and dates', group: 'bench', lead: 'polished-stainless' },
  { width: 148, height: 210, name: 'A5', fits: 'A dedication, upright', group: 'wall', lead: 'brushed-stainless' },
  { width: 200, height: 150, fits: 'A name, dates and a line', group: 'wall', lead: 'polished-stainless' },
  { width: 225, height: 75, fits: 'A bench: a longer line', group: 'bench', lead: 'brushed-stainless' },
  { width: 250, height: 150, shape: 'oval', fits: 'A short memorial', group: 'wall', lead: 'polished-stainless' },
  { width: 200, height: 200, shape: 'circle', fits: 'A house or building name', group: 'wall', lead: 'brushed-stainless' },
  { width: 297, height: 210, name: 'A4', fits: 'An opening or several names', group: 'wall', lead: 'brushed-stainless' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'On wood, for indoors', group: 'wall', lead: 'polished-stainless', leadTone: 'light' },
];

function stainlessPage(): TemplateConfig {
  const board = merchantOffers.filter(offer => offer.preset.wood && STAINLESS.includes(offer.preset.material as Finish)).sort((a, b) => a.price - b.price)[0];
  const treeFrom = plate(200, 150, STAINLESS);
  return {
    prefix: 'stainless',
    title: 'Engraved stainless steel plaques',
    tagline: 'Clean, modern and made for outdoors.',
    // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026): the first sentence follows the tagline. "Fixings": the bench
    // plates have screws only.
    intro: <>Each one is 1.5 mm solid stainless steel with etched, paint-filled lettering, made to order in rectangles, ovals and circles from {MIN_PLAQUE_DIMENSION_MM} mm up to {MAX_PLAQUE_DIMENSION_MM} mm each way, with fixings included. Bench plates from {priceOf(plate(150, 50, STAINLESS))}, A5 {priceOf(plate(210, 148, STAINLESS))}, on a wood board {formatGbp(board.price)}, <a href="/tree-memorial-plaques">on a tree stake</a> {formatGbp(onStakePrice(treeFrom))}.</>,
    cards: stainlessCards,
    finishes: STAINLESS,
    chips: [
      { key: 'all', label: 'All' },
      { key: 'brushed', label: 'Brushed', finishes: ['brushed-stainless'] },
      { key: 'polished', label: 'Polished', finishes: ['polished-stainless'] },
      { key: 'bench', label: 'Bench sizes', group: 'bench' },
      { key: 'wall', label: 'Wall sizes', group: 'wall' },
      boardChip,
    ],
    faqTitle: 'Stainless steel plaque questions.',
    finishesFirst: true,
    finishesTitle: 'Brushed or polished, side by side.',
    finishesIntro: 'Solid stainless steel, laser cut to size, etched and infilled by hand.',
    outdoors: true,
    sizes: {
      title: 'Sizes, drawn to scale.',
      intro: 'Measure the space first, then give the words room to breathe.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
        { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name, dates and a line' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, a welcome or a tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or several names' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication or a history' },
      ],
      tableSizes: [
        { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and a line, for a bench' },
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, a welcome or a short tribute' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'An opening or several names' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A dedication, a history or a portrait' },
      ],
      note: <>Wood backing is priced on each plaque.</>,
      more: <SizeLinksFold title="Every stainless steel size and finish" offers={merchantOffers.filter(offer => STAINLESS.includes(offer.preset.material as Finish) && !offer.preset.wood)} />,
    },
    sampleSlug: 'a5-brushed-steel-personalised-plaque',
    // Page-1 improvements (owner msg 10173, 5 Nov 2026): "stainless steel plaques" 13th. The wording ideas are the ones
    // live on this page before the template (components/CategoryPages.tsx).
    wording: {
      title: 'Stainless steel plaque wording ideas.',
      intro: 'Start with the most important line, then add the rest beneath it.',
      inscriptions: [
        { title: 'A house name', lines: ['The Old Dairy'] },
        { title: 'A bench', lines: ['In loving memory of', 'Tom & Betty Harris', 'Tom 1932 – 2016 · Betty 1935 – 2021', 'Together again'] },
        { title: 'A pet', lines: ['In loving memory of', 'Skye', '2010 – 2024', 'Our faithful friend'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    guides: [{
      // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026): "stainless steel plaques" 12.6; directly above the wording ideas.
      key: 'engraved',
      title: 'Engraved stainless steel plaques, made to order.',
      beforeWording: true,
      paragraphs: ['Your wording is etched into the steel and filled with paint, so the lettering sits in the plate rather than on top of it. Choose brushed stainless steel for a satin finish with a fine grain that suits benches and public spaces, or polished for a bright, mirror-like face. We make stainless steel plaques for memorials, benches, house names, allotments, clinics and business doors. For a logo, send it to us on WhatsApp before ordering and we’ll tell you whether it can be engraved and how it would look on your proof.'],
    }, {
      key: 'uses',
      title: 'What stainless steel plaques are used for.',
      intro: 'It keeps its silver colour outdoors, so it suits plaques that face the weather.',
      items: [
        { title: 'Bench plaques', href: '/bench-plaques', copy: `A name, dates and a line on the top rail, from ${priceOf(plate(150, 50, STAINLESS))} for 150 × 50 mm.` },
        { title: 'Garden memorial plaques', href: '/garden-plaques', copy: 'A memorial or a dedication on a wall, fence, post or stone.' },
        { title: 'Memorial tree plaques', href: '/tree-memorial-plaques', copy: 'On a light solid wood board and ground stake beside the tree, never fixed to it.' },
        { title: 'House name plaques', href: '/house-name-plaques', copy: 'A house name, or a name and number, by the door or gate.' },
        { title: 'Business name plates', copy: <>A company or practice name by the entrance. Prefer brass? See <a href="/professional-brass-plaques">practice plaques</a>.</> },
        { title: 'Opening plaques', href: '/opening-plaques', copy: 'Who opened the building and when, usually on A4.' },
        { title: 'By the sea', copy: 'Near the sea or somewhere very exposed? Send us a photo first and we’ll tell you honestly which finish suits it.' },
      ],
    }],
    moreTitle: 'More about stainless steel plaques',
    related: related(<>Compare with <a href="/brass-plaques">brass plaques</a>, or see <a href="/memorial-plaques">memorial plaques</a>, <a href="/bench-plaques">bench plaques</a> and <a href="/opening-plaques">opening plaques</a>.</>),
    closing: {
      title: 'Brushed or polished?',
      copy: 'Send a photo of the spot and your words on WhatsApp: we’ll suggest a size and finish and send a free proof.',
    },
  };
}

const openingCards: TemplateCard[] = [
  { width: 297, height: 210, name: 'A4', fits: 'Who opened it, and when', lead: 'brushed-stainless', badge: 'The usual size' },
  { width: 297, height: 210, name: 'A4', board: true, fits: 'On light or dark wood', lead: 'polished-brass', leadTone: 'light' },
  { width: 300, height: 200, fits: 'Long names, a wider plate', lead: 'polished-stainless' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'A room name, on wood', lead: 'aged-brass', leadTone: 'light' },
  { width: 400, height: 300, board: true, fits: 'A building, on a large board', lead: 'brushed-stainless', leadTone: 'dark' },
  { width: 200, height: 200, shape: 'circle', fits: 'A building’s name and year', lead: 'brushed-stainless' },
];

function openingPage(): TemplateConfig {
  return {
    prefix: 'opening',
    title: 'Opening plaques for buildings and official openings',
    intro: <>Brass or stainless steel for a new building, a room or an anniversary, with a proof to share before you pay.</>,
    cards: openingCards,
    chips: [...metalChips, boardChip],
    faqTitle: 'Opening plaque questions.',
    afterQuestions: (cards, subject) => <OccasionPlanner id="opening-date" cards={cards} subject={subject} />,
    sizes: {
      title: 'Sizes, drawn to scale.',
      intro: 'A4 gives a heading, the opening person and the date room to breathe.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A room or a short dedication' },
        { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A wider layout for long names' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'The usual size for an opening' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A building, or a list of supporters' },
      ],
      tableSizes: [
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A room or a short dedication' },
        { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A wider layout for long names' },
        { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'The usual size for an opening' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A building, or a list of supporters' },
      ],
      note: <>Light or dark solid wood backing is priced on each plaque.</>,
    },
    sampleSlug: 'brushed-stainless-297x210-rect-plaque',
    steps: [
      ['Add your words', 'Send the names, titles and date, or design online.'],
      ['Check your proof', 'Share it with colleagues and agree one final version.'],
      ['Approve, then we make it', 'Check your deadline with us before ordering.'],
    ],
    proofExtra: (
      <div className="cat-tpl-org">
        <h3>For schools, councils and companies</h3>
        <p>Share the PDF proof with colleagues and agree one version before anyone pays. Payment is by card when you order, with no VAT to add: we’re not VAT registered. Another way to pay, or several plaques for one building? Ask us on WhatsApp first.</p>
      </div>
    ),
    wording: {
      title: 'Opening plaque wording ideas.',
      intro: 'Check names, titles (such as Cllr, MP or OBE), spellings and the date with everyone before you approve.',
      inscriptions: [
        { title: 'A building opening', lines: ['Riverside Community Centre', 'officially opened by', '[Name and title]', 'on [Day Month Year]'] },
        { title: 'A new room', lines: ['The Arthur Lee Room', 'Opened on 9 September 2024'] },
        { title: 'A club', lines: ['The Clubhouse', 'was officially opened by', 'Mark Dawson', 'on 7 September 2024'] },
        // Page-1 improvements (owner msg 10173, 5 Nov 2026): three more, the first two live on the earlier opening and
        // brass pages (components/CategoryPages.tsx).
        { title: 'Recognising support', lines: ['The Reading Garden', 'created with the generous', 'support of [Supporter]', 'Opened [Day Month Year]'] },
        { title: 'With a title', lines: ['Officially opened by', 'Jean Harper MBE', 'on 12 April 2025'] },
        { title: 'An anniversary', lines: ['Riverside Community Centre', 'Celebrating 50 years', '1975 – 2025'] },
      ],
      link: { href: '/contact', label: 'Discuss a deadline, logo or crest' },
    },
    // Page-1 SEO (owner msgs 10401-10408, 6 Nov 2026): "opening plaques" 11.4, "commemorative plaques"; directly above the
    // wording ideas. The days are the catalogue's standard production time.
    guides: [{
      key: 'commemorative',
      title: 'Commemorative and official opening plaques.',
      beforeWording: true,
      paragraphs: [
        'An opening plaque records who officially opened a building, room, garden or clubhouse, and when. Schools, councils, churches, sports clubs and companies use them for new buildings, extensions and anniversaries. Most read along the lines of “This building was officially opened by [name and title] on [date]”, sometimes with a crest or logo above.',
        `Download the free proof as a PDF and share it with colleagues, so everyone can agree the exact names, titles and date before one person approves it. Most plaques are made in ${STANDARD_DAYS} working days from approval and payment, plus delivery. Contact us before ordering if you have a ceremony date to meet.`,
      ],
    }],
    moreTitle: 'More about opening plaques',
    related: <>{related(<>See <a href="/brass-plaques">brass plaques</a> and <a href="/stainless-steel-plaques">stainless steel plaques</a>, or <a href="/how-it-works">how the free proof works</a> before your ceremony.</>)}{occasionLinks(<><a href="/donor-recognition-plaques">Donor and recognition plaques</a> · <a href="/church-plaques">Church plaques</a></>)}</>,
    closing: {
      title: 'Got a date to meet?',
      copy: 'Send your words and the date on WhatsApp: we’ll send a free proof and tell you honestly whether we can make it in time.',
    },
  };
}

const customCards: TemplateCard[] = [
  { width: 250, height: 150, shape: 'oval', fits: 'A house name or a memorial', group: 'shape', lead: 'brushed-brass' },
  { width: 200, height: 200, shape: 'circle', fits: 'A house or building name', group: 'shape', lead: 'aged-brass' },
  { width: 400, height: 300, fits: 'A family memorial or history', group: 'large', lead: 'orbital-brass-matt-lacquer' },
  { width: 300, height: 200, fits: 'A sign or a longer tribute', group: 'large', lead: 'brushed-stainless' },
  { width: 210, height: 297, name: 'A4', fits: 'An upright plaque', group: 'large', lead: 'polished-brass' },
  { width: 400, height: 300, board: true, fits: 'A large plaque on a board', group: 'large', lead: 'polished-brass', leadTone: 'dark' },
];

function customPage(): TemplateConfig {
  const oval = plate(250, 150, ALL, 'oval');
  return {
    prefix: 'custom',
    title: 'Custom plaques',
    tagline: 'Ovals, circles, larger sizes and your own ideas.',
    intro: <>Ovals, circles and larger plates, priced below. Another size up to {MAX_PLAQUE_DIMENSION_MM} mm, or another shape? <a href="#custom-quote">Get a free quote</a>.</>,
    cards: customCards,
    from: { value: oval.price, slug: oval.slug },
    chips: [
      ...metalChips,
      { key: 'shape', label: 'Oval and round', group: 'shape' },
      { key: 'large', label: 'Large', group: 'large' },
      boardChip,
    ],
    gridEnd: (
      <div className="cat-tpl-ask-body" id="custom-quote">
        <h3>Another size or shape?</h3>
        <p>Any size from {MIN_PLAQUE_DIMENSION_MM} to {MAX_PLAQUE_DIMENSION_MM} mm, another shape or your own artwork: send the measurements and a photo of the spot, and we’ll send a free proof with the price.</p>
        <div className="cat-tpl-ask-actions">
          <ContactLink channel="whatsapp" placement="page" subject="a custom plaque" className="shop-button shop-hero-choice-whatsapp"><WhatsAppIcon /> Send measurements</ContactLink>
          <a className="shop-text-link" href="/design-request">Or use our design form</a>
        </div>
      </div>
    ),
    faqTitle: 'Custom plaque questions.',
    sizes: {
      title: 'Shapes and sizes, drawn to scale.',
      intro: 'Ovals and circles suit house names and short dedications; larger plates suit histories and honours boards.',
      scale: 'wall',
      reference: 'brick',
      sizes: [
        { label: '250 × 150 mm oval', widthMm: 250, heightMm: 150, fits: 'A house name or a short memorial', shape: 'oval' },
        { label: '200 mm round', widthMm: 200, heightMm: 200, fits: 'A short dedication', shape: 'circle' },
        { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A sign, or a longer tribute' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A history or an honours board' },
      ],
      tableSizes: [
        { label: '250 × 150 mm oval', widthMm: 250, heightMm: 150, fits: 'A house name or a short memorial', shape: 'oval' },
        { label: '200 mm round', widthMm: 200, heightMm: 200, fits: 'A short dedication', shape: 'circle' },
        { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A sign, or a longer tribute' },
        { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A history or an honours board' },
      ],
      note: <>Larger sizes up to {MAX_PLAQUE_DIMENSION_MM} mm, other shapes and supplied artwork: free quote.</>,
    },
    sampleSlug: 'brushed-stainless-250x150-oval-plaque',
    wording: {
      title: 'Custom plaque wording ideas.',
      intro: 'A short line suits an oval or a circle; save longer lists for a larger plate.',
      inscriptions: [
        { title: 'A house name', lines: ['Apple Tree', 'Cottage'] },
        { title: 'A family memorial', lines: ['In loving memory of', 'George & Mary Fenton', 'George 1925 – 2008', 'Mary 1928 – 2019'] },
        { title: 'A school or club', lines: ['The Old School', '1874'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'See over 40 memorial wording ideas' },
    },
    moreTitle: 'More about custom plaques',
    // Page-1 SEO internal link (owner msgs 10401-10408, 6 Nov 2026): "custom brass plaques".
    related: related(<>See <a href="/brass-plaques">custom brass plaques</a>, <a href="/portrait-plaques">portrait plaques</a>, <a href="/ai-plaque-design">AI designs made real</a> and <a href="/plaque-sizes">every standard size and price</a>.</>),
    closing: {
      title: 'Have a size in mind?',
      copy: 'Send the measurements, a photo of the spot and your words on WhatsApp: we’ll send a free proof with the price.',
    },
  };
}

const templateConfigs: Record<string, () => TemplateConfig> = {
  ...occasionTemplateConfigs,
  'memorial-plaques': memorialPage,
  'bench-plaques': benchPage,
  'garden-plaques': gardenPage,
  'tree-memorial-plaques': treePage,
  'brass-plaques': brassPage,
  'stainless-steel-plaques': stainlessPage,
  'opening-plaques': openingPage,
  'custom-plaques': customPage,
};

export const categoryTemplateSlugs = Object.keys(templateConfigs).filter(slug => templatePages[slug]);

export function categoryTemplateFor(product: ProductFamily): TemplateConfig | undefined {
  return templatePages[product.slug] ? templateConfigs[product.slug]?.() : undefined;
}
