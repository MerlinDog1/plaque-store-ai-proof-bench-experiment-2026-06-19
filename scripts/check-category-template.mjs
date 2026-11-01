// The "products first" category template pages (components/CategoryTemplate.tsx, 1 Nov 2026, owner msg 8384), checked
// in the final HTML (dist, or DIST=<folder>):
// - title, meta description, H1 and canonical are the live ones (search position kept: see the doc);
// - the FAQPage schema is exactly the six questions and answers shown on the page;
// - one card per size, each leading with a studio photo of the plaque it links to, every card and finish link reaching
//   a built product page, and the finish links present as plain links for visitors without JavaScript;
// - no hero film and no in-place or scene photos anywhere on the page; every image and swatch file exists;
// - the facts line, the sample proof PDF and the page's contextual links are present.
// Usage: node scripts/check-category-template.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
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
const pages = [
  { slug: 'memorial-plaques', cards: 10, faqs: memorialFaqs, h1: 'Personalised memorial plaques',
    title: 'Memorial Plaques UK | Brass & Stainless Steel | InstaPlaque',
    description: 'Personalised memorial plaques in brass or stainless steel for walls, gardens and graves. Check your wording with a free online proof. UK delivery included.',
    links: ['/bench-plaques', '/garden-plaques', '/tree-memorial-plaques', '/church-plaques', '/memorial-plaque-wording', '/video', '/portrait-plaques', '/plaque-sizes', '/materials'] },
  { slug: 'bench-plaques', cards: 6, faqs: benchFaqs, h1: 'Personalised bench plaques',
    title: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    description: 'Order custom bench plaques in brass or stainless steel. Build a proof online, check the inscription and see live pricing before payment.',
    links: ['/memorial-plaques', '/garden-plaques', '/tree-memorial-plaques', '/memorial-plaque-wording', '/video', '/portrait-plaques', '/materials'] },
];
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

  // Cards: studio photo first, linking to built product pages; finish links for visitors without JavaScript.
  const cards = [...main.querySelectorAll('.cat-tpl-card')];
  assert.equal(cards.length, page.cards, `${page.slug}: cards`);
  const itemList = graph.find(node => node['@type'] === 'ItemList');
  assert(itemList, `${page.slug}: ItemList of linked plaques`);
  const listed = new Set(itemList.itemListElement.map(item => item.url));
  for (const card of cards) {
    const link = card.querySelector('a.cat-tpl-card-link').getAttribute('href').slice(1);
    const image = card.querySelector('.cat-tpl-photo img').getAttribute('src');
    assert(offers.has(link) && built(`/${link}`), `${page.slug}: card link /${link} is a built product page`);
    assert(studioPhotos.has(link) && image === `/site-images/studio-photo/${link}-600.webp`, `${page.slug}: /${link} card leads with its studio photo (${image})`);
    assert(listed.has(`${site}/${link}`), `${page.slug}: /${link} in the ItemList`);
    const swatches = [...card.querySelectorAll('a.cat-tpl-swatch')];
    assert(swatches.length >= 2 && swatches.every(swatch => offers.has(swatch.getAttribute('href').slice(1)) && built(swatch.getAttribute('href'))),
      `${page.slug}: /${link} card's finish links reach built product pages`);
    assert(swatches.some(swatch => swatch.getAttribute('href') === `/${link}`), `${page.slug}: /${link} card's own finish is one of its links`);
    assert(/^from £/.test(compact(card.querySelector('.cat-tpl-amount').textContent)), `${page.slug}: /${link} card shows a from-price`);
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
  // One or two phone lines (review fix, 1 Nov 2026): the usual days only; longer times are on the cards and in the FAQ.
  for (const words of ['UK delivery included', 'free proof before you pay']) {
    assert(facts.includes(words), `${page.slug}: facts line says "${words}"`);
  }
  assert(/ made in \d+ working days$/.test(facts) && !facts.includes('('), `${page.slug}: facts line ends with the usual days, no exceptions: ${facts}`);
  const proof = main.querySelector('.cat-tpl-proof .shop-proof-pdf-stack').getAttribute('href');
  assert(proof.startsWith('/samples/products/') && existsSync(path.join(root, proof.replace(/\?.*$/, ''))), `${page.slug}: sample proof PDF ${proof}`);
  for (const href of page.links) assert(main.querySelector(`a[href="${href}"]`), `${page.slug}: link to ${href}`);
  const internal = [...main.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')).filter(href => !href.startsWith('/design'));
  for (const href of new Set(internal)) assert(built(href), `${page.slug}: internal link ${href} is built`);
  console.log(`PASS /${page.slug}: title, description, H1 and canonical unchanged; ${visible.length} questions match the FAQ schema; ${cards.length} cards lead with studio photos and link to built product pages; ${new Set(internal).size} internal links; no scene photos, one tap-to-play film in the proof block.`);
}
console.log('Category template: RESULT PASS');
