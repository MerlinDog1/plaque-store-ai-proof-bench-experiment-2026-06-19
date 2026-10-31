// Every "from" price is the cheapest plaque its page sells, and every tile shows the price of the page it leads to
// (owner msg 7009, 28 Oct 2026: "our from price still seems way high always"). On the built pages:
// - each category page's hero "from" price is the lowest in its own price table, in the page's own metal (brass on the
//   brass page, stainless steel on the others);
// - a tile leading to a category page shows that page's hero price, and a tile leading to a plaque shows that plaque's
//   price: the brass and stainless finish tiles, the memorial and garden setting tiles, and the homepage's tiles;
// - setting and shape tiles use the lowest matching catalogue option, independently of the pictured finish;
// - all category product cards show their exact catalogue price;
// - the brass and stainless finish tiles lead to their finish's cheapest plaque (on the same backing), so they show its
//   from-price rather than a photographed larger plaque's.
// Usage: node scripts/check-from-prices.mjs (reads dist/), DIST=<folder of saved pages>, or BASE=<site URL>.
import fs from 'node:fs';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { categoryTileOffers } from '../services/categoryTileOffers.mjs';

const BASE = process.env.BASE;
const DIST = process.env.DIST || 'dist';
const categories = ['memorial-plaques', 'bench-plaques', 'garden-plaques', 'brass-plaques', 'stainless-steel-plaques',
  'tree-memorial-plaques', 'opening-plaques', 'custom-plaques'];
const metalOf = slug => (slug === 'brass-plaques' ? 'brass' : 'stainless steel');
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
const gbp = value => (value === null ? 'none' : `£${Number.isInteger(value) ? value : value.toFixed(2)}`);

function heroPrice(html) {
  const match = /class="cat-hero-buy"><strong class="shop-product-price">([\s\S]*?)<\/strong>/.exec(html);
  return match ? amount(text(match[1])) : null;
}
/** The lowest price in the page's price tables for one metal (the cells' labels name the size, the metal and the price). */
function tableLow(html, metal) {
  const prices = [...html.matchAll(/aria-label="[^"]*?, (stainless steel|aged brass|brass)(?: on an oak board and ground stake)?: £([0-9.,]+)"/g)]
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
// Setting and shape routes must quote the cheapest offered option, not just match the linked
// photographed plaque (the old check allowed those two equally wrong values to agree).
const choiceGroups = {
  'memorial-plaques': ['grave-nameplate'],
  'garden-plaques': ['garden-wall', 'garden-wall'],
  'custom-plaques': ['oval', 'circle', 'large'],
};
for (const [slug, groups] of Object.entries(choiceGroups)) {
  const choices = tiles(html[slug], 'cat-route', 'small').filter(([, , group]) => group);
  check(JSON.stringify(choices.map(([, , group]) => group)) === JSON.stringify(groups), `/${slug}: all setting/shape choices have price coverage`);
  for (const [destination, shown, group] of choices) {
    const options = categoryTileOffers(group);
    const low = Math.min(...options.map(offer => offer.price));
    check(options.some(offer => offer.slug === destination) && shown === low && offerPrice.get(destination) === low,
      `/${slug} ${group}: ${gbp(shown)}, cheapest catalogue option ${gbp(low)}, linked offer ${gbp(offerPrice.get(destination))}`);
  }
}
// Exact product photo cards show their own offered price, never a stale copied amount. Fail if a row
// disappears: this covers the new brass/steel size cards as well as the existing popular-plaque rows.
const pickCounts = { 'memorial-plaques': 4, 'bench-plaques': 8, 'garden-plaques': 4, 'opening-plaques': 4, 'brass-plaques': 4, 'stainless-steel-plaques': 4 };
for (const [slug, count] of Object.entries(pickCounts)) {
  const cards = tiles(html[slug], 'cat-product-card', 'strong');
  check(cards.length === count, `/${slug}: ${cards.length}/${count} product photo cards covered`);
  for (const [destination, shown] of cards) {
    check(offerPrice.has(destination) && shown === offerPrice.get(destination), `/${slug} product card /${destination}: ${gbp(shown)}, catalogue ${gbp(offerPrice.get(destination))}`);
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
