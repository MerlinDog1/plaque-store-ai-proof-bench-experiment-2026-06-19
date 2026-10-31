// Assertions against the complete final HTML, not just the content config: catches missing prerenders, mismatched
// schema/visible copy, stale prices, orphan pages, broken product links/images and accidental generic metadata.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { merchantOffers } from '../services/merchantCatalogue.mjs';

export const occasionRoutes = [
  ['house-name-plaques', 'House name plaques', 'brass-plaques', 'polished-brass-200x150-rect-plaque'],
  ['donor-recognition-plaques', 'Donor and recognition plaques', 'opening-plaques', 'brushed-brass-300x200-rect-light-wood-plaque'],
  ['church-plaques', 'Church pew and dedication plaques', 'memorial-plaques', 'polished-brass-210x148-rect-dark-wood-plaque'],
  ['professional-brass-plaques', 'Brass plaques for professional practices', 'brass-plaques', 'brushed-brass-300x200-rect-light-wood-plaque'],
];
const root = path.resolve(process.env.DIST || 'dist');
const site = 'https://instaplaque.co.uk';
const compact = text => text.replace(/\s+/g, ' ').trim();
const docs = new Map();
const page = async route => {
  if (!docs.has(route)) docs.set(route, new JSDOM(await fs.readFile(path.join(root, route, 'index.html'), 'utf8')).window.document);
  return docs.get(route);
};
const sitemap = await fs.readFile(path.join(root, 'sitemap.xml'), 'utf8');
const productSitemap = await fs.readFile(path.join(root, 'sitemap-products.xml'), 'utf8');
const allRoutes = [...(sitemap + productSitemap).matchAll(/<loc>https:\/\/instaplaque.co.uk\/?([^<]*)<\/loc>/g)].map(match => match[1]);
const metadata = [];
for (const slug of allRoutes) {
  // Keep only text for the whole-site uniqueness check; building 200 jsdom windows at once wastes memory.
  const html = await fs.readFile(path.join(root, slug, 'index.html'), 'utf8');
  metadata.push({ slug, title: html.match(/<title>(.*?)<\/title>/s)?.[1], description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] });
}
const vercel = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
const redirects = new Map(vercel.redirects.filter(item => !item.has).map(item => [item.source, item.destination]));
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));
let linksChecked = 0;
for (const [slug, heading, parent, designer] of occasionRoutes) {
  const document = await page(slug);
  assert.equal(document.querySelectorAll('h1').length, 1, `${slug}: one H1`);
  assert.equal(document.querySelector('h1').textContent, heading);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').href, `${site}/${slug}`);
  assert(document.querySelector('[data-prerendered="true"]'), `${slug}: complete static content`);
  assert(sitemap.includes(`<loc>${site}/${slug}</loc>`), `${slug}: sitemap`);
  const own = metadata.find(item => item.slug === slug);
  for (const field of ['title', 'description']) {
    assert(own[field]?.length > 25, `${slug}: useful ${field}`);
    assert.equal(metadata.filter(item => item[field] === own[field]).length, 1, `${slug}: unique ${field}`);
  }
  assert.equal(document.querySelector('meta[property="og:title"]').content, document.title);
  assert.equal(document.querySelector('meta[property="og:description"]').content, document.querySelector('meta[name="description"]').content);
  assert((await page(parent)).querySelector(`a[href="/${slug}"]`), `${slug}: contextual incoming link`);
  assert(document.querySelector(`.shop-breadcrumb a[href="/${parent}"]`), `${slug}: visible parent breadcrumb`);
  assert(document.querySelector(`.cat-hero a[href="/design?plaque=${designer}"]`), `${slug}: no-JS designer preset`);
  const graph = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => {
    const data = JSON.parse(script.textContent);
    assert.equal(data['@context'], 'https://schema.org');
    return data['@graph'] || [data];
  });
  for (const type of ['WebPage', 'CollectionPage', 'BreadcrumbList', 'FAQPage', 'ItemList']) {
    assert.equal(graph.filter(node => node['@type'] === type).length, 1, `${slug}: one ${type}`);
  }
  assert(!graph.some(node => ['Product', 'Review', 'AggregateRating'].includes(node['@type'])), `${slug}: collection, no invented reviews or category offer`);
  const collection = graph.find(node => node['@type'] === 'CollectionPage');
  assert.equal(collection.name, heading);
  const breadcrumb = graph.find(node => node['@type'] === 'BreadcrumbList').itemListElement;
  assert.deepEqual(breadcrumb.map(item => item.position), [1, 2, 3]);
  assert.equal(breadcrumb[1].item, `${site}/${parent}`);
  assert.equal(breadcrumb.at(-1).item, `${site}/${slug}`);
  const body = compact(document.body.textContent);
  const faq = graph.find(node => node['@type'] === 'FAQPage').mainEntity;
  const visibleFaqs = [...document.querySelectorAll('.cat-questions details')].slice(0, faq.length);
  assert.equal(faq.length, 6, `${slug}: three specific and three shared truthful FAQs`);
  faq.forEach((item, i) => {
    assert.equal(compact(visibleFaqs[i].querySelector('summary').textContent).replace(/\+$/, '').trim(), compact(item.name));
    assert.equal(compact(visibleFaqs[i].querySelector('p').textContent), compact(item.acceptedAnswer.text));
  });
  const list = graph.find(node => node['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, list.itemListElement.length);
  const visibleProducts = new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href').slice(1)).filter(link => offers.has(link)));
  assert.deepEqual(new Set(list.itemListElement.map(item => item.url.replace(`${site}/`, ''))), visibleProducts, `${slug}: schema matches linked catalogue`);
  for (const item of document.querySelectorAll('.shop-product-picks li')) {
    const productSlug = item.querySelector('a').getAttribute('href').slice(1);
    assert.equal(Number(item.querySelector('strong').textContent.replace(/[^0-9.]/g, '')), offers.get(productSlug)?.price, `${slug}: actual catalogue pick price`);
  }
  for (const anchor of document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    const url = new URL(href, `${site}/${slug}`);
    let route = url.pathname;
    if (redirects.has(route)) route = redirects.get(route);
    const target = path.join(root, route);
    const stat = await fs.stat(target).catch(() => null);
    assert(stat, `${slug}: broken internal link ${href}`);
    if (stat.isDirectory()) {
      const destination = await page(route);
      if (url.hash) assert(destination.getElementById(decodeURIComponent(url.hash.slice(1))), `${slug}: missing link target ${href}`);
    }
    linksChecked++;
  }
  for (const img of document.querySelectorAll('img')) {
    assert(img.hasAttribute('alt'), `${slug}: image alt`);
    const sources = [img.getAttribute('src'), ...(img.getAttribute('srcset') || '').split(',').filter(Boolean).map(part => part.trim().split(/\s/)[0])];
    for (const src of sources.filter(src => src?.startsWith('/'))) await fs.access(path.join(root, src.split('?')[0]));
  }
  assert(body.includes('5 working days') && body.includes('7 working days') && body.includes('10 working days') && body.includes('15'), `${slug}: shared production estimates`);
  assert(!body.includes('undefined'), `${slug}: no missing copy/data`);
  console.log(`PASS /${slug}: unique metadata, H1, schema parity, catalogue prices, incoming link, designer preset, local links and imagery`);
}
const house = await page('house-name-plaques');
assert([...house.querySelectorAll('a')].some(a => a.textContent.includes('Metal House Signs') && a.href.includes('utm_source=instaplaque')), 'House page directs decorative signs to MHS');
assert((await page('church-plaques')).body.textContent.includes('exceptional-case'), 'Church page discloses restrictions, not presumed permission');
assert((await page('professional-brass-plaques')).querySelectorAll('a[href*="gdc-uk.org"]').length === 2, 'GDC display and advertising guidance both linked');
for (const document of docs.values()) document.defaultView.close();
console.log(`Occasion landing checks passed: 4 pages, ${linksChecked} internal links, catalogue-only products and no legal compliance promise.`);
