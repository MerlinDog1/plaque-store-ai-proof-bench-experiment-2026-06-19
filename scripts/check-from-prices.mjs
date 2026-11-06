// 1 Nov 2026: owner requests light/dark solid wood, never a species; assertions follow the customer wording.
// Every "from" price is the cheapest plaque its page sells, and every tile shows the price of the page it leads to
// (owner msg 7009, 28 Oct 2026: "our from price still seems way high always"). On the built pages:
// - each category page's hero "from" price is the lowest in its own price table, in the page's own metal (brass on the
//   brass page, stainless steel on the others);
// - a tile leading to a category page shows that page's hero price, and a tile leading to a plaque shows that plaque's
//   price: the brass and stainless finish tiles, the memorial and garden setting tiles, and the homepage's tiles;
// - setting and shape tiles use the lowest matching catalogue option, independently of the pictured finish;
// - all category product cards show their exact catalogue price;
// - the brass and stainless finish tiles lead to their finish's cheapest plaque (on the same backing), so they show its
//   from-price rather than a photographed larger plaque's;
// - on the eight "products first" template pages (components/CategoryTemplate.tsx, 1 Nov 2026: memorial, bench, garden,
//   tree, brass, stainless steel, opening, custom), every finish swatch carries its plaque's catalogue price (on the tree
//   page, the plate on its light solid wood board plus the ground stake), each card's from-price is the lowest of its swatches and the
//   card leads to one of them, and each size drawn to scale links to the cheapest plaque of that size in the page's
//   metals, at its price.
// Usage: node scripts/check-from-prices.mjs (reads dist/), DIST=<folder of saved pages>, or BASE=<site URL>.
import fs from 'node:fs';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { GROUND_STAKE_PRICE } from '../services/checkoutPolicy.mjs';

const BASE = process.env.BASE;
const DIST = process.env.DIST || 'dist';
const categories = ['memorial-plaques', 'bench-plaques', 'garden-plaques', 'brass-plaques', 'stainless-steel-plaques',
  'tree-memorial-plaques', 'opening-plaques', 'custom-plaques',
  'house-name-plaques', 'donor-recognition-plaques', 'church-plaques', 'professional-brass-plaques'];
const metalOf = slug => (['brass-plaques', 'professional-brass-plaques'].includes(slug) ? 'brass' : 'stainless steel');
const offerPrice = new Map(merchantOffers.map(offer => [offer.slug, offer.price]));

async function page(slug) {
  if (BASE) {
    const response = await fetch(`${BASE.replace(/\/$/, '')}/${slug}`);
    if (!response.ok) throw new Error(`/${slug}: HTTP ${response.status}`);
    return response.text();
  }
  return fs.readFileSync(slug ? `${DIST}/${slug}/index.html` : `${DIST}/index.html`, 'utf8');
}
const text = html => html.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const amount = value => {
  const match = /£\s?([0-9][0-9,]*(?:\.[0-9]{1,2})?)/.exec(value || '');
  return match ? Number(match[1].replace(/,/g, '')) : null;
};
const gbp = value => (value == null ? 'none' : `£${Number.isInteger(value) ? value : value.toFixed(2)}`);

function heroPrice(html) {
  // The homepage's hero on the category and portrait pages (owner msg 10329): its price row; else the earlier facts line.
  const match = /class="shop-hero-price"><span>[^<]*<\/span><strong>([\s\S]*?)<\/strong>/.exec(html)
    || /class="cat-hero-buy"><strong class="shop-product-price">([\s\S]*?)<\/strong>/.exec(html);
  return match ? amount(text(match[1])) : null;
}
/** The lowest price in the page's price tables for one metal (the cells' labels name the size, the metal and the price). */
function tableLow(html, metal) {
  const prices = [...html.matchAll(/aria-label="[^"]*?, (stainless steel|aged brass|brass)(?: on a light solid wood board and ground stake)?: £([0-9.,]+)"/g)]
    .filter(match => match[1] === metal).map(match => Number(match[2].replace(/,/g, '')));
  return prices.length ? Math.min(...prices) : null;
}
/** Tiles: [destination slug, shown price] for each link with this class, the price read from the given tag. */
function tiles(html, className, tag) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].flatMap(match => {
    const attrs = match[1];
    const classes = /class="([^"]*)"/.exec(attrs)?.[1].split(/\s+/) || [];
    if (!classes.includes(className)) return [];
    const href = /href="([^"]*)"/.exec(attrs)?.[1] || '';
    const inner = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(match[2]);
    return [[href.replace(/^\//, '').replace(/[?#].*$/, ''), inner ? amount(text(inner[1])) : null,
      /data-price-group="([^"]*)"/.exec(attrs)?.[1]]];
  });
}

const failures = [];
const results = [];
const check = (ok, line) => { results.push(`${ok ? 'PASS' : 'FAIL'} ${line}`); if (!ok) failures.push(line); };
const html = { '': await page('') };
for (const slug of categories) html[slug] = await page(slug);
html['portrait-plaques'] = await page('portrait-plaques');
const hero = Object.fromEntries([...categories, 'portrait-plaques'].map(slug => [slug, heroPrice(html[slug])]));

for (const slug of categories) {
  const low = tableLow(html[slug], metalOf(slug));
  check(hero[slug] !== null && hero[slug] === low, `/${slug}: hero from ${gbp(hero[slug])}, cheapest ${metalOf(slug)} in its price table ${gbp(low)}`);
}
const expected = slug => (slug in hero ? hero[slug] : offerPrice.has(slug) ? offerPrice.get(slug) : undefined);
for (const slug of categories) {
  for (const [destination, shown] of tiles(html[slug], 'cat-route', 'small')) {
    const want = expected(destination);
    check(want !== undefined && shown === want, `/${slug} tile to /${destination}: ${gbp(shown)}, next page ${want === undefined ? 'unknown' : gbp(want)}`);
  }
}
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const backing = offer => (offer.preset.wood ? offer.preset.woodTone : 'none');
for (const slug of ['brass-plaques', 'stainless-steel-plaques']) {
  for (const [destination, shown] of tiles(html[slug], 'cat-route', 'small')) {
    const offer = offers.get(destination);
    const low = offer && Math.min(...merchantOffers.filter(item => item.preset.material === offer.preset.material && backing(item) === backing(offer)).map(item => item.price));
    check(!!offer && shown === low, `/${slug} finish tile to /${destination}: ${gbp(shown)}, its finish from ${offer ? gbp(low) : 'unknown'}`);
  }
}
// Template cards (components/CategoryTemplate.tsx): one per size (or size on a wood board), with a link per finish in
// the static HTML. Garden, tree, brass, stainless steel, opening and custom moved onto the template on 1 Nov 2026: their
// setting and shape tiles (garden walls; custom oval, circle and large) and their four product photo cards went with the
// old layout, and the same choices are now cards and sizes checked here. On the tree page every plaque is priced and
// opened on the light solid wood board and ground stake (owner msg 6506): its links open the designer on a plate
// (/design?backing=stake&plaque=<slug>) at the price of that plate on its light solid wood board plus the stake.
const templateCounts = { 'memorial-plaques': 10, 'bench-plaques': 6, 'garden-plaques': 8, 'tree-memorial-plaques': 6, 'brass-plaques': 8,
  'stainless-steel-plaques': 8, 'opening-plaques': 6, 'custom-plaques': 6,
  'house-name-plaques': 3, 'donor-recognition-plaques': 6, 'church-plaques': 6, 'professional-brass-plaques': 4 };
const pageMetals = { 'brass-plaques': ['polished-brass', 'brushed-brass', 'orbital-brass-matt-lacquer', 'aged-brass'], 'stainless-steel-plaques': ['polished-stainless', 'brushed-stainless'] };
pageMetals['professional-brass-plaques'] = pageMetals['brass-plaques'];
const stakePages = new Set(['tree-memorial-plaques']);
const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
const sameSize = (a, b) => a.preset.width === b.preset.width && a.preset.height === b.preset.height && a.preset.shape === b.preset.shape;
/** Where a template link leads and the price it should show: a product page at its catalogue price, or on the tree page
 * the designer on a plate, at that plate on its light solid wood board plus the stake. */
function target(href, stake) {
  const url = new URL((href || '').replace(/&amp;/g, '&'), 'https://instaplaque.co.uk');
  if (!stake) return { slug: url.pathname.slice(1), price: offerPrice.get(url.pathname.slice(1)) };
  const plate = offers.get(url.searchParams.get('plaque'));
  const board = plate && !plate.preset.wood && merchantOffers.find(item => item.preset.wood && item.preset.woodTone === 'light'
    && item.preset.material === plate.preset.material && sameSize(item, plate));
  const designer = url.pathname === '/design' && url.searchParams.get('backing') === 'stake';
  return { slug: plate?.slug, price: designer && board ? board.price + GROUND_STAKE_PRICE : undefined };
}
for (const [slug, count] of Object.entries(templateCounts)) {
  const stake = stakePages.has(slug);
  const cards = [...html[slug].matchAll(/<li class="cat-tpl-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g)].map(match => match[1]);
  check(cards.length === count, `/${slug}: ${cards.length}/${count} template cards`);
  cards.forEach((card, index) => {
    const link = target(/<a class="cat-tpl-card-link" href="([^"]+)"/.exec(card)?.[1], stake).slug;
    const swatches = [...card.matchAll(/<a\b[^>]*class="cat-tpl-swatch[^"]*"[^>]*>/g)].map(match => {
      const { slug: destination, price } = target(attr(match[0], 'href'), stake);
      return [destination, Number(attr(match[0], 'data-price')), price];
    });
    const shown = /<strong class="cat-tpl-amount">([\s\S]*?)<\/strong>/.exec(card);
    const low = Math.min(...swatches.map(([, price]) => price));
    check(swatches.length > 0 && swatches.every(([, price, want]) => want !== undefined && price === want),
      `/${slug} card ${index + 1}: ${swatches.length} finish links, each at its catalogue price${stake ? ' on the light solid wood board and stake' : ''}`);
    check(!!shown && /^from /.test(text(shown[1])) && amount(text(shown[1])) === low, `/${slug} card ${index + 1}: from ${gbp(shown && amount(text(shown[1])))}, lowest finish ${gbp(low)}`);
    check(!!link && swatches.some(([destination]) => destination === link), `/${slug} card ${index + 1}: leads to /${link}, one of its finishes`);
  });
  // Sizes drawn to scale: each links to the cheapest plaque of its size (without backing) in the page's metals.
  // A tree-page size with no light-wood-board version in the catalogue (the 200 mm round) is priced by the designer's own
  // pricing, as the page's price table is: there it must match that table's cell for its size and metal.
  const metalWord = material => (material === 'aged-brass' ? 'aged brass' : material.endsWith('brass') ? 'brass' : 'stainless steel');
  const tableCell = (label, material) => amount(new RegExp(`aria-label="${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, ${metalWord(material)} on a light solid wood board and ground stake: (£[0-9.,]+)"`).exec(html[slug])?.[1]);
  const sizes = [...html[slug].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(match => /class="cat-tpl-scale-link"/.test(match[1]))
    .map(match => [target(attr(match[1], 'href'), stake), amount(text(/<strong[^>]*>([\s\S]*?)<\/strong>/.exec(match[2])?.[1] || '')), text(/<b>([\s\S]*?)<\/b>/.exec(match[2])?.[1] || '')]);
  check(sizes.length >= 4, `/${slug}: ${sizes.length} sizes drawn to scale`);
  for (const [found, shown, label] of sizes) {
    const { slug: destination } = found;
    const plate = offers.get(destination);
    const price = found.price ?? (stake && plate ? tableCell(label, plate.preset.material) : undefined);
    const cheapest = plate && Math.min(...merchantOffers.filter(item => !item.preset.wood && sameSize(item, plate)
      && (!pageMetals[slug] || pageMetals[slug].includes(item.preset.material))).map(item => item.price));
    check(!!plate && !plate.preset.wood && plate.price === cheapest && price !== undefined && shown === price,
      `/${slug} size to scale /${destination}: ${gbp(shown)}, expected ${gbp(price)}, the cheapest of its size ${gbp(cheapest)}`);
  }
}
for (const [className, tag] of [['shop-hero-route', 'small'], ['shop-collection', 'strong']]) {
  const homeTiles = tiles(html[''], className, tag);
  check(homeTiles.length >= 4, `homepage has its ${className} tiles (${homeTiles.length})`);
  for (const [destination, shown] of homeTiles) {
    const want = expected(destination);
    check(want !== undefined && shown === want, `homepage ${className} to /${destination}: ${gbp(shown)}, page ${want === undefined ? 'unknown' : gbp(want)}`);
  }
}

console.log(results.join('\n'));
console.log(failures.length ? `From-prices: RESULT FAIL (${failures.length})` : 'From-prices: every hero is its page\'s cheapest plaque and every choice tile is its cheapest offered option and every product card matches the catalogue. RESULT PASS');
process.exit(failures.length ? 1 : 0);
