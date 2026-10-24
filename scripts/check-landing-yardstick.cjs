// Score InstaPlaque landing pages against the rebuilt memorial page (owner msg 5876: "make memorial page amazing
// and then use as yardstick to measure against other pages"). Loads each page as a phone visitor (390 x 844,
// scripts running, analytics aborted, consent "no"), measures what the first screens show, and writes
// OUT_DIR/yardstick.json plus a first-screen picture per page.
// Usage: node scripts/check-landing-yardstick.cjs OUT_DIR NAME=URL [NAME=URL ...]  (Chrome at /opt/google/chrome/chrome)
const fs = require('fs');
const { chromium } = require('playwright');
const [outDir, ...pages] = process.argv.slice(2);
const SCREEN = 844;
(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'],
  });
  const results = [];
  for (const spec of pages) {
    const name = spec.slice(0, spec.indexOf('='));
    const url = spec.slice(spec.indexOf('=') + 1);
    const context = await browser.newContext({ viewport: { width: 390, height: SCREEN }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      localStorage.setItem('instaplaque-meta-consent', 'no');
      localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
    });
    await context.route(/googletagmanager|google-analytics|googleadservices|googlesyndication|doubleclick|facebook|posthog|clarity/, route => route.abort());
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    const html = await response.text();
    await page.locator('.shopfront').first().waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.addStyleTag({ content: '.cookie-banner { display: none !important; }' });
    await page.screenshot({ path: `${outDir}/${name}-first-screen.png` });
    // Unclip the shop's scrolling panel so positions are page positions, then load every image.
    await page.addStyleTag({ content: 'html, body, #root, #root > *, main { height: auto !important; max-height: none !important; overflow: visible !important; } .shop-mobile-contact { display: none !important; } .shop-header { position: static !important; }' });
    const data = await page.evaluate(async (SCREEN) => {
      for (const img of document.images) img.loading = 'eager';
      await Promise.race([new Promise(r => setTimeout(r, 12000)), Promise.all([...document.images].map(img => img.decode().catch(() => {})))]);
      const shop = document.querySelector('.shopfront');
      const top = el => Math.round(el.getBoundingClientRect().top + window.scrollY);
      const visible = el => el.offsetWidth > 0 && el.offsetHeight > 0;
      const inShop = [...shop.querySelectorAll('*')].filter(visible);
      const firstScreen = el => top(el) < SCREEN;
      const text = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
      const sections = [...shop.children].filter(visible).map(el => ({
        cls: String(el.className).split(' ').filter(c => c !== 'shop-section').slice(0, 2).join(' ') || el.tagName.toLowerCase(),
        heading: text(el.querySelector('h1,h2') || { textContent: '' }).slice(0, 60),
        top: top(el), height: el.offsetHeight,
        words: text(el).split(' ').length,
        photos: [...el.querySelectorAll('img')].filter(img => visible(img) && img.getBoundingClientRect().width >= 100).length,
      }));
      const bigImages = [...shop.querySelectorAll('img')].filter(img => visible(img) && img.getBoundingClientRect().width >= 200);
      const hero = bigImages[0];
      const heroEntry = hero && performance.getEntriesByType('resource').find(entry => entry.name === hero.currentSrc);
      const priceEls = inShop.filter(el => el.children.length === 0 && /£\d/.test(el.textContent || ''));
      const links = [...shop.querySelectorAll('a')].filter(visible);
      const designButton = links.find(a => /^Design (online|your plaque)/i.test(text(a)) && a.classList.contains('shop-button'));
      const whatsappButton = links.find(a => /wa\.me/.test(a.href) && a.classList.contains('shop-button'));
      // Product photos with prices: the first linked photo card that also shows a £ price.
      const photoCard = [...shop.querySelectorAll('a')].filter(a => visible(a) && a.querySelector('img') && /£\d/.test(text(a)) && a.querySelector('img').getBoundingClientRect().width >= 100)[0];
      const has = selector => Boolean([...shop.querySelectorAll(selector)].find(visible));
      const headings = [...shop.querySelectorAll('h2')].filter(visible).map(text);
      // Open long text: visible article paragraphs outside folded <details>.
      const openGuideWords = [...shop.querySelectorAll('.shop-buying-guide, .shop-garden-advice, .shop-collection-advice')]
        .filter(visible).reduce((sum, el) => sum + text(el).split(' ').length, 0);
      const designUsSections = sections.filter(s => /Your words\. Your approval|Tell us what you want|take care of the design|Want us to design|We.ll design/i.test(s.heading)).map(s => s.heading);
      return {
        title: document.title,
        h1: text(document.querySelector('h1') || { textContent: '' }),
        pageHeight: document.documentElement.scrollHeight,
        sections,
        hero: hero ? { src: hero.currentSrc.replace(location.origin, ''), top: top(hero), bytes: heroEntry ? heroEntry.encodedBodySize || heroEntry.transferSize : null, alt: hero.alt.slice(0, 120) } : null,
        firstScreen: {
          photo: Boolean(hero && firstScreen(hero)),
          price: priceEls.some(firstScreen),
          design: Boolean(designButton && firstScreen(designButton)),
          whatsapp: Boolean(whatsappButton && firstScreen(whatsappButton)),
          freeProof: inShop.some(el => el.children.length === 0 && firstScreen(el) && /free (online )?proof/i.test(el.textContent || '')),
          delivery: inShop.some(el => el.children.length === 0 && firstScreen(el) && /UK delivery/i.test(el.textContent || '')),
        },
        photoCardsTop: photoCard ? top(photoCard) : null,
        sizes: headings.find(h => /size/i.test(h)) || null,
        quality: has('.shop-quality-home'),
        proof: has('.shop-proof-pdf'),
        wording: headings.find(h => /wording|inscription|words/i.test(h) && !/approval/i.test(h)) || null,
        portraits: has('.cat-portraits, .shop-product-portrait, .shop-portrait-home'),
        faq: has('.shop-faq'),
        foldedGuide: has('.cat-guide, .cat-questions'),
        openGuideWords,
        designUsSections,
        internalLinks: [...new Set(links.map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.startsWith('//')))].length,
        images: [...shop.querySelectorAll('img')].filter(visible).length,
      };
    }, SCREEN);
    data.faqSchema = /"@type":"FAQPage"/.test(html);
    data.name = name;
    data.url = url;
    results.push(data);
    console.log(name, data.pageHeight, JSON.stringify(data.firstScreen), 'photoCards', data.photoCardsTop, 'hero', data.hero && data.hero.bytes);
    await context.close();
  }
  fs.writeFileSync(`${outDir}/yardstick.json`, JSON.stringify(results, null, 1));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
