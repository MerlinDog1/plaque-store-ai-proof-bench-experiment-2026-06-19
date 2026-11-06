import { categoryFilmFor } from '../services/categoryFilms.mjs';
// 1 Nov 2026: owner requests light/dark solid wood, never a species; assertions follow the customer wording.
// The "products first" category template pages (components/CategoryTemplate.tsx, 1 Nov 2026, owner msg 8384): memorial
// and bench (stage 1), garden, tree, brass, stainless steel, opening and custom (stage 2), checked in the final HTML
// (dist, or DIST=<folder>):
// - title, meta description, H1 and canonical are the live ones (as production's source, ec24ba1, builds them), except
//   the page-1 improvements (owner msg 10173, 5 Nov 2026): the garden H1, and the garden, tree, brass, stainless steel
//   and opening summaries, which quote the page's own from-price (read here from the page's facts line);
// - those pages' new sections are there, and every link in them reaches a built page;
// - the FAQPage schema is exactly the six questions and answers shown on the page;
// - one card per size, each leading with a studio photo of the plaque it links to, every card and finish link reaching
//   a built product page (on the tree page, the designer on that plate, on the light solid wood board and ground stake), and the
//   finish links present as plain links for visitors without JavaScript;
// - each card's lead-time line names the slowest catalogue production days (offer.productionDays) of the plaques
//   behind it (its data-offers); a card without one has only plaques made in the standard 5 working days; the facts
//   line gives the page's usual days (5; 10 on tree and practice grids, where every plaque is on a board);
// - the opening page's date planner states the catalogue days of its plaques, and its date maths
//   (services/occasionPlanner.ts) never names an approval day that the catalogue's days and delivery can't meet,
//   checked against this script's own calendar for every date it accepts;
// - the page's own film leads it, as on the homepage (owner msg 10240, 6 Nov 2026): under two hero buttons for phones
//   and beside the copy for computers, playing by itself after the page loads (poster preloaded, no source in the HTML),
//   nothing after the proof; no in-place or scene photos; every image and swatch exists;
// - the facts line, the sample proof PDF and the page's contextual links are present.
// Usage: node scripts/check-category-template.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { studioPhotos } from '../services/studioPhotos.mjs';

const root = path.resolve(process.env.DIST || 'dist');
const site = 'https://instaplaque.co.uk';
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const memorialFaqs = ['How much does a memorial plaque cost?', 'What should I write on a memorial plaque?', 'Can brass and stainless steel memorial plaques go outside?',
  'Can I put a memorial plaque on a grave or cemetery wall?', 'Can my family check the wording before I pay?', 'How long does a memorial plaque take to make?'];
const benchFaqs = ['What size plaque will fit my bench?', 'How much wording fits on a bench plaque?', 'Can I match the fixing holes of an old plaque?',
  'What fixings come with a bench plaque?', 'Do I need permission for a park or council bench?', 'How long does a bench plaque take?'];
// Contextual links every template page has: the film's watch page, the closing strip's portrait link, the finishes row.
const common = ['/video', '/portrait-plaques', '/materials'];
const pages = [
  { slug: 'memorial-plaques', cards: 10, faqs: memorialFaqs, h1: 'Personalised memorial plaques',
    title: 'Memorial Plaques UK | Brass & Stainless Steel | InstaPlaque',
    description: 'Personalised memorial plaques in brass or stainless steel for walls, gardens and graves. Check your wording with a free online proof. UK delivery included.',
    links: ['/bench-plaques', '/garden-plaques', '/tree-memorial-plaques', '/memorial-plaque-wording', '/plaque-sizes', ...common] },
  { slug: 'bench-plaques', cards: 6, faqs: benchFaqs, h1: 'Personalised bench plaques',
    title: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    description: 'Order custom bench plaques in brass or stainless steel. Build a proof online, check the inscription and see live pricing before payment.',
    links: ['/memorial-plaques', '/garden-plaques', '/tree-memorial-plaques', '/memorial-plaque-wording', ...common] },
  { slug: 'garden-plaques', cards: 8, h1: "Garden memorial plaques",
    title: "Garden Memorial Plaques UK | Free Online Proof | InstaPlaque",
    description: from => `Garden memorial plaques ${from} in brass or stainless steel, for a garden of remembrance, a wall, a post or a dedication sign. Free proof first.`,
    guides: { 'garden-remembrance': 'Memorial gardens and gardens of remembrance.', 'garden-dedications': 'Garden dedication signs.' },
    faqs: ["Can a garden plaque stay outside all year?", "Which metal is best for a garden?", "What size should a garden plaque be?", "How do I fix it to a wall, fence or stone?", "Can a garden plaque go near the sea?", "How do I look after a garden plaque?"],
    links: [...["/tree-memorial-plaques", "/bench-plaques", "/memorial-plaques", "/memorial-plaque-wording", "/opening-plaques", "/plaque-sizes", "/donor-recognition-plaques"], ...common] },
  { slug: 'tree-memorial-plaques', cards: 6, stake: true, h1: "Memorial tree plaques",
    title: "Memorial Tree Plaques UK | Engraved Tree Dedication Plaques | InstaPlaque",
    description: from => `Memorial tree plaques ${from} on a light solid wood board and black steel ground stake beside the tree. Brass or stainless steel, free proof first.`,
    faqs: ["Can I fix a plaque to a tree?", "Can I put one in a churchyard, park or memorial woodland?", "What size should a memorial tree plaque be?", "What should a tree memorial plaque say?", "Will the plaque last outdoors?", "Can I have just the plate, for a post or fence?"],
    links: [...["/garden-plaques", "/memorial-plaques", "/memorial-plaque-wording"], ...common] },
  { slug: 'brass-plaques', cards: 8, h1: "Personalised brass plaques",
    title: "Brass Plaques UK | Custom Engraved Brass Plaques",
    description: from => `Brass plaques ${from} in polished, brushed, orbital or aged brass, for memorials, benches, house names and openings. Free proof, UK delivery included.`,
    guides: { 'brass-wording': 'Brass plaque wording ideas.', 'brass-uses': 'What brass plaques are used for.', 'brass-aged': 'Aged brass plaques.' },
    faqs: ["Which brass finish should I choose?", "Will brass tarnish outside?", "How long does a brass plaque take?", "Can you match an existing brass plaque?", "Can you add a logo or crest?", "Do you charge VAT?"],
    links: [...["/stainless-steel-plaques", "/memorial-plaques", "/bench-plaques", "/opening-plaques", "/memorial-plaque-wording", "/house-name-plaques", "/professional-brass-plaques", "/church-plaques", "/donor-recognition-plaques"], ...common] },
  { slug: 'stainless-steel-plaques', cards: 8, h1: "Personalised stainless steel plaques",
    title: "Stainless Steel Plaques UK | Outdoor Metal Plaques Made to Order",
    description: from => `Stainless steel plaques ${from}, brushed or polished, for benches, gardens, house names and business signs. Free proof first, UK delivery included.`,
    guides: { 'stainless-wording': 'Stainless steel plaque wording ideas.', 'stainless-uses': 'What stainless steel plaques are used for.' },
    faqs: ["Will a stainless steel plaque last outdoors?", "Can it go near the sea?", "Brushed or polished stainless steel?", "How do I look after a stainless steel plaque?", "Can you add a logo?", "How long does a stainless steel plaque take?"],
    links: [...["/brass-plaques", "/memorial-plaques", "/bench-plaques", "/opening-plaques", "/tree-memorial-plaques", "/garden-plaques", "/house-name-plaques", "/professional-brass-plaques"], ...common] },
  { slug: 'opening-plaques', cards: 6, planner: true, h1: "Opening plaques",
    title: "Opening Plaques UK | Custom Building Opening Plaques",
    description: from => `Opening plaques ${from} in brass or stainless steel, for a new building, room or anniversary. Share a free proof with colleagues before you pay.`,
    wordingIdeas: 6,
    faqs: ["Can colleagues check the opening plaque before we order?", "Can you meet our opening ceremony date?", "Can the plaque include a school crest or organisation logo?", "Can we pay by invoice or purchase order?", "Can an opening plaque go outdoors?", "What fixings come with an opening plaque?"],
    links: [...["/brass-plaques", "/stainless-steel-plaques", "/how-it-works", "/contact"], ...common] },
  { slug: 'custom-plaques', cards: 6, h1: "Custom plaques",
    title: "Custom Plaques UK | Bespoke Oval, Circular & Made-to-Measure Plaques",
    description: "Start a custom plaque proof for bespoke sizes, oval plaques, circular plaques and made-to-measure brass or stainless steel plaques.",
    faqs: ["What sizes and shapes can you make?", "How do I get a price for another size?", "Can bespoke plaques still use instant proofing?", "Can you make a plaque from my own design?", "How long does a custom plaque take?", "Can I see my plaque before I pay?"],
    links: [...["/ai-plaque-design", "/plaque-sizes", "/memorial-plaque-wording", "/design-request"], ...common] },
  { slug: 'house-name-plaques', cards: 3, h1: 'House name plaques',
    title: 'House Name Plaques | Engraved Brass & Steel | InstaPlaque',
    description: 'Create a simple engraved house name plaque in brass or stainless steel. Compare sizes, finishes and prices, with a free proof and UK delivery included.',
    faqs: ['Can I put my house name and number on one plaque?', 'Can a house name plaque go outside?', 'Do I need a wood backing?', 'What fixings come with a house name plaque?', 'Can I check the house name before I pay?', 'How long does a house name plaque take?'],
    design: 'brushed-stainless-150x50-rect-plaque',
    links: ['/brass-plaques', '/stainless-steel-plaques', '/custom-plaques', '/plaque-sizes', ...common] },
  { slug: 'donor-recognition-plaques', cards: 6, h1: 'Donor & recognition plaques',
    title: 'Donor & Recognition Plaques | Brass Sponsor Plaques | InstaPlaque',
    description: 'Thank donors and sponsors with an engraved brass or stainless steel plaque. Sizes for individual donor wall plates and dedications, with a free proof first.',
    faqs: ['Do you supply complete donor walls?', 'Can several donors be named on one plaque?', 'Can you match an existing donor plaque?', 'Can a plaque include a sponsor’s logo?', 'Can our team approve the wording together?', 'How long does a donor plaque take?'],
    design: 'brushed-stainless-150x50-rect-plaque',
    links: ['/opening-plaques', '/church-plaques', '/garden-plaques', '/brass-plaques', ...common] },
  { slug: 'church-plaques', cards: 6, h1: 'Church plaques',
    title: 'Church Pew & Dedication Plaques | Engraved Metal | InstaPlaque',
    description: 'Plan a church pew, memorial or dedication plaque in brass or steel. Compare sizes and wording ideas, check church permission, then approve your free proof.',
    faqs: ['Do I need church permission before ordering?', 'What size should a pew plaque be?', 'Can I share the proof with the parish?', 'What fixings come with a church plaque?', 'Which material should I choose?', 'How long does a church plaque take?'],
    design: 'brushed-stainless-150x50-rect-plaque',
    links: ['/memorial-plaques', '/bench-plaques', '/donor-recognition-plaques', '/opening-plaques', '/memorial-plaque-wording', ...common] },
  { slug: 'professional-brass-plaques', cards: 4, usual: 10, h1: 'Brass practice plaques',
    title: 'Brass Plaques for Professional Practices | InstaPlaque',
    description: 'Brass name plates for solicitors, dentists, vets, architects and accountants. Compare sizes and finishes, add your wording and approve a free proof before paying.',
    faqs: ['What size suits a practice name plate?', 'Which brass finish should I choose?', 'Can you include a practice logo?', 'Can I include qualifications or a registration number?', 'Does a plaque meet a regulator’s display requirements?', 'How long does a brass practice plaque take?'],
    design: 'brushed-brass-150x50-rect-plaque',
    links: ['/brass-plaques', '/stainless-steel-plaques', '/house-name-plaques', '/plaque-sizes', '/contact', ...common] },
];
// The catalogue's standard production time; longer: aged brass 7, wood-backed 10 (up to A4) or 15 (larger).
const STANDARD_DAYS = 5;
assert.equal(Math.min(...merchantOffers.map(offer => offer.productionDays)), STANDARD_DAYS, 'catalogue: most plaques are made in 5 working days');
const sameSize = (a, b) => a.preset.width === b.preset.width && a.preset.height === b.preset.height && a.preset.shape === b.preset.shape;
let plannerDays = null;
const compact = text => text.replace(/\s+/g, ' ').trim();
const built = href => existsSync(path.join(root, decodeURI(href.replace(/[?#].*$/, '')).replace(/^\//, ''), 'index.html'))
  || existsSync(path.join(root, decodeURI(href.replace(/[?#].*$/, ''))));
const sceneImage = /\/site-images\/(category|memorial|in-place|photos-in-place)\/|merchant-steel-a5|merchant-brass-bench|\/site-images\/home-(gallery|carousel|route)/;

// The pictured inscription must fit the page, not merely the right dimensions/finish. Read the same
// catalogue wording data that describes each existing studio image; do not infer intent from a filename.
const exampleModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../services/catalogueExamples.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, exampleModule);
const { catalogueExamples } = exampleModule.exports;
const leadUses = {
  'house-name-plaques': ['a house or building name'],
  'donor-recognition-plaques': ['a dedication plaque', 'an opening plaque'],
  // Until practice-specific examples exist, the reviewed named rooms/studio/library are the permitted fallback.
  'professional-brass-plaques': ['an opening plaque'],
  'church-plaques': ['a memorial bench dedication', 'a memorial plaque', 'a church dedication'],
};
function checkLeadWording(pageSlug, productSlug) {
  const example = catalogueExamples[productSlug];
  const label = `${pageSlug}: lead wording for ${productSlug}`;
  assert(example?.lines?.length && example.use, `${label}: catalogue example required`);
  const words = compact(example.lines.join(' '));
  if (pageSlug === 'church-plaques') {
    assert(!/pet|opening/i.test(example.use) && !/\b(opened|opening|unveiled|planted)\b/i.test(words),
      `${label}: no pet memorial, planting or opening inscription (${words})`);
  } else {
    assert(!/memorial|pet/i.test(example.use) && !/\bin (?:loving |grateful )?memory\b|\bplanted\b/i.test(words),
      `${label}: no person/pet memorial, in-memory or planted inscription (${words})`);
  }
  assert(leadUses[pageSlug].includes(example.use), `${label}: ${example.use} does not fit this page (${words})`);
  return words;
}
// Regression cases use the actual inappropriate examples from the first preview. These must fail even
// though they are real, priced catalogue products with valid studio photos.
let rejectedLeads = 0;
for (const slug of ['house-name-plaques', 'donor-recognition-plaques', 'professional-brass-plaques']) {
  for (const product of ['brushed-brass-150x50-rect-plaque', 'brushed-brass-148x210-rect-plaque', 'polished-stainless-148x210-rect-plaque']) {
    assert.throws(() => checkLeadWording(slug, product), /lead wording/);
    rejectedLeads++;
  }
}
for (const [slug, product] of [
  ['church-plaques', 'brushed-brass-148x210-rect-plaque'],
  ['church-plaques', 'orbital-brass-matt-lacquer-297x210-rect-plaque'],
  ['house-name-plaques', 'aged-brass-210x148-rect-light-wood-plaque'],
  ['professional-brass-plaques', 'polished-brass-200x150-rect-plaque'],
]) {
  assert.throws(() => checkLeadWording(slug, product), /lead wording/);
  rejectedLeads++;
}
console.log(`PASS occasion lead wording guard: rejects ${rejectedLeads} incompatible catalogue examples.`);

for (const page of pages) {
  const html = await fs.readFile(path.join(root, page.slug, 'index.html'), 'utf8');
  const { document } = new JSDOM(html).window;
  const main = document.querySelector('.cat-tpl');
  assert(main, `${page.slug}: template markup`);
  assert.equal(document.title, page.title, `${page.slug}: title`);
  // The improved summaries quote the facts line's own from-price ("From £58.50" -> "from £58.50").
  const heroFrom = compact(main.querySelector('.cat-hero-buy .shop-product-price')?.textContent || '').replace(/^From /, 'from ');
  const description = typeof page.description === 'function' ? page.description(heroFrom) : page.description;
  assert(typeof page.description !== 'function' || /^from £\d/.test(heroFrom), `${page.slug}: facts line from-price (${heroFrom})`);
  assert.equal(document.querySelector('meta[name="description"]').content, description, `${page.slug}: meta description`);
  assert.equal(document.querySelector('meta[property="og:description"]')?.content, description, `${page.slug}: og:description`);
  assert.equal(document.querySelectorAll('h1').length, 1, `${page.slug}: one H1`);
  assert.equal(compact(document.querySelector('h1').textContent), page.h1, `${page.slug}: H1`);
  assert.equal(document.querySelector('link[rel="canonical"]').href, `${site}/${page.slug}`, `${page.slug}: canonical`);

  // FAQPage schema = the visible questions, in order, word for word.
  const graph = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => JSON.parse(script.textContent)['@graph'] || []);
  if (page.design) {
    assert(!graph.some(node => ['Product', 'Review', 'AggregateRating'].includes(node['@type'])), `${page.slug}: no product offer or invented reviews on a category`);
    const collection = graph.find(node => node['@type'] === 'CollectionPage');
    assert(collection && collection['@id'] === `${site}/${page.slug}#collection` && collection.image.startsWith(`${site}/site-images/studio-photo/`), `${page.slug}: collection schema and catalogue studio image`);
    assert(graph.some(node => node['@type'] === 'BreadcrumbList'), `${page.slug}: breadcrumb schema`);
    const designLinks = [...main.querySelectorAll('.cat-tpl-actions a, .cat-tpl-closing a, .shop-mobile-contact a')].filter(a => a.textContent.trim().startsWith('Design online'));
    assert(designLinks.length >= 2 && designLinks.every(a => a.getAttribute('href') === `/design?plaque=${page.design}`), `${page.slug}: no-JS design links open the matching catalogue preset`);
    assert(!/\b(?:oak|walnut|mahogany|teak)\b|Liam Dullaghan/i.test(main.textContent), `${page.slug}: no wood species or owner's name in customer copy`);
    assert(!/customer review|five.star|5.star rated/i.test(main.textContent), `${page.slug}: no invented rating claims`);
  }
  const faqNodes = graph.filter(node => node['@type'] === 'FAQPage');
  assert.equal(faqNodes.length, 1, `${page.slug}: one FAQPage`);
  const visible = [...main.querySelectorAll('.cat-tpl-faq-list details')].map(details => ({
    question: compact(details.querySelector('summary').childNodes[0].textContent), answer: compact(details.querySelector('p').textContent) }));
  assert.deepEqual(visible.map(item => item.question), page.faqs, `${page.slug}: the page's six questions`);
  assert.deepEqual(faqNodes[0].mainEntity.map(item => ({ question: item.name, answer: compact(item.acceptedAnswer.text) })), visible, `${page.slug}: FAQ schema matches the visible questions`);
  assert(main.querySelector('.cat-tpl-grid-section + .cat-tpl-faq'), `${page.slug}: questions straight after the grid`);

  // Cards: studio photo first, linking to built product pages (tree: the designer on that plate, on the board and
  // stake); finish links for visitors without JavaScript; the lead-time line against the plaques behind the card.
  const cards = [...main.querySelectorAll('.cat-tpl-card')];
  assert.equal(cards.length, page.cards, `${page.slug}: cards`);
  const itemList = graph.find(node => node['@type'] === 'ItemList');
  assert(itemList, `${page.slug}: ItemList of linked plaques`);
  const listed = new Set(itemList.itemListElement.map(item => item.url));
  const pageDays = [];
  for (const card of cards) {
    const name = compact(card.querySelector('.cat-tpl-card-title').textContent).split(',')[0];
    const made = card.getAttribute('data-offers').split(' ').map(slug => offers.get(slug));
    assert(made.length === Number(card.getAttribute('data-options')) && made.every(Boolean), `${page.slug} ${name}: its plaques are catalogue plaques`);
    const href = card.querySelector('a.cat-tpl-card-link').getAttribute('href');
    const image = card.querySelector('.cat-tpl-photo img').getAttribute('src');
    const swatches = [...card.querySelectorAll('a.cat-tpl-swatch')].map(swatch => swatch.getAttribute('href'));
    assert(swatches.length >= 2 && swatches.includes(href), `${page.slug} ${name}: finish links, the card's own among them`);
    if (page.stake) {
      // The designer on the plate, on the light solid wood board and stake; pictured by the plate on its light solid wood board.
      const plateOf = link => {
        const url = new URL(link, site);
        const plate = offers.get(url.searchParams.get('plaque'));
        assert(url.pathname === '/design' && url.searchParams.get('backing') === 'stake' && built('/design') && plate && !plate.preset.wood && built(`/${plate.slug}`),
          `${page.slug} ${name}: ${link} opens the designer on a built plate, on the board and stake`);
        const board = made.find(offer => offer.preset.material === plate.preset.material && sameSize(offer, plate));
        assert(board && board.preset.wood && board.preset.woodTone === 'light', `${page.slug} ${name}: ${plate.slug} is made on its light solid wood board`);
        return { plate, board };
      };
      const { board } = plateOf(href);
      swatches.forEach(plateOf);
      assert(studioPhotos.has(board.slug) && image === `/site-images/studio-photo/${board.slug}-600.webp`, `${page.slug} ${name}: leads with the studio photo of its plate on oak (${image})`);
    } else {
      const link = href.slice(1);
      assert(offers.has(link) && built(href) && made.some(offer => offer.slug === link), `${page.slug}: card link ${href} is one of its built product pages`);
      assert(studioPhotos.has(link) && image === `/site-images/studio-photo/${link}-600.webp`, `${page.slug}: ${href} card leads with its studio photo (${image})`);
      assert(listed.has(`${site}${href}`), `${page.slug}: ${href} in the ItemList`);
      if (leadUses[page.slug]) console.log(`PASS ${page.slug} lead: ${link} — ${checkLeadWording(page.slug, link)}`);
      assert(swatches.every(swatch => made.some(offer => `/${offer.slug}` === swatch) && built(swatch)), `${page.slug}: ${href} card's finish links reach its built product pages`);
    }
    assert(/^from £/.test(compact(card.querySelector('.cat-tpl-amount').textContent)), `${page.slug} ${name}: a from-price`);
    // Lead-time line (owner msg 8437; Cody's review rule): the slowest days of the plaques behind the card, or none
    // when they are all made in the standard days.
    const days = made.map(offer => offer.productionDays);
    const slow = days.filter(value => value > STANDARD_DAYS);
    const line = card.querySelector('.cat-tpl-days');
    const said = line ? compact(line.textContent) : '';
    const numbers = [...said.matchAll(/\d+/g)].map(match => Number(match[0]));
    if (!slow.length) assert(!line, `${page.slug} ${name}: no lead-time line (every plaque ${STANDARD_DAYS} days), yet "${said}"`);
    else assert(/ working days$/.test(said) && Math.max(...numbers) === Math.max(...slow) && Math.min(...numbers) === Math.min(...slow),
      `${page.slug} ${name}: lead-time line "${said}", the plaques behind it take ${[...new Set(days)].join('/')} days`);
    pageDays.push(...days);
  }
  assert(main.querySelector('.cat-tpl-toolbar.is-static .cat-tpl-chips[aria-hidden="true"]'), `${page.slug}: chips hidden until the app runs`);

  // The page's own film leads it, as the homepage's does (owner msg 10240, 6 Nov 2026): two copies in the hero (under
  // the two buttons for phones, beside the copy for computers; CSS shows one). Like the homepage film it plays by itself
  // once the page has loaded, so the HTML has its preloaded poster but no source. Nothing follows the proof any more.
  // Since owner msg 10329 the hero is the homepage's own (components/ShopHero.tsx): the same classes and order.
  assert.equal(main.querySelectorAll('iframe').length, 0, `${page.slug}: no embedded frames`);
  const film = categoryFilmFor(page.slug);
  const films = [...main.querySelectorAll('video')];
  const hero = main.querySelector(':scope > .shop-hero.cat-film-hero');
  const inline = hero?.querySelector(':scope > .shop-hero-copy > .shop-hero-film-inline');
  const side = hero?.querySelector(':scope > .shop-hero-film-side');
  const order = [...(hero?.querySelector(':scope > .shop-hero-copy')?.children || [])].map(el => el.className.split(' ').find(name => name.startsWith('shop-')) || el.tagName.toLowerCase());
  assert.deepEqual(order, ['shop-breadcrumb', 'shop-kicker', 'shop-hero-title', 'shop-hero-tagline', 'shop-intro', 'shop-hero-choices', 'shop-hero-film-inline', 'shop-hero-ai-note', 'shop-hero-price', 'shop-hero-note'],
    `${page.slug}: the homepage's hero, in its order`);
  assert(/£\d/.test(hero.querySelector('.shop-kicker').textContent), `${page.slug}: a from-price in the kicker, as on the homepage`);
  assert.equal(films.length, 2, `${page.slug}: the film twice, for phones and computers`);
  assert(inline && side && films.every(video => [inline, side].includes(video.closest('.cat-film-figure'))), `${page.slug}: both copies of the film in the hero`);
  assert(hero.compareDocumentPosition(main.querySelector('.cat-tpl-grid-section')) & 4, `${page.slug}: the film before the plaques`);
  const choices = inline.previousElementSibling;
  assert(choices?.matches('.shop-hero-choices') && choices.querySelector(':scope > a.shop-button[href^="/design"]')
    && choices.querySelector(':scope > a.shop-hero-choice-whatsapp[data-contact-placement="hero"][href^="https://wa.me"]'), `${page.slug}: two hero buttons straight above the phone film`);
  for (const video of films) {
    assert.equal(video.closest('[data-film-id]')?.getAttribute('data-film-id'), film.id, `${page.slug}: its own film`);
    assert(!video.hasAttribute('src') && !video.hasAttribute('autoplay') && video.getAttribute('preload') === 'none' && video.getAttribute('poster') === film.poster
      && video.hasAttribute('loop') && video.hasAttribute('playsinline'), `${page.slug}: looping film with only its poster in the HTML`);
  }
  for (const figure of [inline, side]) {
    assert.equal(compact(figure.querySelector('figcaption span').textContent), `${film.disclosure} ${film.footnote}`, `${page.slug}: only the short film footnote`);
    assert(figure.querySelector('figcaption a[href="/video"]'), `${page.slug}: watch page link beside the film`);
  }
  assert([...document.querySelectorAll('link[rel="preload"][as="image"]')].some(link => link.getAttribute('href') === film.poster), `${page.slug}: film poster preloaded`);
  assert(!main.querySelector('.cat-tpl-film-section') && !main.querySelector('.cat-tpl-proof video') && !main.querySelector('.cat-tpl-proof + * video'), `${page.slug}: no film after the proof`);
  const pictures = [...main.querySelectorAll('img')].map(img => img.getAttribute('src')).concat(film.poster);
  const swatchFiles = [...html.matchAll(/url\((\/site-images\/finish\/[^)]+)\)/g)].map(match => match[1]);
  assert(swatchFiles.length >= page.cards * 2, `${page.slug}: finish swatches`);
  for (const src of [...pictures, ...new Set(swatchFiles)]) {
    assert(!sceneImage.test(src), `${page.slug}: scene or in-place photo ${src}`);
    assert(existsSync(path.join(root, src.replace(/[?#].*$/, ''))), `${page.slug}: missing image ${src}`);
  }

  // Facts (the hero's price row and the note under it), sample proof and contextual links.
  const facts = compact(`${hero.querySelector('.shop-hero-price').textContent} · ${hero.querySelector('.shop-hero-note').textContent.replace(/ · Or email us$/, '')}`);
  // One or two phone lines (review fix, 1 Nov 2026): the page's usual days only (5; 10 on the tree page, where every
  // plaque is on a board, as on the practice grid); longer times are on the cards and in the questions.
  for (const words of ['UK delivery included', 'free proof before you pay']) {
    assert(facts.toLowerCase().includes(words.toLowerCase()), `${page.slug}: facts line says "${words}"`);
  }
  const usual = Math.min(...pageDays);
  assert.equal(usual, page.usual || (page.stake ? 10 : STANDARD_DAYS), `${page.slug}: the page's usual days`);
  assert(facts.toLowerCase().endsWith(` made in ${usual} working days`) && !facts.includes('('), `${page.slug}: facts line ends with the usual ${usual} days, no exceptions: ${facts}`);
  if (page.planner) {
    // The date planner states the catalogue days of the page's plaques, as the cards do.
    const intro = compact(main.querySelector('.cat-tpl-planner .cat-tpl-section-intro').textContent);
    const made = cards.flatMap(card => card.getAttribute('data-offers').split(' ')).map(slug => offers.get(slug));
    const most = list => Math.max(...list.map(offer => offer.productionDays));
    const metal = most(made.filter(offer => !offer.preset.wood && offer.preset.material !== 'aged-brass'));
    const aged = most(made.filter(offer => !offer.preset.wood && offer.preset.material === 'aged-brass'));
    const boards = [...new Set(made.filter(offer => offer.preset.wood).map(offer => offer.productionDays))];
    assert(intro.includes(`made in ${metal} working days after you approve your proof and pay`) && intro.includes(`aged brass ${aged}`)
      && boards.every(value => new RegExp(`on a wood board ${value}\\b`).test(intro)) && intro.endsWith('then delivered the next working day.'),
    `${page.slug}: planner states the catalogue days (${metal}, aged ${aged}, boards ${boards.join('/')}): ${intro}`);
    plannerDays = [...new Set([metal, aged, ...boards])];
  }
  const proof = main.querySelector('.cat-tpl-proof .shop-proof-pdf-stack').getAttribute('href');
  assert(proof.startsWith('/samples/products/') && existsSync(path.join(root, proof.replace(/\?.*$/, ''))), `${page.slug}: sample proof PDF ${proof}`);
  for (const href of page.links) assert(main.querySelector(`a[href="${href}"]`), `${page.slug}: link to ${href}`);
  // Page-1 improvements: each new section with its heading, and every link in the guide sections reaching a built page.
  for (const [anchor, heading] of Object.entries(page.guides || {})) {
    assert.equal(compact(main.querySelector(`#${anchor}-heading`)?.textContent || ''), heading, `${page.slug}: #${anchor} section`);
  }
  for (const link of main.querySelectorAll('.cat-tpl-guide a[href^="/"]')) {
    assert(built(link.getAttribute('href')), `${page.slug}: guide link ${link.getAttribute('href')} reaches a built page`);
  }
  if (page.wordingIdeas) assert.equal(main.querySelectorAll('.cat-tpl-wording-row li').length, page.wordingIdeas, `${page.slug}: wording ideas`);
  const internal = [...main.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href'));
  for (const href of new Set(internal)) assert(built(href), `${page.slug}: internal link ${href} is built`);
  console.log(`PASS /${page.slug}: title, description, H1 and canonical match expected metadata; ${visible.length} questions match the FAQ schema; ${cards.length} cards lead with studio photos and link to built pages; lead-time lines match the catalogue (usual ${usual} days); ${new Set(internal).size} internal links; no scene photos, one tap-to-play film in its own section after the proof.`);
}

// The date planner's maths (services/occasionPlanner.ts), against a calendar of this script's own: for every event date
// it accepts and every production time on the opening page, the day it names is a working day from which the plaque,
// made in those working days and delivered the next working day, arrives by the working day before the event (a day to
// spare), and it is the latest such day; days already gone are "too close to promise"; later dates are not counted.
assert(plannerDays?.length >= 3, 'opening page: date planner found');
const planner = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../services/occasionPlanner.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, planner);
const { approveBy, BANK_HOLIDAYS, PLANNER_LAST_DAY } = planner.exports;
// England and Wales bank holidays, https://www.gov.uk/bank-holidays (8 a year).
const govUk = ['2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04', '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03', '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28'];
assert.deepEqual([...BANK_HOLIDAYS].sort(), govUk, 'planner: bank holidays');
assert(PLANNER_LAST_DAY <= '2027-12-31', `planner: counts only up to the last listed year (${PLANNER_LAST_DAY})`);
const shift = (day, by) => { const date = new Date(`${day}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + by); return date.toISOString().slice(0, 10); };
const working = day => ![0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay()) && !govUk.includes(day);
const addWorking = (day, count) => { let at = day; for (let left = count; left > 0;) { at = shift(at, 1); if (working(at)) left -= 1; } return at; };
const lastWorkingBefore = day => { let at = shift(day, -1); while (!working(at)) at = shift(at, -1); return at; };
let promised = 0;
for (const today of ['2026-11-01', '2026-11-02']) {
  for (let event = today; event <= '2028-01-31'; event = shift(event, 1)) {
    for (const days of plannerDays) {
      const answer = approveBy(event, days, today);
      if (event > PLANNER_LAST_DAY) { assert.equal(answer.status, 'unknown', `planner: ${event} is past the listed bank holidays`); continue; }
      assert(answer.day && working(answer.day), `planner: ${event}, ${days} days: ${answer.day} is a working day`);
      const arrives = addWorking(answer.day, days + 1);
      assert(arrives <= lastWorkingBefore(event), `planner: approving on ${answer.day} for ${event} (${days} days) arrives ${arrives}, too late`);
      assert(addWorking(addWorking(answer.day, 1), days + 1) > lastWorkingBefore(event), `planner: ${answer.day} is the last day that works for ${event} (${days} days)`);
      assert.equal(answer.status, answer.day < today ? 'late' : answer.day === today ? 'today' : 'ok', `planner: ${event}, ${days} days, status`);
      if (answer.status !== 'late') promised += 1;
    }
  }
}
assert.equal(approveBy('soon', 5, '2026-11-02').status, 'unknown', 'planner: not a date');
console.log(`PASS opening date planner: ${promised} approval days for ${plannerDays.join('/')}-day plaques, each meets its event with a working day to spare; past days are refused; dates after ${PLANNER_LAST_DAY} are not counted.`);
console.log('Category template: RESULT PASS');
