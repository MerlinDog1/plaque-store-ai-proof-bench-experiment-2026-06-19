// Local browser matrix for the original homepage/watch film, 13 category-specific films and mapped product films.
// Serve correct prerendered clean routes plus HTTP Range support (Chrome/H.264). Never use this unpaced matrix live.
// Covers independent IDs, category films leading their pages and playing after load (owner msg 10240), single
// product/homepage copy, 4:5 uncropped phone/desktop layout,
// cue windows from each film's descriptor (portrait WhatsApp only), pause/play, actual main-container offscreen pause, quiet modes and
// visibility-event pause/resume. External analytics are blocked and consent refused. Screenshots use CSS pixels.
// Usage: BASE=http://127.0.0.1:4398 SHOTS=/absolute/path/to/shots node scripts/check-promo-video.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { categoryFilms } from '../services/categoryFilms.mjs';
const shots = process.env.SHOTS || 'output/category-film-browser';
mkdirSync(shots, { recursive: true });

const BASE = process.env.BASE || 'http://127.0.0.1:4187';
const POSTER = 'poster="/videos/instaplaque-design-in-seconds-20261028-poster.webp"';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'Use this comprehensive matrix on a local build; hosted checks must be paced');
const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448', '--autoplay-policy=no-user-gesture-required'],
});
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`); console.log(results.at(-1));
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message.split('\n')[0]}`); console.log(results.at(-1));
  }
};

async function open(path, { phone = true, reducedMotion = 'no-preference', saveData = false } = {}) {
  const context = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion }
    : { viewport: { width: 1440, height: 900 }, reducedMotion });
  await context.addInitScript(() => {
    localStorage.setItem('instaplaque-meta-consent', 'no');
    localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
  });
  await context.route(/googletagmanager|google-analytics|googleadservices|googlesyndication|doubleclick|facebook|posthog|clarity|_vercel\/insights/, route => route.abort());
  if (saveData) await context.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
  const page = await context.newPage();
  const response = await page.goto(BASE + path, { waitUntil: 'load', timeout: 90000 });
  const html = await response.text();
  await page.locator('.shopfront').first().waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2500);
  return { context, page, html };
}

// The film copy this screen shows, the hero's two buttons, and what is glowing.
const state = page => page.evaluate(() => {
  const video = [...document.querySelectorAll('.promo-film-player')].find(v => v.getClientRects().length > 0);
  // (Category films' heroes, .cat-film-hero: the tree page's designer link is /design?backing=stake, and the portrait
  // hero's other button is email.)
  const hero = document.querySelector('.shop-hero, .cat-hero, .watch-hero, .cat-film-hero');
  const design = hero?.querySelector('.shop-hero-choices > a:is([href="/design"], [href^="/design?"])');
  const whatsapp = hero?.querySelector('.shop-hero-choices > a.shop-hero-choice-whatsapp[data-contact-placement="hero"]');
  const box = el => el && (({ top, bottom, left, right, width, height }) => ({ top: top + window.scrollY, bottom: bottom + window.scrollY, left, right, width, height }))(el.getBoundingClientRect());
  const glow = el => el && getComputedStyle(el).outlineStyle !== 'none' && getComputedStyle(el).outlineColor === 'rgb(214, 170, 82)';
  return video && {
    paused: video.paused,
    time: video.currentTime,
    muted: video.muted,
    loaded: document.querySelectorAll('.promo-film-player[src]').length,
    cue: document.querySelector('.shopfront')?.dataset.promoCue || '',
    designGlow: glow(design),
    whatsappGlow: glow(whatsapp),
    designAnimation: design && getComputedStyle(design).animationName,
    label: video.parentElement.querySelector('.promo-film-toggle')?.getAttribute('aria-label'),
    film: box(video),
    copy: box(document.querySelector('.shop-hero-copy, .cat-hero-copy, .watch-head, .cat-tpl-head, .shop-feature-hero-copy')),
    buttons: box(hero.querySelector('.shop-hero-choices')),
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    // The film's resource must start after the page's load event.
    videoStart: performance.getEntriesByType('resource').find(entry => entry.name.includes('/videos/') && entry.name.endsWith('.mp4'))?.startTime ?? null,
    loadEvent: performance.getEntriesByType('navigation')[0]?.loadEventStart ?? null,
  };
});

const seek = async (page, seconds) => {
  await page.evaluate(async seconds => {
    const video = [...document.querySelectorAll('.promo-film-player')].find(v => v.getClientRects().length > 0);
    await new Promise(resolve => { video.addEventListener('seeked', resolve, { once: true }); video.currentTime = seconds; });
  }, seconds);
  await page.waitForTimeout(700);
  return state(page);
};

// Seek into the middle of each cue window. The homepage film uses its own 332/566-frame windows (5, 14, 20 s); a
// category film uses the windows in its own descriptor (v2: design to 11.07 s, chat to 23.47 s, end card to 26.53 s).
const cueWindows = (film) => film.cues.map((cue, i) => [cue.start, film.cues[i + 1]?.start ?? film.duration]);
const middle = ([a, b]) => Math.round(((a + b) / 2) * 100) / 100;
async function glowCycle(page, film) {
  const [design, chat, end] = film ? cueWindows(film).map(middle) : [5, 14, 20];
  let s = await seek(page, design);
  assert.ok(!s.paused && s.cue === 'design' && s.designGlow && !s.whatsappGlow && s.designAnimation === 'promo-cue', `designer part: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow, a: s.designAnimation })}`);
  s = await seek(page, chat);
  assert.ok(s.cue === 'whatsapp' && !s.designGlow && s.whatsappGlow, `chat part: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow })}`);
  s = await seek(page, end);
  assert.ok(s.cue === 'both' && s.designGlow && s.whatsappGlow, `end card: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow })}`);
}

for (const path of ['/']) {
  await check(`${path} phone: film under the buttons on the first screen, loads after the page, plays, glows in turn, pauses`, async () => {
    const { context, page, html } = await open(path);
    try {
      assert.ok(html.includes(POSTER) && !html.includes('src="/videos/'), 'static HTML must have the poster and no video source');
      let s = await state(page);
      assert.ok(s, 'no visible film');
      assert.ok(!s.overflow, 'page overflows sideways');
      assert.ok(Math.abs(s.film.width / s.film.height - 0.8) < 0.01, `film is not 4:5 (${s.film.width}x${s.film.height})`);
      assert.ok(s.film.top >= s.buttons.bottom && s.film.top - s.buttons.bottom < 60, `film is not straight under the buttons (${s.buttons.bottom} -> ${s.film.top})`);
      assert.ok(s.buttons.bottom < 600 && s.film.top < 650, `buttons/film not on the first screen (${s.buttons.bottom}, ${s.film.top})`);
      assert.ok(!s.paused && s.time > 0.5 && s.muted, `not playing muted on the first screen: ${JSON.stringify({ paused: s.paused, time: s.time, muted: s.muted })}`);
      assert.equal(s.loaded, 1, 'more than one copy of the film loaded');
      assert.ok(s.videoStart !== null && s.loadEvent !== null && s.videoStart >= s.loadEvent, `video requested before the load event (${s.videoStart} < ${s.loadEvent})`);
      await glowCycle(page);
      await page.locator('.promo-film-toggle:visible').click();
      await page.waitForTimeout(400);
      s = await state(page);
      assert.ok(s.paused && s.label === 'Play the video' && s.cue === '' && !s.designGlow && !s.whatsappGlow, `pause: ${JSON.stringify({ paused: s.paused, cue: s.cue })}`);
      await page.locator('.promo-film-toggle:visible').click();
      await page.waitForTimeout(800);
      s = await state(page);
      assert.ok(!s.paused && s.cue !== '', 'play again');
      await page.evaluate(() => document.querySelector('.shop-closing')?.scrollIntoView());
      await page.waitForTimeout(900);
      s = await state(page);
      assert.ok(s.paused && s.cue === '', 'still playing or glowing off screen');
    } finally {
      await context.close();
    }
  });
}

await check('/ phone, reduced motion: poster and play button, no autoplay, steady glow once played', async () => {
  const { context, page } = await open('/', { reducedMotion: 'reduce' });
  try {
    let s = await state(page);
    assert.ok(s.paused && s.time === 0 && s.cue === '' && s.label === 'Play the video', `autoplayed: ${JSON.stringify({ paused: s.paused, time: s.time, cue: s.cue })}`);
    await page.locator('.promo-film-toggle:visible').click();
    await page.waitForTimeout(1500);
    s = await state(page);
    assert.ok(!s.paused && s.cue === 'design' && s.designGlow && s.designAnimation === 'none', `play: ${JSON.stringify({ paused: s.paused, cue: s.cue, a: s.designAnimation })}`);
  } finally {
    await context.close();
  }
});

for (const path of ['/']) {
  await check(`${path} computer: film beside the copy, with the buttons, on the first screen; glows in turn`, async () => {
    const { context, page } = await open(path, { phone: false });
    try {
      const s = await state(page);
      assert.ok(s && !s.overflow, 'no film, or the page overflows');
      assert.ok(s.film.left > s.copy.right, 'film is not beside the copy');
      assert.ok(s.film.width >= 380 && s.film.width <= 480, `film width ${s.film.width}`);
      assert.ok(s.buttons.bottom < 900 && s.film.top < 300 && !s.paused, `not on the first screen or not playing (${s.buttons.bottom}, ${s.film.top}, paused ${s.paused})`);
      assert.equal(s.loaded, 1, 'more than one copy of the film loaded');
      await glowCycle(page);
    } finally {
      await context.close();
    }
  });
}

await check('/video phone: watch page with the film first, its source and VideoObject in the HTML, buttons under it glowing in turn', async () => {
  const { context, page, html } = await open('/video');
  try {
    assert.ok(html.includes('src="/videos/instaplaque-design-in-seconds-20261028.mp4"') && html.includes('"@type":"VideoObject"') && html.includes('property="og:video"'), 'static HTML must have the video source, VideoObject and og:video');
    let s = await state(page);
    assert.ok(s && !s.overflow, 'no film, or the page overflows');
    assert.ok(s.film.top < 420 && s.film.width >= 330, `film is not leading the page (${s.film.top}, ${s.film.width})`);
    assert.ok(s.buttons.top > s.film.bottom && s.buttons.top - s.film.bottom < 110 && s.buttons.bottom < 844, `buttons not straight under the film on the first screen (${s.film.bottom} -> ${s.buttons.top}..${s.buttons.bottom})`);
    assert.ok(!s.paused && s.muted, 'not playing muted');
    await glowCycle(page);
    s = await state(page);
    assert.equal(s.loaded, 1, 'more than one copy of the film loaded');
    assert.ok(await page.locator('#whats-in-the-video li').count() === 7, 'written version must list the 7 moments');
  } finally {
    await context.close();
  }
});

await check('/video computer: film large on the left, heading and buttons beside it', async () => {
  const { context, page } = await open('/video', { phone: false });
  try {
    const s = await state(page);
    assert.ok(s && !s.overflow && s.film.left < s.copy.left && s.film.width >= 440 && s.film.top < 260 && !s.paused, `layout ${JSON.stringify({ film: s?.film, copy: s?.copy })}`);
  } finally {
    await context.close();
  }
});

await check('video sitemap entry and thumbnails are served; the film pages link to the watch page', async () => {
  const sitemap = await (await fetch(BASE + '/sitemap.xml')).text();
  assert.ok(sitemap.includes('xmlns:video=') && sitemap.includes('<loc>https://instaplaque.co.uk/video</loc>') && sitemap.includes('<video:content_loc>https://instaplaque.co.uk/videos/instaplaque-design-in-seconds-20261028.mp4</video:content_loc>'), 'video sitemap entry');
  for (const ratio of ['16x9', '4x3', '1x1']) {
    const response = await fetch(`${BASE}/videos/instaplaque-design-in-seconds-20261028-${ratio}.jpg`);
    assert.ok(response.ok && /image\/jpeg/.test(response.headers.get('content-type') || ''), `thumbnail ${ratio}: ${response.status} ${response.headers.get('content-type')}`);
  }
  for (const path of ['/', '/bench-plaques']) {
    assert.ok((await (await fetch(BASE + path)).text()).includes('href="/video"'), `${path} does not link to /video`);
  }
});

// Each category page leads with its own film, as the homepage does (owner msg 10240, 6 Nov 2026): a copy under the hero
// buttons for phones and one beside the copy for computers. The copy on show plays by itself once the page has loaded and
// lights the buttons in turn (portrait: WhatsApp only); the other copy loads nothing.
for (const [slug, film] of Object.entries(categoryFilms)) {
  for (const phone of [true, false]) {
    await check(`${slug} ${phone ? 'phone' : 'desktop'}: own film first, plays after load, cues, pause and off-screen`, async () => {
      const { context, page, html } = await open('/' + slug, { phone });
      try {
        assert.ok(html.includes(`poster="${film.poster}"`) && html.includes(film.id) && !html.includes('src="/videos/'), 'static HTML must have the poster and no video source');
        assert.equal(await page.locator('.cat-film-figure video').count(), 2, 'one copy for phones, one for computers');
        let s = await state(page);
        assert.ok(s && !s.overflow, 'no visible film, or the page overflows');
        assert.equal(s.loaded, 1, 'more than one copy of the film loaded');
        assert.equal(await page.locator('.promo-film-player[src]').getAttribute('src'), film.file);
        assert.ok(Math.abs(s.film.width / s.film.height - 0.8) < 0.01, `film is not 4:5 (${s.film.width}x${s.film.height})`);
        assert.ok(s.film.height <= (phone ? 844 * .75 : 650), 'uncropped film exceeds screen allowance');
        if (phone) assert.ok(s.film.top >= s.buttons.bottom && s.film.top - s.buttons.bottom < 60 && s.film.top < 700, `film not straight under the buttons on the first screen (${s.buttons.bottom} -> ${s.film.top})`);
        else assert.ok(s.film.left > s.copy.right && s.film.top < 260 && s.film.width >= 380, `film not beside the copy at the top ${JSON.stringify({ film: s.film, copy: s.copy })}`);
        assert.ok(!s.paused && s.time > 0.5 && s.muted, `not playing muted on the first screen: ${JSON.stringify({ paused: s.paused, time: s.time, muted: s.muted })}`);
        assert.ok(s.videoStart !== null && s.loadEvent !== null && s.videoStart >= s.loadEvent, `video requested before the load event (${s.videoStart} < ${s.loadEvent})`);
        if (slug === 'portrait-plaques') {
          for (const seconds of [5, 17, 25]) {
            s = await seek(page, seconds);
            assert.ok(s.cue === 'whatsapp' && s.whatsappGlow && !s.designGlow, `portrait at ${seconds}s: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow })}`);
          }
        } else await glowCycle(page, film);
        await page.screenshot({ path: `${shots}/${slug}-${phone ? 'phone' : 'desktop'}-top.jpg`, type: 'jpeg', quality: 75, scale: 'css' });
        await page.locator('.promo-film-toggle:visible').click();
        await page.waitForTimeout(400);
        s = await state(page);
        assert.ok(s.paused && s.label === 'Play the video' && s.cue === '' && !s.designGlow && !s.whatsappGlow, `pause: ${JSON.stringify({ paused: s.paused, cue: s.cue })}`);
        await page.locator('.promo-film-toggle:visible').click();
        await page.waitForTimeout(800);
        s = await state(page);
        assert.ok(!s.paused && s.cue !== '', 'play again');
        await page.evaluate(() => document.querySelector('.shop-closing')?.scrollIntoView());
        await page.waitForTimeout(900);
        s = await state(page);
        assert.ok(s.paused && s.cue === '', 'still playing or glowing off screen');
      } finally { await context.close(); }
    });
  }
}

for (const options of [{ reducedMotion: 'reduce' }, { saveData: true }]) {
  await check(`category film with ${JSON.stringify(options)}: poster and play button, no autoplay; hidden tab pauses`, async () => {
    const { context, page } = await open('/tree-memorial-plaques', options);
    try {
      let s = await state(page);
      assert.ok(s.paused && s.time === 0 && s.cue === '' && s.label === 'Play the video', `autoplayed: ${JSON.stringify({ paused: s.paused, time: s.time, cue: s.cue })}`);
      await page.locator('.promo-film-toggle:visible').click();
      await page.waitForTimeout(1500);
      s = await state(page);
      assert.ok(!s.paused && s.cue === 'design' && s.designGlow, `play: ${JSON.stringify({ paused: s.paused, cue: s.cue })}`);
      if (options.reducedMotion) assert.equal(s.designAnimation, 'none', 'reduced motion: steady glow, no pulse');
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', {configurable:true, value:'hidden'}); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(200);
      assert.ok((await state(page)).paused, 'hidden tab pauses');
      await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', {configurable:true, value:'visible'}); document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(400);
      assert.ok(!(await state(page)).paused, 'plays again when the tab shows');
    } finally { await context.close(); }
  });
}

// Representative exact products cover all four stable breadcrumb mapping branches on phone and desktop.
const productExamples = [
  ['custom-plaques', merchantOffers.find(o => o.preset.shape !== 'rect')],
  ['bench-plaques', merchantOffers.find(o => o.preset.shape === 'rect' && Math.min(o.preset.width,o.preset.height) <= 100 && Math.max(o.preset.width,o.preset.height)/Math.min(o.preset.width,o.preset.height) >= 2)],
  ['stainless-steel-plaques', merchantOffers.find(o => o.preset.shape === 'rect' && o.preset.width === 210 && o.preset.height === 148 && o.preset.material === 'brushed-stainless')],
  ['brass-plaques', merchantOffers.find(o => o.preset.shape === 'rect' && o.preset.width === 210 && o.preset.height === 148 && o.preset.material === 'brushed-brass')],
];
for (const [category, product] of productExamples) for (const phone of [true, false]) {
  await check(`${category} mapped product ${phone ? 'phone' : 'desktop'}: own film, one copy, quiet/manual play`, async () => {
    assert.ok(product, category);
    const { context, page } = await open('/' + product.slug, {phone, saveData:true});
    try {
      const film = page.locator('.shop-product-film .promo-film');
      const video = film.locator('video');
      assert.equal(await page.locator('.promo-film').count(), 1);
      assert.equal(await film.getAttribute('data-film-id'), categoryFilms[category].id);
      await film.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      assert.ok(await video.evaluate(v => v.paused && v.currentTime === 0), 'Save-Data must stop autoplay');
      await film.locator('button').click();
      await page.waitForFunction(() => {const v=document.querySelector('.shop-product-film video');return v && !v.paused && v.currentTime > .2;});
      assert.equal(await video.getAttribute('src'), categoryFilms[category].file);
      assert.equal(await page.locator('.promo-film-player[src]').count(), 1);
      assert.ok(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
      await page.screenshot({path:`${shots}/product-${category}-${phone ? 'phone' : 'desktop'}.jpg`,type:'jpeg',quality:75,scale:'css'});
    } finally {await context.close();}
  });
}

await check('13 independent film IDs and assets; tree and practice lead-time qualifications', async () => {
  assert.equal(new Set(Object.values(categoryFilms).map(f => f.id)).size, 13);
  for (const film of Object.values(categoryFilms)) {
    for (const [url, type] of [[film.file, 'video/mp4'], [film.poster, 'image/webp']]) {
      const response = await fetch(BASE + url, { method: 'HEAD' });
      assert.ok(response.ok && response.headers.get('content-type')?.includes(type), url);
    }
  }
  for (const slug of ['tree-memorial-plaques','professional-brass-plaques']) assert.ok(categoryFilms[slug].footnote.includes('10–15'));
  for (const film of Object.values(categoryFilms)) assert.ok(film.id.endsWith('-20261106-v2') && Math.abs(film.duration - 796 / 30) < 0.01, `${film.id}: v2 film expected`);
});

await browser.close();
// Individual cases are logged as they finish.
const failed = results.filter(line => line.startsWith('FAIL')).length;
console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS');
process.exit(failed ? 1 : 0);
