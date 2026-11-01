// The "products first" category template pages (components/CategoryTemplate.tsx, 1 Nov 2026, owner msg 8384): memorial
// and bench (stage 1), garden, tree, brass, stainless steel, opening and custom (stage 2), checked in the final HTML
// (dist, or DIST=<folder>):
// - title, meta description, H1 and canonical are the live ones (as production's source, ec24ba1, builds them);
// - the FAQPage schema is exactly the six questions and answers shown on the page;
// - one card per size, each leading with a studio photo of the plaque it links to, every card and finish link reaching
//   a built product page (on the tree page, the designer on that plate, on the oak board and ground stake), and the
//   finish links present as plain links for visitors without JavaScript;
// - each card's lead-time line names the slowest catalogue production days (offer.productionDays) of the plaques
//   behind it (its data-offers); a card without one has only plaques made in the standard 5 working days; the facts
//   line gives the page's usual days (5; 10 on the tree page, where every plaque is on a board);
// - the opening page's date planner states the catalogue days of its plaques, and its date maths
//   (services/occasionPlanner.ts) never names an approval day that the catalogue's days and delivery can't meet,
//   checked against this script's own calendar for every date it accepts;
// - no hero film: one tap-to-play film in the proof block; no in-place or scene photos; every image and swatch exists;
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
  { slug: 'garden-plaques', cards: 8, h1: "Personalised garden plaques",
    title: "Garden Memorial Plaques UK | Free Online Proof | InstaPlaque",
    description: "Personalise a brass or stainless steel garden plaque for a tree, bench or memorial corner. Compare sizes and fixings, then check a free proof before you buy.",
    faqs: ["Can a garden plaque stay outside all year?", "Which metal is best for a garden?", "What size should a garden plaque be?", "How do I fix it to a wall, fence or stone?", "Can a garden plaque go near the sea?", "How do I look after a garden plaque?"],
    links: [...["/tree-memorial-plaques", "/bench-plaques", "/memorial-plaques", "/memorial-plaque-wording", "/opening-plaques", "/plaque-sizes"], ...common] },
  { slug: 'tree-memorial-plaques', cards: 6, stake: true, h1: "Memorial tree plaques",
    title: "Memorial Tree Plaques UK | Engraved Tree Dedication Plaques | InstaPlaque",
    description: "Personalised memorial tree plaques in brass or stainless steel, on an oak board and black steel ground stake beside the tree. Free proof, or we design it on WhatsApp.",
    faqs: ["Can I fix a plaque to a tree?", "Can I put one in a churchyard, park or memorial woodland?", "What size should a memorial tree plaque be?", "What should a tree memorial plaque say?", "Will the plaque last outdoors?", "Can I have just the plate, for a post or fence?"],
    links: [...["/garden-plaques", "/memorial-plaques", "/memorial-plaque-wording"], ...common] },
  { slug: 'brass-plaques', cards: 8, h1: "Personalised brass plaques",
    title: "Brass Plaques UK | Custom Engraved Brass Plaques",
    description: "Custom brass plaques for memorials, benches, openings and presentation use. Choose brushed, polished, orbital or aged brass and approve a proof online.",
    faqs: ["Which brass finish should I choose?", "Will brass tarnish outside?", "How long does a brass plaque take?", "Can you match an existing brass plaque?", "Can you add a logo or crest?", "Do you charge VAT?"],
    links: [...["/stainless-steel-plaques", "/memorial-plaques", "/bench-plaques", "/opening-plaques", "/memorial-plaque-wording"], ...common] },
  { slug: 'stainless-steel-plaques', cards: 8, h1: "Personalised stainless steel plaques",
    title: "Stainless Steel Plaques UK | Outdoor Metal Plaques Made to Order",
    description: "Custom stainless steel plaques for outdoor, wall, bench and memorial use. Choose brushed or polished stainless and approve your proof before payment.",
    faqs: ["Will a stainless steel plaque last outdoors?", "Can it go near the sea?", "Brushed or polished stainless steel?", "How do I look after a stainless steel plaque?", "Can you add a logo?", "How long does a stainless steel plaque take?"],
    links: [...["/brass-plaques", "/memorial-plaques", "/bench-plaques", "/opening-plaques", "/tree-memorial-plaques"], ...common] },
  { slug: 'opening-plaques', cards: 6, planner: true, h1: "Opening plaques",
    title: "Opening Plaques UK | Custom Building Opening Plaques",
    description: "Order custom opening plaques in the UK with a free online proof. Brass and stainless steel plaques for building openings, unveilings, presentations and formal ceremonies.",
    faqs: ["Can colleagues check the opening plaque before we order?", "Can you meet our opening ceremony date?", "Can the plaque include a school crest or organisation logo?", "Can we pay by invoice or purchase order?", "Can an opening plaque go outdoors?", "What fixings come with an opening plaque?"],
    links: [...["/brass-plaques", "/stainless-steel-plaques", "/how-it-works", "/contact"], ...common] },
  { slug: 'custom-plaques', cards: 6, h1: "Custom plaques",
    title: "Custom Plaques UK | Bespoke Oval, Circular & Made-to-Measure Plaques",
    description: "Start a custom plaque proof for bespoke sizes, oval plaques, circular plaques and made-to-measure brass or stainless steel plaques.",
    faqs: ["What sizes and shapes can you make?", "How do I get a price for another size?", "Can bespoke plaques still use instant proofing?", "Can you make a plaque from my own design?", "How long does a custom plaque take?", "Can I see my plaque before I pay?"],
    links: [...["/ai-plaque-design", "/plaque-sizes", "/memorial-plaque-wording", "/design-request"], ...common] },
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

for (const page of pages) {
  const html = await fs.readFile(path.join(root, page.slug, 'index.html'), 'utf8');
  const { document } = new JSDOM(html).window;
  const main = document.querySelector('.cat-tpl');
  assert(main, `${page.slug}: template markup`);
  assert.equal(document.title, page.title, `${page.slug}: title`);
  assert.equal(document.querySelector('meta[name="description"]').content, page.description, `${page.slug}: meta description`);
  assert.equal(document.querySelectorAll('h1').length, 1, `${page.slug}: one H1`);
  assert.equal(compact(document.querySelector('h1').textContent), page.h1, `${page.slug}: H1`);
  assert.equal(document.querySelector('link[rel="canonical"]').href, `${site}/${page.slug}`, `${page.slug}: canonical`);

  // FAQPage schema = the visible questions, in order, word for word.
  const graph = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => JSON.parse(script.textContent)['@graph'] || []);
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
      // The designer on the plate, on the light oak board and stake; pictured by the plate on its oak board.
      const plateOf = link => {
        const url = new URL(link, site);
        const plate = offers.get(url.searchParams.get('plaque'));
        assert(url.pathname === '/design' && url.searchParams.get('backing') === 'stake' && built('/design') && plate && !plate.preset.wood && built(`/${plate.slug}`),
          `${page.slug} ${name}: ${link} opens the designer on a built plate, on the board and stake`);
        const board = made.find(offer => offer.preset.material === plate.preset.material && sameSize(offer, plate));
        assert(board && board.preset.wood && board.preset.woodTone === 'light', `${page.slug} ${name}: ${plate.slug} is made on its light oak board`);
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

  // No hero film and no scene photos; every picture exists. The promo film is back once, tap to play, inside the proof
  // block (owner msg 8440, 1 Nov 2026): nothing loads before the tap (no src, preload none, no autoplay, lazy poster).
  assert.equal(main.querySelectorAll('iframe').length, 0, `${page.slug}: no embedded frames`);
  const films = [...main.querySelectorAll('video')];
  assert.equal(films.length, 1, `${page.slug}: one film`);
  assert(films[0].closest('.cat-tpl-proof .cat-tpl-film'), `${page.slug}: the film sits in the proof block, not at the top`);
  assert(!films[0].hasAttribute('src') && !films[0].hasAttribute('autoplay') && films[0].getAttribute('preload') === 'none' && !films[0].hasAttribute('poster'),
    `${page.slug}: the film loads nothing until tapped`);
  assert.equal(main.querySelector('.cat-tpl-film .promo-film-poster')?.getAttribute('loading'), 'lazy', `${page.slug}: lazy film poster`);
  assert(main.querySelector(`.cat-tpl-film a[href="${'/video'}"]`), `${page.slug}: watch page link beside the film`);
  const pictures = [...main.querySelectorAll('img')].map(img => img.getAttribute('src'));
  const swatchFiles = [...html.matchAll(/url\((\/site-images\/finish\/[^)]+)\)/g)].map(match => match[1]);
  assert(swatchFiles.length >= page.cards * 2, `${page.slug}: finish swatches`);
  for (const src of [...pictures, ...new Set(swatchFiles)]) {
    assert(!sceneImage.test(src), `${page.slug}: scene or in-place photo ${src}`);
    assert(existsSync(path.join(root, src.replace(/[?#].*$/, ''))), `${page.slug}: missing image ${src}`);
  }

  // Facts line, sample proof and contextual links.
  const facts = compact(main.querySelector('.cat-tpl-head .cat-hero-buy').textContent);
  // One or two phone lines (review fix, 1 Nov 2026): the page's usual days only (5; 10 on the tree page, where every
  // plaque is on a board); longer times are on the cards and in the questions.
  for (const words of ['UK delivery included', 'free proof before you pay']) {
    assert(facts.includes(words), `${page.slug}: facts line says "${words}"`);
  }
  const usual = Math.min(...pageDays);
  assert.equal(usual, page.stake ? 10 : STANDARD_DAYS, `${page.slug}: the page's usual days`);
  assert(facts.endsWith(` made in ${usual} working days`) && !facts.includes('('), `${page.slug}: facts line ends with the usual ${usual} days, no exceptions: ${facts}`);
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
  const internal = [...main.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href'));
  for (const href of new Set(internal)) assert(built(href), `${page.slug}: internal link ${href} is built`);
  console.log(`PASS /${page.slug}: title, description, H1 and canonical unchanged; ${visible.length} questions match the FAQ schema; ${cards.length} cards lead with studio photos and link to built pages; lead-time lines match the catalogue (usual ${usual} days); ${new Set(internal).size} internal links; no scene photos, one tap-to-play film in the proof block.`);
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
