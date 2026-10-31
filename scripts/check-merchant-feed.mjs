import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {merchantImageQuery,merchantOffers} from '../services/merchantCatalogue.mjs';
import {studioPhotoPath,studioPhotos} from '../services/studioPhotos.mjs';
const doc=new JSDOM(fs.readFileSync('dist/google-merchant-feed.xml','utf8'),{contentType:'application/xml'}).window.document;
const items=[...doc.querySelectorAll('item')];assert.equal(items.length,merchantOffers.length);
let studioMain=0;
for(const offer of merchantOffers){
 const item=items.find(el=>el.getElementsByTagName('g:id')[0].textContent===offer.offerId);assert(item);
 const get=tag=>item.getElementsByTagName('g:'+tag)[0]?.textContent;
 // Main picture (owner msg 8159): the studio photo where there is one, with the drawing as the first extra picture.
 const drawing='https://instaplaque.co.uk'+offer.image+merchantImageQuery;
 const main=studioPhotos.has(offer.slug)?'https://instaplaque.co.uk'+studioPhotoPath(offer.slug):drawing;
 const extras=[...item.getElementsByTagName('g:additional_image_link')].map(el=>el.textContent);
 assert.equal(Number(get('price').split(' ')[0]),offer.price);assert.equal(get('image_link'),main,'Main image '+offer.slug);
 if(main!==drawing){studioMain++;assert.equal(extras[0],drawing,'Drawing as first extra image '+offer.slug);}
 assert(!extras.includes(main),'Main image repeated as an extra '+offer.slug);
 assert.equal(Number(get('max_handling_time')),offer.productionDays);assert.equal(get('material'),offer.label);
 const html=fs.readFileSync('dist/'+offer.slug+'/index.html','utf8');
 const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const products=schemas.flatMap(s=>s['@graph']||[s]).filter(s=>s['@type']==='Product');
 assert(products.some(p=>Number(p.offers.price)===offer.price&&p.image===main),'Schema '+offer.slug);
 assert(html.includes(offer.image));assert(html.includes(`${offer.productionDays} working days`));
}
console.log('All',items.length,'feed items match built page schema/images/prices/production times;',studioMain,'lead with their studio photo');
