import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const origin = 'https://instaplaque.co.uk';
const html = await readFile('dist/design/index.html', 'utf8');
const document = new JSDOM(html).window.document;
const guide = document.querySelector('#plaque-design-guide');
assert.ok(guide, 'The actual /design HTML must contain the guide before JavaScript runs');
assert.equal(document.querySelectorAll('h1').length, 1);
assert.match(document.querySelector('h1').textContent, /design your own plaque online/i);
assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1);
assert.equal(document.querySelector('link[rel="canonical"]').href, `${origin}/design`);
assert.match(document.querySelector('meta[name="robots"]').content, /index,follow/);
assert.equal(document.querySelector('meta[property="og:url"]').content, `${origin}/design`);
assert.equal(document.querySelector('meta[property="og:title"]').content, document.title);
assert.equal(document.querySelector('meta[name="twitter:title"]').content, document.title);
assert.equal(document.querySelector('meta[property="og:description"]').content, document.querySelector('meta[name="description"]').content);
assert.ok(guide.textContent.trim().split(/\s+/u).length > 400, 'Initial HTML must include the useful guidance, not just a placeholder');
assert.equal(guide.querySelectorAll('.designer-guide-faqs details').length, 5);
assert.ok(guide.querySelector('.designer-guide-more > summary'), 'The longer design tips must remain available as a disclosure');
for (const details of guide.querySelectorAll('.designer-guide-faqs details')) {
  assert.ok(details.querySelector('summary').textContent.trim());
  assert.ok(details.querySelector('p').textContent.trim().length > 60, 'Answers must be present without expanding a client-only widget');
}

for (const anchor of guide.querySelectorAll('a[href^="/"]')) {
  const route = anchor.getAttribute('href');
  if (route === '/design-request') continue; // Existing dynamic route, not prerendered.
  await access(`dist${route === '/' ? '' : route}/index.html`);
}
const images = [...guide.querySelectorAll('img')];
assert.equal(images.length, 3);
for (const img of images) {
  assert.ok(img.alt.length > 30, 'Example images need meaningful descriptions');
  assert.ok(Number(img.width) > 0 && Number(img.height) > 0, 'Reserve image space to avoid layout shift');
  assert.equal(img.getAttribute('loading'), 'lazy', 'Below-the-designer examples should not compete with the workbench');
  await access(`dist${img.getAttribute('src')}`);
}

const graph = JSON.parse(document.querySelector('#instaplaque-prerender-route-schema').textContent)['@graph'];
const app = graph.find(item => item['@type'] === 'WebApplication');
assert.equal(app.url, `${origin}/design`);
assert.equal(app.isAccessibleForFree, true);
assert.match(app.offers.name, /design and proof/i, 'The free offer must describe the tool, not a free physical plaque');
assert.equal(graph.filter(item => item['@type'] === 'BreadcrumbList').length, 1);
assert.equal(graph.find(item => item['@type'] === 'BreadcrumbList').itemListElement.at(-1).item, `${origin}/design`);
assert.ok(!graph.some(item => item['@type'] === 'Product'), 'The designer is not a priced physical product');
const sitemap = new JSDOM(await readFile('dist/sitemap.xml', 'utf8'), { contentType: 'application/xml' }).window.document;
const designEntries = [...sitemap.querySelectorAll('url')].filter(item => item.querySelector('loc').textContent === `${origin}/design`);
assert.equal(designEntries.length, 1);
for (const img of images) assert.ok(designEntries[0].textContent.includes(`${origin}${img.getAttribute('src')}`));
console.log('PASS designer SEO: crawlable guidance/FAQs/images, working internal destinations, canonical and metadata, honest application/breadcrumb schema, image sitemap');
