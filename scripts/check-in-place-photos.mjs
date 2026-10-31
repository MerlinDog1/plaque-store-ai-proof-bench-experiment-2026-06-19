// The photos in place (owner msg 8341, 31 Oct 2026), checked in the built pages: every category page has its row of
// new photos, each photo is published and tagged as AI-made, opens its own plaque (on the tree page, the designer with
// that plaque on the oak board and ground stake) and its caption gives that plaque's catalogue price. The four occasion
// pages lead with their own photo, which "Design online" opens and links share. Rows and lead photos:
// services/inPlacePhotos.ts.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { merchantOffers } from '../services/merchantCatalogue.mjs';

const root = path.resolve(process.env.DIST || 'dist');
const site = 'https://instaplaque.co.uk';
const AI_TAG = 'digitalsourcetype/trainedAlgorithmicMedia';
// New photos in each page's row. The occasion pages show their first photo as the lead picture instead; the tree page
// has four, followed by its own four photos.
const rows = {
  'memorial-plaques': 5, 'bench-plaques': 5, 'garden-plaques': 5, 'tree-memorial-plaques': 4, 'opening-plaques': 5,
  'brass-plaques': 5, 'stainless-steel-plaques': 5,
  'professional-brass-plaques': 4, 'donor-recognition-plaques': 4, 'church-plaques': 4, 'house-name-plaques': 4,
};
const leads = ['professional-brass-plaques', 'donor-recognition-plaques', 'church-plaques', 'house-name-plaques'];
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const gbp = price => `£${Number.isInteger(price) ? price : price.toFixed(2)}`;

// Vercel builds may serve images through its optimiser; check the original file it points at.
const localFile = src => {
  let url = new URL(src, site);
  if (url.pathname === '/_vercel/image') url = new URL(url.searchParams.get('url'), site);
  assert.equal(url.origin, site, `same-origin image ${src}`);
  return path.join(root, decodeURIComponent(url.pathname));
};
const published = async (src, label) => {
  const bytes = await fs.readFile(localFile(src)).catch(() => null);
  assert(bytes, `${label}: missing image ${src}`);
  assert(bytes.includes(AI_TAG), `${label}: ${src} lacks the IPTC trainedAlgorithmicMedia tag`);
};

let photos = 0;
for (const [page, count] of Object.entries(rows)) {
  const { document } = new JSDOM(await fs.readFile(path.join(root, page, 'index.html'), 'utf8')).window;
  const figures = [...document.querySelectorAll('.cat-examples-row figure')].filter(figure => figure.querySelector('img')?.getAttribute('src')?.includes('/site-images/in-place/'));
  assert.equal(figures.length, count, `${page}: ${count} photos in place`);
  for (const figure of figures) {
    const img = figure.querySelector('img');
    const href = figure.querySelector('a')?.getAttribute('href');
    const caption = figure.querySelector('figcaption').textContent.replace(/\s+/g, ' ');
    assert(img.getAttribute('alt')?.length > 30, `${page}: descriptive alt for ${img.getAttribute('src')}`);
    await published(img.getAttribute('src'), page);
    assert(href, `${page}: ${img.getAttribute('src')} opens its plaque`);
    if (page === 'tree-memorial-plaques') {
      const url = new URL(href, site);
      assert.equal(url.pathname, '/design', `${page}: photo opens the designer`);
      assert.equal(url.searchParams.get('backing'), 'stake', `${page}: on the board and stake`);
      assert(offers.has(url.searchParams.get('plaque')), `${page}: catalogue plaque ${url.searchParams.get('plaque')}`);
      assert(/ on an oak board and ground stake, £\d/.test(caption), `${page}: stake price in "${caption}"`);
    } else {
      const slug = href.slice(1);
      assert(offers.has(slug), `${page}: ${href} is a catalogue plaque`);
      await fs.access(path.join(root, slug, 'index.html'));
      assert(caption.includes(`, ${gbp(offers.get(slug).price)}.`), `${page}: catalogue price ${gbp(offers.get(slug).price)} in "${caption}"`);
    }
    photos++;
  }
  if (leads.includes(page)) {
    const hero = document.querySelector('.cat-hero img');
    const sources = [hero.getAttribute('src'), ...(hero.getAttribute('srcset') || '').split(',').filter(Boolean).map(part => part.trim().split(/\s/)[0])];
    assert(sources.every(src => decodeURIComponent(src).includes(`/site-images/in-place/${page}/`)), `${page}: lead photo is its own photo`);
    for (const src of sources) await published(src, `${page} lead`);
    const design = new URL(document.querySelector('.cat-hero a.shop-button').getAttribute('href'), site);
    assert(decodeURIComponent(sources[0]).includes(`-${design.searchParams.get('plaque')}-hero-`), `${page}: Design online opens the pictured plaque`);
    const share = document.querySelector('meta[property="og:image"]').content;
    assert(share.includes(`/site-images/in-place/${page}/`), `${page}: share image is its lead photo`);
    await published(share, `${page} share image`);
    photos++;
  }
  document.defaultView.close();
}
console.log(`In-place photo checks passed: ${photos} photos on ${Object.keys(rows).length} pages, published, AI-tagged, linked and priced from the catalogue.`);
