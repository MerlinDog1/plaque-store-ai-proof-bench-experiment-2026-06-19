// Check every generated HTML document, not only the sitemap (which deliberately
// lists fewer URLs than the exact-product catalogue).
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { checkProductPolicies, checkReturnPolicy, checkDigitalOffer, schemaObjects, schemasFromHtml } from './lib/product-policy-checks.mjs';

let productCount = 0;
let pageCount = 0;
const seen = new Set();
for (const file of (await readdir('dist', { recursive: true })).filter(file => file.endsWith('.html'))) {
  const html = await readFile(`dist/${file}`, 'utf8');
  const graph = schemasFromHtml(html);
  const products = checkProductPolicies(graph, file);
  if (products.length) pageCount++;
  productCount += products.length;
  for (const product of products) seen.add(product.offers.url);
  if (file === 'design/index.html') checkDigitalOffer(graph);
  if (file === 'returns-and-cancellations/index.html') {
    const org = [...schemaObjects(graph)].find(item => item['@type'] === 'Organization' && item.hasMerchantReturnPolicy);
    assert.ok(org, 'Publish the standard return policy on its explanatory page');
    checkReturnPolicy(org.hasMerchantReturnPolicy, file);
    assert.ok(html.includes('Your statutory rights are not affected.'));
    assert.ok(html.includes('You do not need to post a faulty or damaged plaque back to us.'));
    assert.ok(html.includes('within 2 working days'));
  }
  if (file === 'how-it-works/index.html') {
    assert.ok(html.includes('We dispatch Monday to Friday using a next-working-day delivery service.'));
    assert.ok(html.includes('Northern Ireland, the Highlands and islands'));
    assert.ok(html.includes('arrival dates are not guaranteed'));
  }
}
for (const variant of merchantOffers) assert.ok(seen.has(`https://instaplaque.co.uk/${variant.slug}`), `Missing variant ${variant.slug}`);
// Product schema belongs on the exact product pages only, not the homepage or category pages
// (Google: a specific product, not a category; owner msg 5231).
assert.equal(pageCount, merchantOffers.length, 'Product schema should appear on exactly the product pages');
assert.equal(productCount, merchantOffers.length, 'One Product per exact product page');
for (const page of ['index.html', 'memorial-plaques/index.html', 'bench-plaques/index.html', 'brass-plaques/index.html', 'stainless-steel-plaques/index.html', 'custom-plaques/index.html', 'garden-plaques/index.html', 'opening-plaques/index.html']) {
  const graph = schemasFromHtml(await readFile(`dist/${page}`, 'utf8'));
  assert.equal([...schemaObjects(graph)].filter(item => item['@type'] === 'Product').length, 0, `No Product schema on ${page}`);
}
// Catalogue pages (review fixes 21 Oct): a photo, a specification, links between variants and a sample proof PDF.
const { existsSync } = await import('node:fs');
for (const offer of merchantOffers) {
  const html = await readFile(`dist/${offer.slug}/index.html`, 'utf8');
  if (offer.imageKind === 'render') {
    const photo = `/site-images/catalogue-photo/${offer.slug}.webp`;
    // Redrawn photos carry ?v=N (services/commerce.ts), so match the path up to any version.
    assert.ok(html.includes(`src="${photo}"`) || html.includes(`src="${photo}?v=`), `Photo on ${offer.slug}`);
    for (const file of [photo, photo.replace('.webp', '-600.webp'), offer.image.replace('/merchant/', '/merchant/thumbs/').replace('.jpg', '.webp')]) assert.ok(existsSync(`dist${file}`), `Missing ${file}`);
  }
  assert.ok(html.includes('class="shop-spec-list"') && html.includes(`${offer.productionDays} working days`), `Specification on ${offer.slug}`);
  assert.ok((html.match(/class="shop-catalogue-links"/g) || []).length >= 1, `Variant links on ${offer.slug}`);
  assert.ok(html.includes(`href="/samples/products/${offer.slug}.pdf?v=10"`) && existsSync(`dist/samples/products/${offer.slug}.pdf`), `Sample proof PDF for ${offer.slug}`);
}
console.log(`Product policies: ${productCount} physical offers across ${pageCount} pages pass shipping, returns, production/transit separation and weekday checks; free designer unchanged. Every product page has its photo, specification, variant links and sample proof.`);
