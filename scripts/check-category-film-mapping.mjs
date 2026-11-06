// All exact catalogue products share the existing breadcrumb category; no per-product edits.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { categoryFilms } from '../services/categoryFilms.mjs';
const root = process.env.DIST || 'dist';
const counts = {}, examples = {};
assert.equal(merchantOffers.length, 175);
for (const offer of merchantOffers) {
  const html = fs.readFileSync(path.join(root, offer.slug, 'index.html'), 'utf8');
  const dom = new JSDOM(html); const doc = dom.window.document;
  const categories = [...doc.querySelectorAll('.shop-breadcrumb a[href]')].map(a => a.getAttribute('href').slice(1)).filter(slug => categoryFilms[slug]);
  const category = categories.at(-1);
  assert.ok(category, `${offer.slug}: category breadcrumb`);
  const films = doc.querySelectorAll('[data-film-id]');
  assert.equal(films.length, 1, `${offer.slug}: one film`);
  assert.equal(films[0].dataset.filmId, categoryFilms[category].id, `${offer.slug}: film follows breadcrumb`);
  assert.equal(films[0].querySelector('video').getAttribute('src'), null, `${offer.slug}: lazy video`);
  assert.ok(html.includes(categoryFilms[category].poster), `${offer.slug}: own poster`);
  counts[category] = (counts[category] || 0) + 1;
  examples[category] ||= '/' + offer.slug;
  dom.window.close();
}
console.log(JSON.stringify({total: merchantOffers.length, counts, examples}, null, 2));
console.log('PASS all 175 product film IDs match their stable breadcrumb category');
