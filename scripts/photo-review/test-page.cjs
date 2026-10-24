// Exercise the photo review page's script in jsdom (no browser: the account has no memory headroom for Chrome).
// Usage (from the repo): node scripts/photo-review/test-page.cjs SITE_DIR
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const site = process.argv[2];
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const STORE = 'instaplaque-photo-review-v1';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let failures = 0;
const check = (ok, label, extra = '') => { if (!ok) failures++; console.log(ok ? 'ok  ' : 'FAIL', label, extra); };

function open(seed) {
  const dom = new JSDOM(html, {
    url: 'https://review.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      window.confirm = () => true;
      window.alert = message => { throw new Error('alert: ' + message); };
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = function () {};
      if (seed) window.localStorage.setItem(STORE, seed);
    },
  });
  return dom.window;
}

(async () => {
  let w = open();
  let d = w.document;
  const data = JSON.parse(fs.readFileSync(path.join(site, 'manifest.json'), 'utf8'));
  const total = data.items.length;
  const drawings = data.items.filter(it => it.sec === 'drawings').length;
  const card = n => d.getElementById('p' + n);
  const visible = () => [...d.querySelectorAll('.card')].filter(c => !c.hidden && !c.closest('.sec').hidden && !c.closest('.grid').hidden);
  const stored = () => JSON.parse(w.localStorage.getItem(STORE) || '{}');
  const input = (el, value) => { el.value = value; el.dispatchEvent(new w.Event('input', { bubbles: true })); };

  check(d.querySelectorAll('.card').length === total - drawings, 'drawings are not built until opened', d.querySelectorAll('.card').length);
  check(/0<\/b> keep/.test(d.getElementById('counts').innerHTML) && d.getElementById('counts').textContent.includes(`${total} of ${total}`), 'counts start at zero', d.getElementById('counts').textContent);
  check(d.getElementById('built').textContent.includes(`${total - drawings} photos and ${drawings} drawings`), 'header counts', d.getElementById('built').textContent);
  check([...d.querySelectorAll('.thumb img')].every(img => fs.existsSync(path.join(site, img.getAttribute('src')))), 'every grid thumbnail exists');

  // Keep #1, then add a note to it.
  card(1).querySelector('.act.keep').click();
  check(stored()[data.items[0].key]?.d === 'keep', 'Keep is saved');
  check(card(1).querySelector('.badge').textContent.includes('Keep') && !card(1).querySelector('.badge').hidden, 'Keep badge shows');
  check(card(1).querySelector('.note').hidden && !card(1).querySelector('.add-note').hidden, 'Keep offers “Add a note”, no box yet');
  card(1).querySelector('.add-note').click();
  check(!card(1).querySelector('.note').hidden, 'Add a note opens the box');
  input(card(1).querySelector('textarea'), 'Lovely, keep');
  check(stored()[data.items[0].key]?.n === 'Lovely, keep', 'Keep note is saved');

  // Redo #2 with a comment.
  card(2).querySelector('.act.redo').click();
  check(!card(2).querySelector('.note').hidden, 'Redo opens the comment box');
  check(d.activeElement === card(2).querySelector('textarea'), 'Redo focuses the comment box');
  input(card(2).querySelector('textarea'), 'Plaque too big\nmake it smaller');
  check(stored()[data.items[1].key]?.d === 'redo' && stored()[data.items[1].key]?.n.includes('too big'), 'Redo comment is saved');
  check(card(2).classList.contains('is-redo'), 'Redo card is marked');

  // Tapping Keep again clears it.
  card(5).querySelector('.act.keep').click();
  card(5).querySelector('.act.keep').click();
  check(!stored()[data.items[4].key], 'Tapping Keep twice clears the answer');

  // Filters.
  d.querySelector('.chip[data-f="redo"]').click();
  check(visible().length === 1 && visible()[0].id === 'p2', 'Redo filter shows only the redo', visible().map(c => c.id).join());
  d.querySelector('.chip[data-f="keep"]').click();
  check(visible().length === 1 && visible()[0].id === 'p1', 'Keep filter shows only the keep');
  d.querySelector('.chip[data-f="todo"]').click();
  check(visible().length === total - drawings - 2, 'To-check filter hides answered photos', visible().length);
  check(d.querySelectorAll('.card').length === total - drawings && !d.getElementById('s-drawings').hidden, 'To-check filter leaves the optional drawings folded', d.querySelectorAll('.card').length);
  d.querySelector('.chip[data-f="all"]').click();
  check(visible().length === total - drawings, 'All shows every photo', visible().length);
  d.querySelector('#s-drawings .open-sec').click();
  check(visible().length === total && d.querySelector('#s-drawings .open-sec').hidden, 'Show the drawings opens them', visible().length);

  // Zoom: open #3, Keep moves on to the next photo, back button closes it.
  card(3).querySelector('.thumb').click();
  check(!d.getElementById('zoom').hidden, 'Tapping a photo opens it big');
  check(d.getElementById('z-title').textContent === data.items[2].title, 'Zoom shows the title', d.getElementById('z-title').textContent);
  check(d.getElementById('z-pic').getAttribute('src') === data.items[2].thumb, 'Zoom shows the thumbnail while the full photo loads');
  check(d.getElementById('z-full').href === data.items[2].full && d.getElementById('z-page').href.startsWith('https://instaplaque.co.uk/'), 'Zoom links to the full photo and the page');
  d.querySelector('#zoom .act.keep').click();
  await sleep(400);
  check(stored()[data.items[2].key]?.d === 'keep', 'Keep in the big view is saved');
  check(d.getElementById('z-pos').textContent.startsWith('#4 '), 'Keep in the big view moves to the next photo', d.getElementById('z-pos').textContent);
  d.querySelector('#zoom .act.redo').click();
  check(!d.getElementById('z-note').hidden && d.activeElement === d.getElementById('z-note'), 'Redo in the big view opens the comment box');
  input(d.getElementById('z-note'), 'Wrong wood');
  check(stored()[data.items[3].key]?.n === 'Wrong wood', 'Big-view comment is saved');
  check(card(4).querySelector('textarea').value === 'Wrong wood' && !card(4).querySelector('.note').hidden, 'Grid card shows the big-view comment');
  d.getElementById('z-back').click();
  check(d.getElementById('z-pos').textContent.startsWith('#3 '), 'Previous goes back');
  w.history.back();
  await sleep(300);
  check(d.getElementById('zoom').hidden, 'Phone back button closes the big view');
  check(w.location.href === 'https://review.test/', 'and stays on the page', w.location.href);

  // Keep the rest of a section.
  d.querySelector('#s-tops .keep-rest').click();
  const tops = data.items.filter(it => it.sec === 'tops');
  check(tops.every(it => stored()[it.key]?.d === ([2, 4].includes(it.n) ? 'redo' : 'keep')), 'Keep-the-rest keeps every unchecked photo but leaves the redos');
  check(d.querySelector('#s-tops .keep-rest').hidden && d.querySelector('#s-tops .sec-count').textContent.includes('all checked'), 'Section shows all checked');

  // Send: message text and Telegram link.
  d.getElementById('send-open').click();
  check(!d.getElementById('sheet').hidden, 'Send opens the sheet');
  const link = d.querySelector('#s-parts .tg');
  check(link && link.href.startsWith('https://t.me/CODYLINUX_bot?text='), 'Telegram link to Cody', link && link.href.slice(0, 50));
  const text = decodeURIComponent(link.href.split('?text=')[1]);
  console.log('---- message ----\n' + text + '\n-----------------');
  check(text.includes(`#2 ${data.items[1].title} — Plaque too big / make it smaller`), 'Redo line with comment');
  check(text.includes(`#4 ${data.items[3].title} — Wrong wood`), 'Big-view redo line');
  check(text.includes(`#1 ${data.items[0].title} — Lovely, keep`) && text.includes('KEEP, WITH A NOTE'), 'Keep note line');
  check(/Redo 2 · Keep 8 · not checked \d+/.test(text), 'Summary line', text.split('\n')[1]);
  d.getElementById('s-treat').click();
  const treated = decodeURIComponent(d.querySelector('#s-parts .tg').href.split('?text=')[1]);
  check(/the other \d+: keep too/.test(treated), 'Tick “the rest are fine” changes the summary', treated.split('\n')[1]);
  w.history.back();
  await sleep(300);
  check(d.getElementById('sheet').hidden, 'Back closes the send sheet');

  // A drawing marked redo shows under the Redo filter.
  const drawing = data.items.find(it => it.sec === 'drawings');
  card(drawing.n).querySelector('.act.redo').click();
  d.querySelector('.chip[data-f="redo"]').click();
  check(visible().some(c => c.id === 'p' + drawing.n), 'Redo filter includes drawings');
  d.querySelector('.chip[data-f="all"]').click();

  // Reload: answers come back; a redone photo (new hash) comes back as a new version.
  const saved = JSON.parse(w.localStorage.getItem(STORE));
  saved[data.items[1].key].h = 'oldhash';
  w.close();
  w = open(JSON.stringify(saved));
  d = w.document;
  check(card(1).classList.contains('is-keep') && card(1).querySelector('textarea').value === 'Lovely, keep', 'Keep and note survive a reload');
  check(card(2).classList.contains('is-changed') && card(2).querySelector('.badge').textContent === 'New version', 'Redone photo shows as a new version');
  check(card(2).querySelector('.prev').textContent.includes('You said Redo: “Plaque too big'), 'and shows what you said before', card(2).querySelector('.prev').textContent);
  check(!d.querySelector('.chip[data-f="changed"]').hidden, 'New versions filter appears');
  d.querySelector('.chip[data-f="changed"]').click();
  check(visible().length === 1 && visible()[0].id === 'p2', 'New versions filter shows it');
  d.querySelector('.chip[data-f="all"]').click();

  // A long list splits into Telegram-sized parts.
  for (const it of data.items.slice(0, 160)) saved[it.key] = { d: 'redo', n: 'The plaque looks too big for the wall and the screws are the wrong colour, please redo it', h: it.hash };
  w.close();
  w = open(JSON.stringify(saved));
  d = w.document;
  d.getElementById('send-open').click();
  const parts = [...d.querySelectorAll('#s-parts .tg')].map(a => decodeURIComponent(a.href.split('?text=')[1]));
  check(parts.length > 1 && parts.every(p => p.length <= 4096), 'Long lists split into parts under 4096 characters', parts.map(p => p.length).join(', '));
  check(parts.every((p, i) => p.startsWith('Photo check') && p.split('\n')[0].endsWith(`, part ${i + 1} of ${parts.length}`)), 'Each part is labelled', parts[0].split('\n')[0]);
  check(parts.join('\n').split('\n').filter(l => /^#\d+ /.test(l)).length === 160 + 1, 'No line lost across parts', parts.join('\n').split('\n').filter(l => /^#\d+ /.test(l)).length);

  // Clear all.
  d.getElementById('s-close').click();
  d.getElementById('clear').click();
  check(w.localStorage.getItem(STORE) === '{}' && d.querySelectorAll('.card.is-redo, .card.is-keep').length === 0, 'Clear all empties the answers');
  w.close();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch(error => { console.error(error); process.exit(2); });
