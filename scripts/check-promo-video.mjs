// Browser check for the promo film at the top of the homepage and the category pages (components/PromoVideo.tsx, owner
// msgs 6977 and 6986). Against a running copy of the site (BASE, default http://127.0.0.1:4187 serving dist/), in
// Google Chrome (H.264), with analytics (Google, Meta, PostHog, Vercel) aborted and consent refused, so a run on the
// live site records no visit:
// - phones: the film is straight under the two buttons, all on the first screen; computers: beside the copy;
// - the poster is in the static HTML; the video is requested only after the page's load event, by one copy only;
// - it plays muted on screen and pauses off screen; its button pauses and plays it;
// - while it plays, "Design online" glows during the designer, "Design on WhatsApp" during the chat, both at the end;
//   paused, nothing glows; with reduced motion it doesn't play by itself and the glow doesn't pulse;
// - the category's own photo follows the hero; the tree page (all oak board and stake, 10-15 days) keeps its photo hero.
// Usage: BASE=https://instaplaque.co.uk node scripts/check-promo-video.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:4187';
const POSTER = 'poster="/videos/instaplaque-design-in-seconds-20261028-poster.webp"';
const browser = await chromium.launch({
  executablePath: process.env.CHROME || '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448', '--autoplay-policy=no-user-gesture-required'],
});
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (error) {
    results.push(`FAIL ${name}: ${error.message.split('\n')[0]}`);
  }
};

async function open(path, { phone = true, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion }
    : { viewport: { width: 1440, height: 900 }, reducedMotion });
  await context.addInitScript(() => {
    localStorage.setItem('instaplaque-meta-consent', 'no');
    localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
  });
  await context.route(/googletagmanager|google-analytics|googleadservices|googlesyndication|doubleclick|facebook|posthog|clarity|_vercel\/insights/, route => route.abort());
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
  const hero = document.querySelector('.shop-hero, .cat-hero');
  const design = hero?.querySelector('.shop-hero-choices > a[href="/design"]');
  const whatsapp = hero?.querySelector('.shop-hero-choices > a[data-contact-placement="hero"]');
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
    copy: box(document.querySelector('.shop-hero-copy, .cat-hero-copy')),
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

async function glowCycle(page) {
  let s = await seek(page, 5);
  assert.ok(!s.paused && s.cue === 'design' && s.designGlow && !s.whatsappGlow && s.designAnimation === 'promo-cue', `designer part: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow, a: s.designAnimation })}`);
  s = await seek(page, 14);
  assert.ok(s.cue === 'whatsapp' && !s.designGlow && s.whatsappGlow, `chat part: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow })}`);
  s = await seek(page, 20);
  assert.ok(s.cue === 'both' && s.designGlow && s.whatsappGlow, `end card: ${JSON.stringify({ cue: s.cue, d: s.designGlow, w: s.whatsappGlow })}`);
}

for (const path of ['/', '/memorial-plaques']) {
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

for (const path of ['/', '/brass-plaques']) {
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

await check('film leads the ad pages with their photo after it; the tree page keeps its photo', async () => {
  for (const path of ['/bench-plaques', '/garden-plaques', '/stainless-steel-plaques', '/memorial-plaques', '/brass-plaques']) {
    const html = await (await fetch(BASE + path)).text();
    const hero = html.indexOf('class="cat-hero"');
    const film = html.indexOf('promo-film-figure cat-hero-film-side');
    const shown = html.indexOf('class="cat-shown"');
    assert.ok(hero > 0 && film > hero && shown > film && html.includes(POSTER), `${path}: film not in the hero or photo not after it`);
    assert.ok(!html.includes('cat-hero-photo-side'), `${path}: still has the hero photo`);
  }
  const tree = await (await fetch(BASE + '/tree-memorial-plaques')).text();
  assert.ok(tree.includes('cat-hero-photo-side') && !tree.includes('promo-film'), 'tree page lost its photo or has the film');
});

await browser.close();
console.log(results.join('\n'));
const failed = results.filter(line => line.startsWith('FAIL')).length;
console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS');
process.exit(failed ? 1 : 0);
