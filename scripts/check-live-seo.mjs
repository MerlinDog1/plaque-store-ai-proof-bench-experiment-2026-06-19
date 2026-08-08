import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const [vercelRaw, sitemap, home, robots] = await Promise.all([
  read('vercel.json'),
  read('dist/sitemap.xml'),
  read('dist/index.html'),
  read('dist/robots.txt'),
]);
const vercel = JSON.parse(vercelRaw);
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/instaplaque\.co\.uk\/[^<]*)<\/loc>/g)].map((match) => match[1]);
const redirectedPaths = new Set([
  '/a4-plaques',
  '/a5-plaques',
  '/ashes-scattering-plaques',
  '/commemorative-plaques',
  '/donor-plaques',
  '/engraved-plaques',
  '/memorial-bench-plaques',
  '/pet-memorial-plaques',
  '/school-opening-plaques',
  '/tree-plaques',
]);

assert(sitemapUrls.length === 18, `Expected 18 focused sitemap URLs, found ${sitemapUrls.length}`);
for (const url of sitemapUrls) {
  assert(!redirectedPaths.has(new URL(url).pathname), `Redirected URL remains in sitemap: ${url}`);
}

const wwwRedirect = vercel.redirects?.find((redirect) =>
  redirect.source === '/:path*'
  && redirect.has?.some((entry) => entry.type === 'host' && entry.value === 'www.instaplaque.co.uk'));
assert(wwwRedirect?.permanent === true, 'Missing permanent www-to-apex redirect');
for (const source of redirectedPaths) {
  assert(vercel.redirects?.some((redirect) => redirect.source === source && redirect.permanent === true), `Missing permanent consolidation redirect: ${source}`);
}

assert(home.includes('data-prerendered="true"'), 'Homepage is missing crawlable prerendered content');
assert(home.includes('<h1>Custom Plaques Made Simple</h1>'), 'Homepage prerendered H1 is missing');
assert(home.includes('rel="canonical" href="https://instaplaque.co.uk/"'), 'Homepage canonical is missing');
assert(home.includes('hreflang="en-GB" href="https://instaplaque.co.uk/"'), 'Homepage en-GB alternate is missing');
assert(home.includes('plaque-hero-memorial-wall-mobile.webp'), 'Mobile LCP image preload is missing');
assert(home.includes('plaque-hero-memorial-wall-desktop.webp'), 'Desktop LCP image preload is missing');
assert(robots.includes('Sitemap: https://instaplaque.co.uk/sitemap.xml'), 'robots.txt sitemap declaration is missing');

for (const route of ['memorial-plaques', 'bench-plaques', 'brass-plaques', 'stainless-steel-plaques', 'custom-plaques', 'garden-plaques', 'opening-plaques']) {
  const routeHtml = await read(`dist/${route}/index.html`);
  assert(routeHtml.includes('data-prerendered="true"'), `Missing crawlable HTML for /${route}`);
  assert(routeHtml.includes(`rel="canonical" href="https://instaplaque.co.uk/${route}"`), `Bad canonical for /${route}`);
}

for (const route of redirectedPaths) {
  const output = path.join(root, 'dist', route.slice(1), 'index.html');
  let exists = true;
  try {
    await access(output);
  } catch {
    exists = false;
  }
  assert(!exists, `Redirected route was still prerendered: ${route}`);
}

console.log('Live SEO checks passed: 18 sitemap URLs, focused redirects, static route HTML, canonicals and LCP preloads.');
