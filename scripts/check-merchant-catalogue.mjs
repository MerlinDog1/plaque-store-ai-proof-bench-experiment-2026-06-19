import assert from 'node:assert/strict';
import fs from 'node:fs';
import { merchantOffers, merchantFinishes, merchantFormats } from '../services/merchantCatalogue.mjs';
import { estimatePlaquePrice, getCheckoutQuoteReasons } from '../services/checkoutPolicy.mjs';
const ids = new Set(), configurations = new Set();
for (const offer of merchantOffers) {
  assert(offer.offerId.length <= 50, 'ID too long '+offer.offerId);
  assert(!ids.has(offer.offerId), `Duplicate ID ${offer.offerId}`);ids.add(offer.offerId);
  const config = JSON.stringify(offer.preset); assert(!configurations.has(config), `Duplicate configuration ${offer.slug}`); configurations.add(config);
  assert.equal(offer.price, estimatePlaquePrice(offer.preset));assert.deepEqual(getCheckoutQuoteReasons(offer.preset),[]);
  assert(fs.existsSync('public'+offer.image),'Missing image '+offer.slug);
  assert([5,7,10,15].includes(offer.productionDays));
  assert.equal(offer.preset.width===offer.preset.height || offer.preset.shape!=='circle',true);
  if(offer.preset.shape==='rect' && Math.min(offer.preset.width,offer.preset.height)<=90 && Math.max(offer.preset.width,offer.preset.height)/Math.min(offer.preset.width,offer.preset.height)>=3){assert(!offer.preset.wood);assert.equal(offer.preset.fixingHoleCount,2);assert(offer.preset.safeMargin>=10)}
}
for(const [material] of merchantFinishes)for(const [width,height] of merchantFormats)assert(merchantOffers.some(o=>o.preset.material===material&&o.preset.width===width&&o.preset.height===height&&!o.preset.wood));
console.log(`${merchantOffers.length} unique purchasable offers: price, image, coverage and bench rules pass.`);
