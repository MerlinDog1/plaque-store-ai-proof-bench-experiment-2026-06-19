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
  '/quote',
  '/school-opening-plaques',
  '/tree-plaques',
]);

assert(sitemapUrls.length === 29 && ['design-request', 'video', 'portrait-plaques', 'ai-plaque-design', 'tree-memorial-plaques', 'plaque-sizes', 'memorial-plaque-wording', 'house-name-plaques', 'donor-recognition-plaques', 'church-plaques', 'professional-brass-plaques'].every(slug => sitemapUrls.includes(`https://instaplaque.co.uk/${slug}`)), `Expected the public sitemap including design requests, portrait plaques and AI design, found ${sitemapUrls.length}`);
const productSitemap = await read('dist/sitemap-products.xml');
const productUrls = [...productSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const { merchantOffers } = await import('../services/merchantCatalogue.mjs');
assert(productUrls.length === merchantOffers.length && new Set(productUrls).size === productUrls.length, 'Product sitemap must cover each exact catalogue URL once');
for (const offer of merchantOffers) {
  assert(productUrls.includes(`https://instaplaque.co.uk/${offer.slug}`), `Missing product sitemap URL ${offer.slug}`);
  await access(path.join(root, 'dist', offer.slug, 'index.html'));
}
for (const slug of ['design-request', 'privacy', 'cookies']) {
  const html = await read(`dist/${slug}/index.html`);
  assert(html.includes(`rel="canonical" href="https://instaplaque.co.uk/${slug}"`), `Wrong ${slug} canonical`);
  assert(slug === 'design-request' ? html.includes('Leave the layout to us.') : html.includes('PostHog'), `Missing full ${slug} page content`);
}
assert(robots.includes('sitemap-products.xml'), 'Product sitemap must be advertised in robots.txt');
for (const url of sitemapUrls) {
  assert(!redirectedPaths.has(new URL(url).pathname), `Redirected URL remains in sitemap: ${url}`);
}

const wwwRedirect = vercel.redirects?.find((redirect) =>
  redirect.source === '/:path*'
  && redirect.has?.some((entry) => entry.type === 'host' && entry.value === 'www.instaplaque.co.uk'));
assert(wwwRedirect?.permanent === true, 'Missing permanent www-to-apex redirect');
const wwwRootRedirect = vercel.redirects?.find((redirect) =>
  redirect.source === '/'
  && redirect.has?.some((entry) => entry.type === 'host' && entry.value === 'www.instaplaque.co.uk'));
assert(wwwRootRedirect?.destination === 'https://instaplaque.co.uk/' && wwwRootRedirect.permanent === true, 'Missing permanent www root redirect');
for (const source of redirectedPaths) {
  assert(vercel.redirects?.some((redirect) => redirect.source === source && redirect.permanent === true), `Missing permanent consolidation redirect: ${source}`);
}

assert(home.includes('data-prerendered="true"'), 'Homepage is missing crawlable prerendered content');
assert(home.includes('<h1 class="shop-hero-title">Personalised brass &amp; stainless steel plaques</h1>') && home.includes('Some words deserve to <em>stay.</em>'), 'Homepage must render the descriptive H1 and its tagline');
assert(home.includes('Find your plaque.') && home.includes('Your words. Your approval.'), 'Homepage is missing visible catalogue or buying guidance');
assert(home.includes('from £58.50'), 'Homepage is missing its visible starting price');
assert(home.includes('rel="canonical" href="https://instaplaque.co.uk/"'), 'Homepage canonical is missing');
assert(home.includes('hreflang="en-GB" href="https://instaplaque.co.uk/"'), 'Homepage en-GB alternate is missing');
// The hero's picture is the promo film (owner msg 6986), with its poster in the static HTML.
assert(home.includes('class="promo-film-player"') && home.includes('poster="/videos/instaplaque-design-in-seconds-20261028-poster.webp"'), 'Shop hero film is missing');
assert(robots.includes('Sitemap: https://instaplaque.co.uk/sitemap.xml'), 'robots.txt sitemap declaration is missing');

for (const route of ['about', 'memorial-plaques', 'bench-plaques', 'brass-plaques', 'stainless-steel-plaques', 'custom-plaques', 'garden-plaques', 'opening-plaques', 'portrait-plaques', 'ai-plaque-design', 'video', 'tree-memorial-plaques', 'plaque-sizes', 'memorial-plaque-wording', 'house-name-plaques', 'donor-recognition-plaques', 'church-plaques', 'professional-brass-plaques']) {
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

const portraits = await read('dist/portrait-plaques/index.html');
assert(portraits.includes('<h1>Personalised portrait plaques</h1>') && portraits.includes('"@type":"FAQPage"') && portraits.includes('Can you make a plaque from a photo of my pet?'), 'Portrait plaques page needs its H1, visible FAQs and FAQ schema');
const aiDesign = await read('dist/ai-plaque-design/index.html');
assert(aiDesign.includes('<h1>Turn your AI design into a real plaque</h1>') && aiDesign.includes('"@type":"FAQPage"') && aiDesign.includes('Can you make a real plaque from a ChatGPT design?'), 'AI design page needs its H1, visible FAQs and FAQ schema');
assert(home.includes('href="/portrait-plaques"') && home.includes('href="/ai-plaque-design"'), 'Homepage must link to the portrait and AI design pages');
// The promo film's watch page (owner msg 6988): the video in the static HTML, a complete VideoObject (no FAQPage: it shows
// none), Open Graph video tags, the video sitemap entry, crawlable thumbnails, and links from the pages that show the film.
const { promoVideo } = await import('../services/promoVideo.mjs');
const site = 'https://instaplaque.co.uk';
const watch = await read('dist/video/index.html');
const watchGraph = JSON.parse(watch.match(/<script type="application\/ld\+json" id="instaplaque-prerender-route-schema">(.*?)<\/script>/s)?.[1] || '{}')['@graph'] || [];
const videoObject = watchGraph.find(node => node['@type'] === 'VideoObject');
assert(videoObject
  && videoObject.name === promoVideo.name
  && videoObject.description.startsWith(promoVideo.description)
  && videoObject.uploadDate === promoVideo.uploadDate
  && videoObject.duration === `PT${promoVideo.seconds}S`
  && videoObject.contentUrl === site + promoVideo.file
  && videoObject.thumbnailUrl?.[0] === site + promoVideo.thumbnails.wide
  && videoObject.thumbnailUrl.length === 4
  && videoObject.transcript?.includes('Margaret Rose'), 'Watch page VideoObject is missing or incomplete');
assert(!watchGraph.some(node => node['@type'] === 'FAQPage') && watchGraph.some(node => node['@type'] === 'BreadcrumbList'), 'Watch page must have a breadcrumb and no FAQPage');
assert(watch.includes('<h1 id="watch-heading">Design your plaque in seconds</h1>') && watch.includes(`src="${promoVideo.file}"`) && watch.includes('What’s in the video.'), 'Watch page must render its heading, the video source and the written version');
assert(watch.includes(`<meta property="og:video" content="${site}${promoVideo.file}" />`) && watch.includes(`<meta property="og:image" content="${site}${promoVideo.thumbnails.wide}" />`), 'Watch page Open Graph video and image are missing');
assert(sitemap.includes('xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"')
  && sitemap.includes(`<loc>${site}/video</loc>\n    <lastmod>2026-10-28</lastmod>\n    <video:video>`)
  && sitemap.includes(`<video:thumbnail_loc>${site}${promoVideo.thumbnails.wide}</video:thumbnail_loc>`)
  && sitemap.includes(`<video:content_loc>${site}${promoVideo.file}</video:content_loc>`), 'Video sitemap entry is missing');
for (const file of [promoVideo.file, promoVideo.poster, ...Object.values(promoVideo.thumbnails)]) await access(path.join(root, 'dist', file));
assert(!/^Disallow: \/videos/m.test(robots), 'robots.txt must let Google fetch the video and its thumbnails');
for (const route of ['', 'memorial-plaques', 'brass-plaques']) {
  assert((await read(`dist/${route ? `${route}/` : ''}index.html`)).includes('href="/video"'), `/${route} must link to the watch page`);
}
console.log('Live SEO checks passed: 26 editorial URLs and 175 exact product URLs, focused redirects, static route HTML, canonicals and LCP preloads, and the video watch page with its VideoObject and video sitemap entry.');
