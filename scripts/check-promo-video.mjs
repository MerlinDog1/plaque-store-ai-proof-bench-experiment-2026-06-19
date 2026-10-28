// Browser check for the promo film section (components/PromoVideo.tsx, owner msg 6977). Against a running copy of
// the site (BASE, default http://127.0.0.1:4187 serving dist/), in Google Chrome (H.264), with analytics (Google, Meta,
// PostHog, Vercel) aborted and consent refused, so a run on the live site records no visit:
// - nothing of the film is requested on a phone's first screen; the poster and video load only near it;
// - it plays muted once on screen, pauses off screen, and its button pauses and plays it;
// - visitors who ask for reduced motion get the poster and a play button, not autoplay;
// - the 4:5 box doesn't overflow at 390 px; on a computer it sits beside its copy;
// - it is on the homepage and the ad landing pages, but not the tree page (all oak board and stake, 10-15 days).
// Usage: BASE=https://instaplaque.co.uk node scripts/check-promo-video.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:4187';
const FILM = /\/videos\/instaplaque-design-in-seconds-20261028\.mp4/;
const POSTER = /\/videos\/instaplaque-design-in-seconds-20261028-poster\.webp/;
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
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 90000 });
  await page.locator('.shopfront').first().waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(1500);
  return { context, page, requests };
}

const state = page => page.evaluate(() => {
  const video = document.querySelector('.shop-video video');
  const button = document.querySelector('.shop-video-toggle');
  return video && { paused: video.paused, time: video.currentTime, muted: video.muted, src: video.getAttribute('src'), poster: video.getAttribute('poster'), label: button?.getAttribute('aria-label') };
});

for (const path of ['/', '/memorial-plaques']) {
  await check(`${path} phone: lazy, plays on screen, pauses off screen, button works`, async () => {
    const { context, page, requests } = await open(path);
    try {
      assert.equal(requests.some(url => FILM.test(url) || POSTER.test(url)), false, 'film or poster requested on the first screen');
      const box = await page.locator('.shop-video-frame').boundingBox();
      assert.ok(box && Math.abs(box.width / box.height - 0.8) < 0.01, `frame is not 4:5 (${box?.width}x${box?.height})`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page overflows sideways');
      await page.locator('.shop-video-frame').scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000);
      let s = await state(page);
      assert.ok(requests.some(url => FILM.test(url)), 'film not requested on screen');
      assert.ok(requests.some(url => POSTER.test(url)), 'poster not requested on screen');
      assert.ok(!s.paused && s.time > 0.5 && s.muted, `not playing muted on screen: ${JSON.stringify(s)}`);
      assert.equal(s.label, 'Pause the video');
      await page.locator('.shop-video-toggle').click();
      await page.waitForTimeout(400);
      s = await state(page);
      assert.ok(s.paused && s.label === 'Play the video', `button did not pause: ${JSON.stringify(s)}`);
      await page.locator('.shop-video-toggle').click();
      await page.waitForTimeout(800);
      s = await state(page);
      assert.ok(!s.paused, 'button did not play again');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.locator('.shop-closing').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      s = await state(page);
      assert.ok(s.paused, 'still playing off screen');
    } finally {
      await context.close();
    }
  });
}

await check('/ phone, reduced motion: poster and play button, no autoplay', async () => {
  const { context, page } = await open('/', { reducedMotion: 'reduce' });
  try {
    await page.locator('.shop-video-frame').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    let s = await state(page);
    assert.ok(s.paused && s.time === 0 && s.poster && s.label === 'Play the video', `autoplayed or no poster: ${JSON.stringify(s)}`);
    await page.locator('.shop-video-toggle').click();
    await page.waitForTimeout(1500);
    s = await state(page);
    assert.ok(!s.paused && s.time > 0.2, `play button did not play: ${JSON.stringify(s)}`);
  } finally {
    await context.close();
  }
});

for (const path of ['/', '/brass-plaques']) {
  await check(`${path} computer: film beside its copy, no overflow`, async () => {
    const { context, page } = await open(path, { phone: false });
    try {
      const frame = await page.locator('.shop-video-frame').boundingBox();
      const head = await page.locator('.shop-video-head').boundingBox();
      assert.ok(frame && head && head.x > frame.x + frame.width, 'copy is not beside the film');
      assert.ok(frame.width >= 360 && frame.width <= 400, `film width ${frame.width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page overflows sideways');
    } finally {
      await context.close();
    }
  });
}

await check('section on the ad pages, not on the tree page', async () => {
  for (const path of ['/bench-plaques', '/garden-plaques', '/stainless-steel-plaques', '/memorial-plaques', '/brass-plaques']) {
    const html = await (await fetch(BASE + path)).text();
    assert.ok(html.includes('class="shop-section shop-video"'), `${path} has no film section in its HTML`);
  }
  const tree = await (await fetch(BASE + '/tree-memorial-plaques')).text();
  assert.ok(tree.includes('cat-hero') && !tree.includes('shop-video'), 'tree page has the film (or did not render)');
});

await browser.close();
console.log(results.join('\n'));
const failed = results.filter(line => line.startsWith('FAIL')).length;
console.log(failed ? `RESULT FAIL (${failed})` : 'RESULT PASS');
process.exit(failed ? 1 : 0);
