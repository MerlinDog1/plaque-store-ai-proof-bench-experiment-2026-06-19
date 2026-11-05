import React from 'react';
import { BRASS, type TemplateConfig, type TemplateCard, type TemplateChip } from './CategoryTemplate';

// Stage 3 uses the live CategoryTemplate, not the rejected 31 October occasion layout.
// Existing catalogue studio examples only. No page-specific customer commission is implied.
const metals: TemplateChip[] = [
  { key: 'all', label: 'All' },
  { key: 'brass', label: 'Brass', finishes: BRASS },
  { key: 'stainless', label: 'Stainless steel', finishes: ['brushed-stainless', 'polished-stainless'] },
];
const board: TemplateChip = { key: 'board', label: 'On a wood board', board: true };
const related = (children: React.ReactNode) => <p className="memorial-material-links cat-related">{children}</p>;
const steelDesign = '/design?plaque=brushed-stainless-150x50-rect-plaque';

const houseCards: TemplateCard[] = [
  { width: 200, height: 150, fits: 'A name on one or two lines', lead: 'polished-brass' },
  { width: 250, height: 150, shape: 'oval', fits: 'A name with curved ends', lead: 'brushed-brass' },
  { width: 200, height: 200, shape: 'circle', fits: 'A name or house number', lead: 'brushed-stainless' },
];
const houseSizes = [
  { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A short name beside a door' },
  { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A name on one or two lines' },
  { label: 'A5 · 148 × 210 mm', widthMm: 148, heightMm: 210, fits: 'A name and a second line' },
  { label: '250 × 150 mm oval', widthMm: 250, heightMm: 150, shape: 'oval' as const, fits: 'A name with curved ends' },
];
function housePage(): TemplateConfig {
  return {
    prefix: 'house', title: 'House name plaques',
    intro: <>Your house name or number, in solid brass or stainless steel. For a door, porch, gate or wall.</>,
    cards: houseCards, chips: metals, outdoors: true,
    faqTitle: 'House name plaque questions.',
    sizes: {
      title: 'Sizes, drawn to scale.', intro: 'Measure the flat fixing area and try a paper outline in position.',
      scale: 'wall', reference: 'brick', sizes: houseSizes, tableSizes: [...houseSizes,
        { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A longer name, with optional wood backing' },
        { label: '200 mm round', widthMm: 200, heightMm: 200, shape: 'circle', fits: 'A name or house number' },
      ],
      note: <>Choose metal without backing for an exposed spot. Light solid wood or dark solid wood backing suits a sheltered porch.</>,
    },
    sampleSlug: 'polished-brass-200x150-rect-plaque', designHref: steelDesign,
    wording: {
      title: 'House name wording ideas.',
      inscriptions: [
        { title: 'Just the name', lines: ['ROSE COTTAGE'] },
        { title: 'Name and number', lines: ['WILLOW HOUSE', '24'] },
        { title: 'A longer name', lines: ['THE OLD', 'SCHOOLHOUSE'] },
      ],
      link: { href: '/plaque-sizes', label: 'See every size and price' },
    },
    moreTitle: 'More about house name plaques',
    related: related(<>Compare <a href="/brass-plaques">brass finishes</a> and <a href="/stainless-steel-plaques">stainless steel</a>. Another shape? See <a href="/custom-plaques">custom plaques</a>.</>),
    closing: { title: 'Not sure which size?', copy: 'Send your house name and a photo or measurements of the space on WhatsApp: we’ll help with the size and send a free proof.' },
  };
}

const donorCards: TemplateCard[] = [
  { width: 300, height: 200, fits: 'A project dedication', lead: 'orbital-brass-matt-lacquer' },
  { width: 297, height: 210, name: 'A4', fits: 'A community acknowledgement', lead: 'brushed-stainless' },
  { width: 200, height: 150, board: true, fits: 'A named room or dedication', lead: 'aged-brass', leadTone: 'light' },
  { width: 210, height: 297, name: 'A4', board: true, fits: 'Several lines, upright', lead: 'orbital-brass-matt-lacquer', leadTone: 'dark' },
  { width: 148, height: 210, name: 'A5', board: true, fits: 'A short acknowledgement', lead: 'orbital-brass-matt-lacquer', leadTone: 'light' },
  { width: 400, height: 300, board: true, fits: 'Several supporters’ names', lead: 'polished-brass', leadTone: 'dark' },
];
const donorSizes = [
  { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'One supporter’s name' },
  { label: 'A5 · 148 × 210 mm', widthMm: 148, heightMm: 210, fits: 'A donor and a short thank-you' },
  { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A project dedication' },
  { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'Several names or a longer dedication' },
];
function donorPage(): TemplateConfig {
  return {
    prefix: 'donor', title: 'Donor & recognition plaques',
    intro: <>Brass and stainless steel plaques for donors, sponsors and shared dedications.</>,
    cards: donorCards, chips: [...metals, board],
    faqTitle: 'Donor plaque questions.',
    sizes: { title: 'Room for every name.', intro: 'Keep a short thank-you on a small plate; give a list of supporters more space.', scale: 'wall', reference: 'brick', sizes: donorSizes, tableSizes: [...donorSizes,
      { label: '225 × 75 mm', widthMm: 225, heightMm: 75, fits: 'A name and a short thank-you' },
      { label: '300 × 200 mm', widthMm: 300, heightMm: 200, fits: 'A project dedication' },
    ] },
    sampleSlug: 'brushed-brass-300x200-rect-light-wood-plaque', designHref: steelDesign,
    sampleNote: '300 × 200 mm brass on light solid wood, shown with example opening wording.',
    steps: [
      ['Add the names', 'Send the agreed acknowledgement, or design online.'],
      ['Share the free PDF proof', 'Check it with the organiser and everyone named.'],
      ['Agree one version', 'Approve the wording and pay, then we make it.'],
    ],
    wording: {
      title: 'Donor plaque wording ideas.', intro: 'Use the names and acknowledgement agreed with your supporters.',
      inscriptions: [
        { title: 'An individual donor', lines: ['With thanks to', 'THE MORGAN FAMILY'] },
        { title: 'A community project', lines: ['This garden was made possible', 'by the generosity of', 'our friends and supporters', '2026'] },
        { title: 'A sponsor', lines: ['Supported by', 'WILLOW & CO', 'With our grateful thanks'] },
      ],
      link: { href: '/opening-plaques', label: 'Planning an opening or dedication?' },
    },
    moreTitle: 'More about donor plaques',
    related: related(<>See <a href="/opening-plaques">opening plaques</a>, <a href="/church-plaques">church plaques</a>, <a href="/garden-plaques">garden dedications</a> and <a href="/brass-plaques">brass finishes</a>.</>),
    closing: { title: 'Several plaques to plan?', copy: 'Send the list of names, sizes and a photo of the wall or board on WhatsApp. We’ll discuss the layout and price before you order.' },
  };
}

const churchCards: TemplateCard[] = [
  { width: 150, height: 50, fits: 'A short pew inscription', lead: 'polished-brass' },
  { width: 225, height: 65, fits: 'A name and a short verse', lead: 'polished-stainless' },
  { width: 200, height: 150, board: true, fits: 'A dedication on wood', lead: 'polished-brass', leadTone: 'light' },
  { width: 148, height: 210, name: 'A5', board: true, fits: 'An upright church memorial', lead: 'polished-brass', leadTone: 'light' },
  { width: 250, height: 150, shape: 'oval', fits: 'A memorial with curved ends', lead: 'polished-brass' },
  { width: 210, height: 297, name: 'A4', fits: 'Several lines, upright', lead: 'brushed-stainless' },
];
const churchSizes = [
  { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A short pew inscription' },
  { label: '225 × 65 mm', widthMm: 225, heightMm: 65, fits: 'A name and a short verse' },
  { label: 'A5 · 148 × 210 mm', widthMm: 148, heightMm: 210, fits: 'An agreed gift or memorial' },
  { label: 'A4 · 210 × 297 mm', widthMm: 210, heightMm: 297, fits: 'Longer wording, upright' },
];
function churchPage(): TemplateConfig {
  return {
    prefix: 'church', title: 'Church plaques',
    intro: <>Brass or stainless steel pew plates and dedications. Agree the location and wording with your church first.</>,
    cards: churchCards, chips: [...metals, board],
    faqTitle: 'Church plaque questions.',
    sizes: { title: 'Sizes, drawn to scale.', intro: 'Measure the flat area and check the size your church has agreed.', scale: 'wall', reference: 'brick', sizes: churchSizes, tableSizes: [...churchSizes,
      { label: '225 × 75 mm', widthMm: 225, heightMm: 75, fits: 'A name and a short dedication' },
      { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A dedication, with optional wood backing' },
      { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A dedication, with optional wood backing' },
      { label: '250 × 150 mm oval', widthMm: 250, heightMm: 150, shape: 'oval', fits: 'A memorial with curved ends' },
      { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'Longer wording, landscape' },
    ] },
    sampleSlug: 'polished-brass-150x50-rect-plaque', designHref: steelDesign,
    steps: [
      ['Add the agreed words', 'Online, or send them on WhatsApp.'],
      ['Share the free PDF proof', 'Let the church check the size, words and fixings.'],
      ['Approve, then we make it', 'Settle any changes and permissions before ordering.'],
    ],
    wording: {
      title: 'Church plaque wording ideas.', intro: 'Starting points only: use the wording your church has agreed.',
      inscriptions: [
        { title: 'In memory', lines: ['In loving memory of', 'MARGARET HUGHES', '1931–2024'] },
        { title: 'A pew given', lines: ['This pew was given by', 'the Taylor family', 'in thanksgiving'] },
        { title: 'A dedication', lines: ['To the glory of God', 'and in grateful memory of', 'JOHN MORGAN'] },
      ],
      link: { href: '/memorial-plaque-wording', label: 'More memorial wording ideas' },
    },
    moreTitle: 'More about church plaques',
    related: related(<>See <a href="/memorial-plaques">memorial plaques</a>, <a href="/bench-plaques">small bench plates</a>, <a href="/donor-recognition-plaques">donor acknowledgements</a> and <a href="/opening-plaques">opening plaques</a>.</>),
    closing: { title: 'Have the agreed wording?', copy: 'Send it with the permitted size and fixing details on WhatsApp. We’ll prepare a free proof to share with your church.' },
  };
}

const practiceCards: TemplateCard[] = [
  { width: 200, height: 150, board: true, fits: 'A name plate on wood', lead: 'orbital-brass-matt-lacquer', leadTone: 'dark' },
  { width: 210, height: 148, name: 'A5', board: true, fits: 'For an indoor reception', lead: 'aged-brass', leadTone: 'light' },
  { width: 297, height: 210, name: 'A4', board: true, fits: 'A name with several lines', lead: 'polished-brass', leadTone: 'light' },
  { width: 400, height: 300, board: true, fits: 'A larger reception name plate', lead: 'polished-brass', leadTone: 'dark' },
];
const practiceSizes = [
  { label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name on an office door' },
  { label: '200 × 150 mm', widthMm: 200, heightMm: 150, fits: 'A practice name and short line' },
  { label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'Names and appointment details' },
  { label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A practice name with several lines' },
];
function practicePage(): TemplateConfig {
  return {
    prefix: 'practice', title: 'Brass practice plaques',
    intro: <>Engraved brass name plates for solicitors, dentists, vets, architects, accountants and other practices.</>,
    cards: practiceCards, finishes: BRASS,
    chips: [
      { key: 'all', label: 'All' },
      { key: 'polished', label: 'Polished', finishes: ['polished-brass'] },
      { key: 'brushed', label: 'Brushed', finishes: ['brushed-brass'] },
      { key: 'orbital', label: 'Orbital', finishes: ['orbital-brass-matt-lacquer'] },
      { key: 'aged', label: 'Aged', finishes: ['aged-brass'] }, board,
    ],
    faqTitle: 'Practice plaque questions.', finishesFirst: true, outdoors: true,
    finishesTitle: 'The four brass finishes, side by side.',
    finishesIntro: 'Solid brass, laser cut to size, etched and infilled by hand.',
    sizes: { title: 'Sizes, drawn to scale.', intro: 'Give the practice name most space; keep the details underneath short.', scale: 'wall', reference: 'brick', sizes: practiceSizes, tableSizes: [...practiceSizes,
      { label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A larger name plate, with optional wood backing' },
    ] },
    sampleSlug: 'orbital-brass-matt-lacquer-200x150-rect-dark-wood-plaque',
    sampleNote: '200 × 150 mm orbital brass on dark solid wood, with example studio-opening wording.',
    designHref: '/design?plaque=brushed-brass-150x50-rect-plaque',
    wording: {
      title: 'Practice name plate ideas.', intro: 'Replace these examples with your approved name, titles and details.',
      inscriptions: [
        { title: 'An entrance', lines: ['[PRACTICE NAME]', '[Professional description]'] },
        { title: 'Appointments', lines: ['[PRACTICE NAME]', 'By appointment', '[Telephone number]'] },
        { title: 'An office door', lines: ['[NAME]', '[Approved title]'] },
      ],
      link: { href: '/contact', label: 'Discuss a logo or your wording' },
    },
    moreTitle: 'More about practice plaques',
    related: related(<>Compare <a href="/brass-plaques">all brass plaques</a> and <a href="/stainless-steel-plaques">stainless steel</a>, or see <a href="/house-name-plaques">house name plaques</a> and <a href="/plaque-sizes">every size and price</a>.</>),
    closing: { title: 'Plan your practice plate.', copy: 'Send the approved name, wording and a photo of the entrance on WhatsApp. We’ll help with the size and finish and send a free proof.' },
  };
}

export const occasionTemplateConfigs: Record<string, () => TemplateConfig> = {
  'house-name-plaques': housePage,
  'donor-recognition-plaques': donorPage,
  'church-plaques': churchPage,
  'professional-brass-plaques': practicePage,
};
