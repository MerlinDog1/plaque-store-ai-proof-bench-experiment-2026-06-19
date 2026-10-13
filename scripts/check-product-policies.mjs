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
assert.ok(pageCount >= merchantOffers.length + 6, 'Cover homepage, families and all exact-product pages');
assert.ok(productCount >= merchantOffers.length * 2, 'Check home catalogue offers as well as standalone product pages');
console.log(`Product policies: ${productCount} physical offers across ${pageCount} pages pass shipping, returns, production/transit separation and weekday checks; free designer unchanged.`);
