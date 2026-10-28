// Watch tracking for the promo film (services/promoVideoTracking.ts, owner msg 7004), run in a VM against a stand-in
// <video> that plays the way browsers report it (a time update every 0.25 s; the loop seeks back to the start):
// - one ip_video_started per film, saying whether it started by itself or from the play button;
// - ip_video_progress at 25, 50, 75 and 100%, once each and in order, the loop counting as reaching the end;
// - nothing while paused or seeking, or before the film's length is known; nothing after it stops watching;
// - keys that make each event once per visit and page.
// posthogAnalytics' side (allow-list, properties, consent, no GA4) is in check-posthog-analytics.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('services/promoVideoTracking.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const sandbox = { exports: {}, location: new URL('https://instaplaque.co.uk/memorial-plaques') };
vm.runInNewContext(code, sandbox);
const { watchPromoFilm, PROMO_MILESTONES } = sandbox.exports;
// The VM's arrays have its own prototype, so copy them before comparing.
const promoMilestonesAt = (seconds, duration) => [...sandbox.exports.promoMilestonesAt(seconds, duration)];
const ID = 'design-in-seconds-20261028';

function film(duration = 21.93) {
  const video = new EventTarget();
  Object.assign(video, { duration, currentTime: 0, paused: true, seeking: false });
  const sent = [];
  let tapped = false;
  const stop = watchPromoFilm(video, ID, (event, properties, key) => sent.push({ event, ...properties, key }), () => tapped);
  const fire = type => video.dispatchEvent(new Event(type));
  const play = () => { video.paused = false; fire('play'); fire('playing'); };
  const pause = () => { video.paused = true; fire('pause'); };
  // Plays on to `to` seconds, with a time update every `step` seconds of film.
  const playTo = (to, step = 0.25) => {
    for (let t = video.currentTime + step; t <= to + 1e-9; t += step) { video.currentTime = Number.isFinite(video.duration) ? Math.min(t, video.duration) : t; fire('timeupdate'); }
  };
  // The loop: the browser seeks back to the start (a time update while seeking, another once it has).
  const loop = () => { video.seeking = true; video.currentTime = 0; fire('seeking'); fire('timeupdate'); video.seeking = false; fire('timeupdate'); fire('seeked'); };
  const progress = () => sent.filter(e => e.event === 'video_progress').map(e => e.percent);
  return { video, sent, stop, fire, play, pause, playTo, loop, progress, tap: () => { tapped = true; } };
}

assert.deepEqual([...PROMO_MILESTONES], [25, 50, 75, 100]);
assert.deepEqual(promoMilestonesAt(0, 22), []);
assert.deepEqual(promoMilestonesAt(5.49, 22), []);
assert.deepEqual(promoMilestonesAt(5.5, 22), [25]);
assert.deepEqual(promoMilestonesAt(16.5, 22), [25, 50, 75]);
assert.deepEqual(promoMilestonesAt(21.49, 22), [25, 50, 75]);
assert.deepEqual(promoMilestonesAt(21.5, 22), [25, 50, 75, 100], 'The end card, its last half second, is the end');
assert.deepEqual(promoMilestonesAt(10, NaN), [], 'Nothing before the length is known');
assert.deepEqual(promoMilestonesAt(10, Infinity), []);

// Watched to the end by itself, then on round the loop: one start, each milestone once, in order.
let f = film();
f.play();
assert.deepEqual(f.sent, [{ event: 'video_started', video: ID, autoplay: true, key: 'video:/memorial-plaques:started' }]);
f.playTo(5.25);
assert.deepEqual(f.progress(), [], 'Not a quarter yet');
f.playTo(5.5);
assert.deepEqual(f.progress(), [25]);
f.playTo(21.75);
assert.deepEqual(f.progress(), [25, 50, 75, 100]);
f.loop(); f.playTo(21.75); f.loop(); f.playTo(3);
assert.deepEqual(f.progress(), [25, 50, 75, 100], 'Looping again sends nothing more');
assert.equal(f.sent.filter(e => e.event === 'video_started').length, 1);
assert.deepEqual(f.sent.slice(1).map(e => e.key), [25, 50, 75, 100].map(p => `video:/memorial-plaques:${p}`));
assert.ok(f.sent.slice(1).every(e => e.video === ID && Object.keys(e).sort().join() === 'event,key,percent,video'), 'Progress carries only the film and the percent');

// The loop restarts the film before a time update reaches its last half second: the restart is the end.
f = film();
f.play(); f.playTo(21.25);
assert.deepEqual(f.progress(), [25, 50, 75]);
f.loop();
assert.deepEqual(f.progress(), [25, 50, 75, 100], 'Back to the start from the last seconds counts as the end');
// Some browsers send ended (a film without loop): that is the end too.
f = film(); f.play(); f.playTo(20); f.fire('ended');
assert.deepEqual(f.progress(), [25, 50, 75, 100]);

// Paused (off screen, background tab or the button) or seeking: no progress.
f = film();
f.play(); f.playTo(6); f.pause();
f.video.currentTime = 12; f.fire('timeupdate');
assert.deepEqual(f.progress(), [25], 'Time updates while paused are ignored');
f.play();
assert.equal(f.sent.filter(e => e.event === 'video_started').length, 1, 'Playing again after a pause is not a new start');
f.video.seeking = true; f.video.currentTime = 18; f.fire('timeupdate'); f.video.seeking = false;
assert.deepEqual(f.progress(), [25], 'Time updates while seeking are ignored');
f.video.currentTime = 6; f.playTo(11.25);
assert.deepEqual(f.progress(), [25, 50]);

// A jump back that is not the loop (from the middle) is not the end.
f = film(); f.play(); f.playTo(12); f.video.currentTime = 0; f.fire('timeupdate');
assert.deepEqual(f.progress(), [25, 50]);

// Started from the play button (reduced motion or Save-Data, or after pausing before it ever played).
f = film(); f.tap(); f.play();
assert.equal(f.sent[0].autoplay, false);

// The length isn't known until the metadata loads.
f = film(NaN); f.play(); f.playTo(8);
assert.deepEqual(f.progress(), []);
f.video.duration = 21.93; f.playTo(8.25);
assert.deepEqual(f.progress(), [25], 'Counts once the length is known');

// An unusable time or length never poisons how far it has played.
f = film(); f.play(); f.playTo(6); f.video.currentTime = NaN; f.fire('timeupdate');
f.video.currentTime = 6; f.playTo(11.25);
assert.deepEqual(f.progress(), [25, 50]);
f = film(); f.play(); f.playTo(6); f.video.duration = NaN; f.fire('ended'); f.video.duration = 21.93; f.playTo(11.25);
assert.deepEqual(f.progress(), [25, 50]);

// After it stops watching (the film is unmounted), nothing more is sent.
f = film(); f.stop(); f.play(); f.playTo(21.75); f.loop();
assert.deepEqual(f.sent, []);

// Faster time updates (a slow phone, or a sped-up test) still cross every milestone in order.
f = film(); f.play(); f.playTo(21, 1); f.loop();
assert.deepEqual(f.progress(), [25, 50, 75, 100]);

// The key follows the page the film is on when it reaches a milestone.
f = film(); f.play(); f.playTo(6);
sandbox.location = new URL('https://instaplaque.co.uk/video');
f.playTo(11.5);
assert.equal(f.sent.at(-1).key, 'video:/video:50');

console.log('Promo film watch tracking: one start (autoplay or tapped), 25/50/75/100% once each and in order, the loop and ended as the end, nothing while paused/seeking/unmeasured or after unmount, per-page keys: passed.');
