// Last build step, after prerender-product-pages.mjs: speed and search fixes applied to every built page
// (PageSpeed and Rich Results review, 26 Oct 2026). Each change asserts the markup it expects, so the build fails
// loudly instead of shipping a half-applied page if index.html or the prerender output changes shape.
//
// 1. Site fonts: the render-blocking fonts.googleapis.com stylesheet (two extra connections before first paint) is
//    replaced by inline @font-face rules for the same families, served from the Fontsource 5.3.0 files the designer
//    already uses (variable versions, latin and latin-ext; font-display: swap).
// 2. Favicon: a data: URI favicon can't be crawled, so Google Search showed a generic globe. Real files instead.
// 3. Structured data (Rich Results review): the Organization gets a logo, a customer-service contact point and the
//    store-wide return policy; every product page's Product gets its Merchant Center offer ID (sku), size and colour,
//    and joins a ProductGroup that mirrors the feed's item_group_id, so Google can show the sizes and metals as variants
//    of one product (multi-page variants: other variants are listed by URL); pages without breadcrumbs get one; and
//    category pages list the exact products they link to as an ItemList.
// 4. Cookie banner: rendered only by React, it appeared after the whole app bundle and, as the largest text block on
//    a phone, became the Largest Contentful Paint (6.2 s on PageSpeed mobile). MetaConsent's own markup is now in
//    the static HTML, removed before paint when a choice is stored (or on admin views, where the app never shows it).
//    Its buttons work before the app loads, storing exactly what MetaConsent's choose() stores; the app then replaces
//    #root, this copy included, and shows its own identical banner only while no choice is stored.
// 5. The app script starts after first contentful paint (one frame where paint timing is unsupported; at most 3 s).
//    As a head module script it could run before the first frame, so React, not the static HTML, painted the page's
//    largest element and LCP waited for the whole bundle. The static HTML is complete and its links work.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { merchantReturnPolicy } from '../services/merchantPolicies.mjs';

const distDir = path.resolve('dist');
const site = 'https://instaplaque.co.uk';

const renderer = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
let MetaConsent, keys;
try {
  MetaConsent = (await renderer.ssrLoadModule('/components/MetaConsent.tsx')).MetaConsent;
  const metaPixel = await renderer.ssrLoadModule('/services/metaPixel.ts');
  const posthog = await renderer.ssrLoadModule('/services/posthogAnalytics.ts');
  keys = { meta: metaPixel.META_CONSENT_KEY, changed: metaPixel.OPTIONAL_AD_CONSENT_CHANGED, analytics: posthog.ANALYTICS_CONSENT_KEY, replay: posthog.REPLAY_CONSENT_KEY };
} finally {
  await renderer.close();
}
if (!Object.values(keys).every(Boolean)) throw new Error('Consent storage keys not found');

const fontBase = 'https://cdn.jsdelivr.net/npm/@fontsource-variable';
const latin = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const latinExt = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const face = (family, pkg, style, weights) => [['latin-ext', latinExt], ['latin', latin]].map(([subset, range]) =>
  `    @font-face { font-family: '${family}'; font-style: ${style}; font-display: swap; font-weight: ${weights}; src: url(${fontBase}/${pkg}@5.3.0/files/${pkg}-${subset}-wght-${style}.woff2) format('woff2'); unicode-range: ${range}; }`).join('\n');
const fontBlock = `
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <style>
${face('Montserrat', 'montserrat', 'normal', '100 900')}
${face('Playfair Display', 'playfair-display', 'normal', '400 900')}
${face('Playfair Display', 'playfair-display', 'italic', '400 900')}
  </style>`;
const googleFonts = /\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\s*<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"\s+rel="stylesheet" \/>/;
const dataIcon = /<link rel="icon" href="data:image\/svg\+xml[^"]*" \/>/;
const iconLinks = '<link rel="icon" href="/favicon.ico" sizes="48x48" />\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />\n  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />';
const logo = { '@type': 'ImageObject', url: `${site}/site-images/brand/instaplaque-logo-512.png`, width: 512, height: 512 };
const offersById = new Map(merchantOffers.map(offer => [`${site}/${offer.slug}#product`, offer]));
const offersBySlug = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const contactPoint = { '@type': 'ContactPoint', contactType: 'customer service', telephone: '+447464843841', email: 'hello@instaplaque.co.uk', areaServed: 'GB', availableLanguage: 'en-GB' };

// Product groups exactly as the Merchant Center feed groups them (offer.groupId = item_group_id).
const groupNames = {
  'plaque-rect-screws-metal': 'Personalised rectangular metal plaque with screw fixings',
  'plaque-rect-caps-metal': 'Personalised rectangular metal plaque with decorative fixing caps',
  'plaque-rect-caps-dark': 'Personalised rectangular metal plaque on dark wood backing',
  'plaque-rect-caps-light': 'Personalised rectangular metal plaque on light wood backing',
  'plaque-oval-caps-metal': 'Personalised oval metal plaque',
  'plaque-circle-caps-metal': 'Personalised circular metal plaque',
};
const groups = new Map();
for (const offer of merchantOffers) {
  if (!groupNames[offer.groupId]) throw new Error(`No ProductGroup name for ${offer.groupId}`);
  if (!groups.has(offer.groupId)) groups.set(offer.groupId, []);
  groups.get(offer.groupId).push(offer);
}
const variesBy = members => [['size', o => o.size], ['material', o => o.label], ['color', o => o.colour]]
  .filter(([, value]) => new Set(members.map(value)).size > 1).map(([property]) => `https://schema.org/${property}`);
const productGroup = (offer, productId) => {
  const members = groups.get(offer.groupId);
  return {
    '@type': 'ProductGroup',
    '@id': `${site}/#product-group-${offer.groupId}`,
    name: groupNames[offer.groupId],
    description: `${groupNames[offer.groupId]}, engraved with your own wording, in a choice of ${members.length > 6 ? 'sizes and metals' : 'metals'}. Free online proof before payment; UK delivery included.`,
    brand: { '@type': 'Brand', name: 'InstaPlaque' },
    productGroupID: offer.groupId,
    variesBy: variesBy(members),
    hasVariant: members.map(member => member.slug === offer.slug ? { '@id': productId } : { url: `${site}/${member.slug}` }),
  };
};

const decode = text => text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const pageHeading = html => {
  const root = html.slice(html.indexOf('<div id="root">'));
  const match = root.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return match ? decode(match[1]) : '';
};
const linkedProducts = html => {
  const root = html.slice(html.indexOf('<div id="root">'));
  const slugs = [];
  for (const [, slug] of root.matchAll(/<a[^>]*href="\/([a-z0-9-]+)"/g)) if (offersBySlug.has(slug) && !slugs.includes(slug)) slugs.push(slug);
  return slugs;
};

const bannerMarkup = renderToStaticMarkup(React.createElement(MetaConsent));
if (!bannerMarkup.startsWith('<section role="dialog"')) throw new Error('MetaConsent markup changed: update the static cookie banner');
const j = JSON.stringify;
const staticBanner = bannerMarkup.replace('<section role="dialog"', '<section id="static-cookie-banner" role="dialog"')
  + `<script>(function(){var b=document.getElementById('static-cookie-banner');if(!b)return;`
  + `var q=new URLSearchParams(location.search);if(/^\\/admin(\\/|$)/.test(location.pathname)||q.get('view')==='admin'){b.remove();return;}`
  + `try{var m=localStorage.getItem(${j(keys.meta)});var a=localStorage.getItem(${j(keys.analytics)})||(m==='no'?'no':null);if(m!==null&&a!==null){b.remove();return;}}catch(e){}`
  + `function choose(allow){var v=allow?'yes':'no';try{localStorage.setItem(${j(keys.analytics)},v);localStorage.setItem(${j(keys.replay)},v);localStorage.setItem(${j(keys.meta)},v);}catch(e){}`
  + `window.dispatchEvent(new Event(${j(keys.changed)}));b.remove();}`
  + `var x=b.querySelectorAll('button');x[0].addEventListener('click',function(){choose(true);});x[1].addEventListener('click',function(){choose(false);});})();</script>`;

const appScript = /\s*<script type="module" crossorigin src="(\/assets\/index-[\w-]+\.js)"><\/script>/;
const appBoot = src => `<script>(function(){var started=false;function go(){if(started)return;started=true;var s=document.createElement('script');s.type='module';s.crossOrigin='anonymous';s.src=${j(src)};document.head.appendChild(s);}`
  + `function afterPaint(){if(document.visibilityState==='hidden'){go();return;}setTimeout(go,3000);`
  + `try{new PerformanceObserver(function(l){if(l.getEntriesByName('first-contentful-paint').length)setTimeout(go,0);}).observe({type:'paint',buffered:true});}`
  + `catch(e){requestAnimationFrame(function(){setTimeout(go,0);});}}`
  + `if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',afterPaint);}else{afterPaint();}})();</script>`;

const replaceOnce = (html, pattern, replacement, what, file) => {
  const matches = html.match(new RegExp(pattern.source, 'g')) || [];
  if (matches.length !== 1) throw new Error(`${file}: expected one ${what}, found ${matches.length}`);
  return html.replace(pattern, replacement);
};
const editJsonLd = (html, id, edit, file) => replaceOnce(html,
  new RegExp(`(<script type="application/ld\\+json" id="${id}">)([\\s\\S]*?)(</script>)`),
  (_, open, body, close) => `${open}${edit(JSON.parse(body), body)}${close}`, `${id} schema`, file);

const pages = [];
const walk = async dir => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'assets') await walk(full);
    else if (entry.name === 'index.html') pages.push(full);
  }
};
await walk(distDir);

let skus = 0, breadcrumbs = 0, itemLists = 0;
for (const file of pages) {
  const name = path.relative(distDir, file);
  let html = await readFile(file, 'utf8');
  html = replaceOnce(html, googleFonts, fontBlock, 'Google Fonts block', name);
  html = replaceOnce(html, dataIcon, iconLinks, 'data: favicon', name);
  html = editJsonLd(html, 'instaplaque-site-schema', schema => {
    const org = schema['@graph'].find(node => node['@type'] === 'Organization');
    if (!org) throw new Error(`${name}: no Organization in site schema`);
    org.logo = logo;
    org.contactPoint = contactPoint;
    org.hasMerchantReturnPolicy = merchantReturnPolicy;
    return `\n${JSON.stringify(schema, null, 2)}\n  `;
  }, name);
  if (html.includes('id="instaplaque-prerender-route-schema"')) {
    html = editJsonLd(html, 'instaplaque-prerender-route-schema', (schema) => {
      const graph = schema['@graph'];
      const webPage = graph.find(node => node['@type'] === 'WebPage');
      const pageUrl = webPage?.url || '';
      const product = graph.find(node => node['@type'] === 'Product');
      if (product) {
        const offer = offersById.get(product['@id']);
        if (!offer) throw new Error(`${name}: no Merchant Center offer for ${product['@id']}`);
        // sku: the Merchant Center offer ID, so Google can match this page's Product to the feed item.
        const { '@type': type, '@id': id, name: productName, ...rest } = product;
        graph[graph.indexOf(product)] = { '@type': type, '@id': id, name: productName, sku: offer.offerId, ...rest,
          size: offer.size, color: offer.colour, isVariantOf: { '@id': `${site}/#product-group-${offer.groupId}` } };
        graph.push(productGroup(offer, id));
        skus++;
      }
      const isHome = pageUrl === `${site}/`;
      if (!isHome && !graph.some(node => node['@type'] === 'BreadcrumbList')) {
        const heading = pageHeading(html) || (webPage?.name || '').split(' | ')[0];
        if (!heading) throw new Error(`${name}: no heading for its breadcrumb`);
        graph.push({ '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site },
          { '@type': 'ListItem', position: 2, name: heading, item: pageUrl },
        ] });
        breadcrumbs++;
      }
      if (!product && !isHome && !graph.some(node => node['@type'] === 'ItemList')) {
        const slugs = linkedProducts(html);
        if (slugs.length >= 2) {
          graph.push({ '@type': 'ItemList', name: `${pageHeading(html) || webPage?.name}: plaques to order`,
            numberOfItems: slugs.length,
            itemListElement: slugs.map((slug, index) => ({ '@type': 'ListItem', position: index + 1, url: `${site}/${slug}`, name: offersBySlug.get(slug).title })) });
          itemLists++;
        }
      }
      return JSON.stringify(schema);
    }, name);
  }
  const app = html.match(appScript);
  if (!app || (html.match(/<script type="module"/g) || []).length !== 1) throw new Error(`${name}: expected one app module script`);
  html = html.replace(app[0], '');
  html = replaceOnce(html, /<\/div>(\s*)<\/body>/, `${staticBanner}</div>$1  ${appBoot(app[1])}\n</body>`, '#root end', name);
  await writeFile(file, html);
}
if (skus !== merchantOffers.length) throw new Error(`Added sku to ${skus} product pages, expected ${merchantOffers.length}`);
console.log(`Finalised ${pages.length} pages: Fontsource font faces, crawlable favicon, Organization logo/contact/returns, ${skus} product SKUs and variant groups, ${breadcrumbs} new breadcrumbs, ${itemLists} product lists, static cookie banner, app start after first paint.`);
