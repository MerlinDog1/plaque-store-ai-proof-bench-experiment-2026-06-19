// Import only completed renders. Never modifies the film project's manifest or source assets.
// node scripts/import-category-films.mjs /absolute/path/to/category-film-output
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const source = process.argv[2];
// v2 (owner msg 10243, 6 Nov 2026): a longer chat with a bespoke example design per page. 796 frames at 30 fps;
// the chat swipes in at frame 332 and the end card at frame 704 (the film's src/timeline.ts).
const VERSION = 'v2';
const FRAMES = 796;
const CHAT_IN = 332;
const END_IN = 704;
const SECONDS = Math.round(FRAMES / 30);
assert(source && path.isAbsolute(source), 'Pass the absolute film output directory');
const rows = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
const slugs = ['memorial-plaques','bench-plaques','garden-plaques','tree-memorial-plaques','opening-plaques','brass-plaques','stainless-steel-plaques','custom-plaques','portrait-plaques','church-plaques','house-name-plaques','professional-brass-plaques','donor-recognition-plaques'];
assert.deepEqual(rows.map(row => row.slug).sort(), [...slugs].sort());
const verification = JSON.parse(fs.readFileSync(path.join(source, 'media-verification.json'), 'utf8'));
assert(Array.isArray(verification) && verification.length === 39, 'All 39 verified renders are required');
assert.deepEqual(verification.map(item => `${item.slug}/${item.cut}`).sort(), slugs.flatMap(slug => ['reels','feed','web'].map(cut => `${slug}/${cut}`)).sort(), 'One receipt per category and cut');
assert(verification.every(item => item.decode === 'pass' && item.faststart && item.silent), 'Every cut must have passed decode, faststart and silent checks');
for (const slug of slugs) assert(fs.existsSync(path.join(source, 'films', slug, 'READY')), `${slug}: READY marker required`);
const files = [];
const films = Object.fromEntries(rows.map(row => {
  const file = path.join(source, 'films', row.slug, 'web.mp4');
  const poster = path.join(source, 'films', row.slug, 'poster.webp');
  assert(fs.statSync(file).size > 10000 && fs.statSync(poster).size > 1000, `${row.slug}: incomplete render`);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',file], {encoding:'utf8'}));
  const receipt = verification.find(item => item.slug === row.slug && item.cut === 'web');
  assert(receipt?.decode === 'pass' && receipt.faststart && receipt.silent, `${row.slug}: verified silent faststart render required`);
  assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), receipt.sha256, `${row.slug}: verified checksum`);
  const video = probe.streams.find(stream => stream.codec_type === 'video');
  assert(video?.codec_name === 'h264' && video.width / video.height === 0.8 && probe.streams.length === 1, `${row.slug}: silent 4:5 H.264 required`);
  assert(Math.abs(Number(probe.format.duration) - FRAMES/30) < 0.1 && Number(video.nb_frames) === FRAMES, `${row.slug}: unexpected duration`);
  assert(row.footnote && row.disclosure && row.words && row.swaps?.length, `${row.slug}: missing descriptive facts`);
  const name = row.slug.replace(/-/g,' ').replace(/^./, c => c.toUpperCase());
  const b = row.bespoke;
  assert(b?.ask && b.sends && b.design && b.reply && b.thanks, `${row.slug}: missing bespoke chat facts`);
  const chat = `Then an example WhatsApp conversation: the customer writes “${b.ask}” and sends ${b.sends}. We reply “${b.reply.replace(/ 👇$/, '')}” with ${row.portrait ? '' : 'an example bespoke proof: '}${b.design}, and an order link. They reply “${b.thanks.replace(/ [🤍😄]$/u, '')}”.`;
  const description = row.portrait
    ? `Silent ${SECONDS}-second portrait plaque film. “${row.hook} — ${row.sub}”. A photo and portrait artwork show the route to an engraved plaque. Example wording: “${row.words}”. ${chat} “${row.end}”.`
    : `Silent ${SECONDS}-second ${name.toLowerCase()} film. “${row.hook} — ${row.sub}”. The designer lays out “${row.words}” on a ${row.start.width} × ${row.start.height} mm plaque${row.start.wood ? ' on wood backing' : ''}${row.start.groundStake ? ' and a ground stake' : ''}, then shows ${row.swaps.join(', ')}. ${chat} “${row.end}”.`;
  const descriptor = {
    id:`${row.slug}-20261106-${VERSION}`, name, description,
    disclosure:row.disclosure, footnote:row.footnote,
    file:`/videos/${row.slug}-20261106-${VERSION}.mp4`, poster:`/videos/${row.slug}-20261106-${VERSION}.webp`, seconds:SECONDS, duration:FRAMES/30,
    // Design while the designer shows, WhatsApp during the chat, both on the end card. Portrait is a
    // photo-submission route, not the instant text designer, so only its WhatsApp action is cued.
    cues:row.portrait ? [{start:0,cue:'whatsapp'}] : [{start:0,cue:'design'},{start:CHAT_IN/30,cue:'whatsapp'},{start:END_IN/30,cue:'both'}],
  };
  files.push([file, `public${descriptor.file}`], [poster, `public${descriptor.poster}`]);
  return [row.slug, descriptor];
}));
// Validate the whole batch before copying any assets. Earlier versions were never live, so they are replaced.
for (const old of fs.readdirSync('public/videos')) if (/^[a-z-]+-plaques-20261106-v\d+\.(mp4|webp)$/.test(old) && !old.includes(`-${VERSION}.`)) fs.rmSync(path.join('public/videos', old));
for (const [from,to] of files) fs.copyFileSync(from,to);
fs.writeFileSync('services/categoryFilms.mjs', '// Generated from the approved category film manifest by scripts/import-category-films.mjs.\n// The original homepage and /video descriptor stays in promoVideo.mjs.\nexport const categoryFilms = '+JSON.stringify(films,null,2)+';\n\nexport const categoryFilmFor = (slug) => categoryFilms[slug];\n');
console.log(`Imported ${rows.length} films and posters, with independent IDs, disclosures and cue descriptors.`);
