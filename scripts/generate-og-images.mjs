// Renders the branded share images listed in services/shareImages.mjs into public/site-images/og/.
// Usage: node scripts/generate-og-images.mjs  (Chrome from CHROME_PATH or /opt/google/chrome/chrome)
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { ogImageSlugs } from '../services/shareImages.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const server = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { productFamilies, seoLandingPages } = await server.ssrLoadModule('/services/commerce.ts');
await server.close();

// Same photos and H1s as the page heroes (Shopfront collections / materialProductImages).
const heroPhotos = {
  'memorial-plaques': '/site-images/home-gallery-aged-brass-wood.webp', 'bench-plaques': '/site-images/home-gallery-brass-bench.webp',
  'garden-plaques': '/site-images/home-carousel-garden-brass.webp', 'opening-plaques': '/site-images/home-gallery-brass-community.webp',
  'brass-plaques': '/site-images/home-gallery-brass-community.webp', 'stainless-steel-plaques': '/site-images/home-gallery-oval-steel.webp',
};
const heroTitles = {
  'memorial-plaques': 'Personalised memorial plaques', 'bench-plaques': 'Personalised bench plaques', 'brass-plaques': 'Personalised brass plaques',
  'stainless-steel-plaques': 'Personalised stainless steel plaques', 'garden-plaques': 'Personalised garden plaques',
};
const taglines = {
  'memorial-plaques': 'Remember them in your own words.', 'bench-plaques': 'A small place for a lasting memory.',
  'garden-plaques': 'A dedication for a favourite place.', 'opening-plaques': 'Mark the occasion clearly.',
};
// Pages outside the catalogue (owner msg 5178).
const featureCards = {
  'portrait-plaques': { title: 'Personalised portrait plaques', tagline: 'A favourite face, engraved in metal.', photo: '/site-images/portraits/pim-millie-plaque.webp', position: 'center 18%', kicker: 'Free portrait sketch · Made in the UK' },
  'ai-plaque-design': { title: 'Turn your AI design into a real plaque', tagline: 'Your concept, engraved in metal.', photos: ['/site-images/ai/ai-concept-memorial-640.webp', '/site-images/ai/ai-real-memorial-640.webp'] },
};
const pages = [{ slug: 'home', title: 'Personalised brass & stainless steel plaques', tagline: 'Some words deserve to stay.', photo: '/site-images/home-gallery-brass-bench.webp' }];
for (const slug of ogImageSlugs) {
  if (featureCards[slug]) { pages.push({ slug, ...featureCards[slug] }); continue; }
  const item = productFamilies.find(p => p.slug === slug) || seoLandingPages.find(l => l.slug === slug);
  if (!item) throw new Error(`No catalogue page for ${slug}`);
  pages.push({ slug, title: heroTitles[slug] || item.title, tagline: taglines[slug] || 'Engraved with your words, made to order and delivered.', photo: heroPhotos[slug] || item.image });
}
const mime = file => ({ '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[path.extname(file).toLowerCase()];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const outDir = path.resolve('public/site-images/og');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  const dataUrl = async file => `data:${mime(file)};base64,${(await readFile(path.join('public', file))).toString('base64')}`;
  const left = p.photos
    ? `<div style="width:630px;height:630px;position:relative;background:#e9eadf">
        <div style="position:absolute;left:28px;top:30px;font:700 15px Arial;letter-spacing:.12em;color:#203b32">AI CONCEPT</div>
        <img src="${await dataUrl(p.photos[0])}" style="position:absolute;left:28px;top:60px;width:336px;height:336px;object-fit:cover;box-shadow:0 10px 30px rgba(0,0,0,.25)">
        <img src="${await dataUrl(p.photos[1])}" style="position:absolute;left:262px;top:250px;width:336px;height:336px;object-fit:cover;border:8px solid #fff;box-shadow:0 14px 34px rgba(0,0,0,.3)">
        <div style="position:absolute;left:28px;top:428px;font:700 15px Arial;letter-spacing:.12em;color:#203b32">REAL PLAQUE →</div>
      </div>`
    : `<div style="width:630px;height:630px;background:#c0c1ad url('${await dataUrl(p.photo)}') ${p.position || 'center'}/cover no-repeat"></div>`;
  const size = p.title.length > 36 ? 50 : 56;
  await page.setContent(`<!doctype html><html><body style="margin:0">
  <div style="width:1200px;height:630px;display:flex;background:#203b32;font-family:Arial,Helvetica,sans-serif">
    ${left}
    <div style="flex:1;box-sizing:border-box;padding:52px 50px 48px;display:flex;flex-direction:column;justify-content:space-between;color:#f8f6ef">
      <div style="font-size:34px;letter-spacing:-1px"><b>Insta</b><span style="color:#d4bd78">Plaque</span></div>
      <div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:${size}px;line-height:1.05;letter-spacing:-0.03em">${esc(p.title)}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:27px;line-height:1.25;color:#d4bd78;margin-top:18px">${esc(p.tagline)}</div>
      </div>
      <div><div style="font-size:15px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#cfd8cf">${p.kicker || 'Free proof · UK delivery included'}</div>
        <div style="font-size:21px;margin-top:8px">instaplaque.co.uk</div></div>
    </div>
  </div></body></html>`, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(outDir, `og-${p.slug}.jpg`), type: 'jpeg', quality: 84 });
  console.log(`og-${p.slug}.jpg`, p.title);
}
await browser.close();
