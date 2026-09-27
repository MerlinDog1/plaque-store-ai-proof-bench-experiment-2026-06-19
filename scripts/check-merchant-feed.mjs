import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {merchantOffers} from '../services/merchantCatalogue.mjs';
const doc=new JSDOM(fs.readFileSync('dist/google-merchant-feed.xml','utf8'),{contentType:'application/xml'}).window.document;
const items=[...doc.querySelectorAll('item')];assert.equal(items.length,merchantOffers.length);
for(const offer of merchantOffers){
 const item=items.find(el=>el.getElementsByTagName('g:id')[0].textContent==='instaplaque-'+offer.slug);assert(item);
 const get=tag=>item.getElementsByTagName('g:'+tag)[0]?.textContent;
 assert.equal(Number(get('price').split(' ')[0]),offer.price);assert.equal(get('image_link'),'https://instaplaque.co.uk'+offer.image);
 assert.equal(Number(get('max_handling_time')),offer.productionDays);assert.equal(get('material'),offer.label);
 const html=fs.readFileSync('dist/'+offer.slug+'/index.html','utf8');
 const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const products=schemas.flatMap(s=>s['@graph']||[s]).filter(s=>s['@type']==='Product');
 assert(products.some(p=>Number(p.offers.price)===offer.price&&p.image==='https://instaplaque.co.uk'+offer.image),'Schema '+offer.slug);
 assert(html.includes(offer.image));assert(html.includes(`${offer.productionDays} working days`));
}
console.log('All',items.length,'feed items match built page schema/images/prices/production times');
