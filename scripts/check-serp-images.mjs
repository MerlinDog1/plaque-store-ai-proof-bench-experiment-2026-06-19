import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { studioPhotos } from '../services/studioPhotos.mjs';
import { ogImageSlugs } from '../services/shareImages.mjs';
import { stainlessSearchSlug, gardenSearchPhoto, searchImagePath, searchSchemaImages, searchPrimaryImage, studioShareImageFor } from '../services/searchImages.mjs';
const site='https://instaplaque.co.uk';
const manifest=JSON.parse(fs.readFileSync('scripts/serp-studio/manifest.json','utf8'));
export function imageInfo(b) {
  if (b.subarray(0,2).toString('hex')==='ffd8') {
    for(let i=2;i<b.length;) {
      assert.equal(b[i++],255);let marker=b[i++];while(marker===255)marker=b[i++];
      if(marker===0xd9||marker===0xda) break;
      const n=b.readUInt16BE(i);
      if([0xc0,0xc1,0xc2].includes(marker))return {format:'JPEG',width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};
      i+=n;
    }
  }
  if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP') {
    for(let i=12;i+8<b.length;) {const kind=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4),p=i+8;
      if(kind==='VP8X')return {format:'WEBP',width:1+b.readUIntLE(p+4,3),height:1+b.readUIntLE(p+7,3)};
      if(kind==='VP8 ')return {format:'WEBP',width:b.readUInt16LE(p+6)&0x3fff,height:b.readUInt16LE(p+8)&0x3fff};
      i=p+n+(n%2);
    }
  }
  throw new Error('Unsupported or malformed image');
}
const files=new Set();
function checkFile(url,w,h,format) {
  assert.equal(new URL(url).origin,site);const file='dist'+new URL(url).pathname;
  const b=fs.readFileSync(file);assert.deepEqual(imageInfo(b),{format,width:w,height:h},file);
  assert(b.includes('http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'),file+' missing IPTC DigitalSourceType');
  files.add(file);
}
function page(slug) {return new JSDOM(fs.readFileSync(`dist/${slug}/index.html`,'utf8')).window.document;}
function shares(d,slug) {
  const og=d.querySelector('meta[property="og:image"]').content,tw=d.querySelector('meta[name="twitter:image"]').content;
  assert.equal(og,site+studioShareImageFor(slug));assert.equal(og,tw);assert(og.endsWith('.jpg'));
  for(const [key,value] of Object.entries({width:'1200',height:'630',type:'image/jpeg'}))assert.equal(d.querySelector(`meta[property="og:image:${key}"]`)?.content,value);
  assert(d.querySelector('meta[property="og:image:alt"]')?.content.length>20);checkFile(og,1200,630,'JPEG');
}
for(const slug of [stainlessSearchSlug,'garden-plaques']) {
  const d=page(slug);shares(d,slug);
  const graph=[...d.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const j=JSON.parse(s.textContent);return j['@graph']||[j];});
  const entity=graph.find(n=>n['@type']===(slug===stainlessSearchSlug?'Product':'CollectionPage'));
  const images=searchSchemaImages(slug,site);assert.deepEqual(entity.image,images);assert.equal(images.length,3);
  for(const [i,h] of [1200,900,675].entries())checkFile(images[i],1200,h,'WEBP');
  assert.deepEqual(graph.find(n=>n['@type']==='WebPage').primaryImageOfPage,searchPrimaryImage(slug,site));
  const xml=fs.readFileSync('dist/'+(slug===stainlessSearchSlug?'sitemap-products.xml':'sitemap.xml'),'utf8');
  const entry=[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(m=>m[1].includes(`<loc>${site}/${slug}</loc>`))?.[1];
  assert(entry?.includes(`<image:loc>${images[0]}</image:loc>`));assert(entry.includes('<lastmod>2026-11-10</lastmod>'));
  if(slug===stainlessSearchSlug)assert(entry.includes(`/site-images/studio-photo/${slug}.webp`),'Existing stainless sitemap image retained');
}
let studioProducts=0;
for(const offer of merchantOffers) {
  const expected=studioShareImageFor(offer.slug);if(!expected)continue;
  assert(studioPhotos.has(offer.slug));shares(page(offer.slug),offer.slug);studioProducts++;
  assert.equal(expected,searchImagePath(offer.slug,'og'),'Product uses own photo');
}
for(const slug of ogImageSlugs) {
  assert.notEqual(slug,'garden-plaques');const d=page(slug);
  assert.equal(d.querySelector('meta[property="og:image"]').content,`${site}/site-images/og/og-${slug}.jpg`);
  assert.equal(d.querySelector('meta[name="twitter:image"]').content,`${site}/site-images/og/og-${slug}.jpg`);
}
for(const row of manifest) {
  assert(row.scale<=1&&row.minimumMargin>=.06,row.file+' downscale and margin');
  checkFile(site+'/site-images/search/'+row.file,row.width,row.height,row.format);
  if(row.sourceFrame){const [x,y,w,h]=row.sourceFrame;assert(x>=.06*row.width&&y>=.06*row.height&&x+w<=.94*row.width&&y+h<=.94*row.height,row.file+' full source frame margin');}
}
assert.equal(files.size,manifest.length);
const padded=manifest.filter(r=>r.version==='og'&&r.treatment==='pad').map(r=>r.slug);
console.log(JSON.stringify({pass:true,studioProducts,files:files.size,paddedPhotos:padded.length,paddedSlugs:padded,otherBrandedCategories:ogImageSlugs.length},null,2));
