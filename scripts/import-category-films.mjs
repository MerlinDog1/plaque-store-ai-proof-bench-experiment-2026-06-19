// Import only completed renders. Never modifies the film project's manifest or source assets.
// node scripts/import-category-films.mjs /absolute/path/to/category-film-output
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const source = process.argv[2];
assert(source && path.isAbsolute(source), 'Pass the absolute film output directory');
const rows = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
const slugs = ['memorial-plaques','bench-plaques','garden-plaques','tree-memorial-plaques','opening-plaques','brass-plaques','stainless-steel-plaques','custom-plaques','portrait-plaques','church-plaques','house-name-plaques','professional-brass-plaques','donor-recognition-plaques'];
assert.deepEqual(rows.map(row => row.slug).sort(), [...slugs].sort());
const files = [];
const films = Object.fromEntries(rows.map(row => {
  const file = path.join(source, 'films', row.slug, 'web.mp4');
  const poster = path.join(source, 'films', row.slug, 'poster.webp');
  assert(fs.statSync(file).size > 10000 && fs.statSync(poster).size > 1000, `${row.slug}: incomplete render`);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v','error','-show_streams','-show_format','-of','json',file], {encoding:'utf8'}));
  const video = probe.streams.find(stream => stream.codec_type === 'video');
  assert(video?.codec_name === 'h264' && video.width / video.height === 0.8 && probe.streams.length === 1, `${row.slug}: silent 4:5 H.264 required`);
  assert(Math.abs(Number(probe.format.duration) - 658/30) < 0.1, `${row.slug}: unexpected duration`);
  assert(row.footnote && row.disclosure && row.words && row.swaps?.length, `${row.slug}: missing descriptive facts`);
  const name = row.slug.replace(/-/g,' ').replace(/^./, c => c.toUpperCase());
  const description = row.portrait
    ? `Silent 22-second portrait plaque film. “${row.hook} — ${row.sub}”. A photo and portrait artwork show the route to an engraved plaque. Example wording: “${row.words}”. An example WhatsApp conversation asks: “${row.chat}”. A proof and order link follow. “${row.end}”.`
    : `Silent 22-second ${name.toLowerCase()} film. “${row.hook} — ${row.sub}”. The designer lays out “${row.words}” on a ${row.start.width} × ${row.start.height} mm plaque${row.start.wood ? ' on wood backing' : ''}${row.start.groundStake ? ' and a ground stake' : ''}, then shows ${row.swaps.join(', ')}. An example WhatsApp conversation asks: “${row.chat}”. A proof and order link follow. “${row.end}”.`;
  const descriptor = {
    id:`${row.slug}-20261106-v1`, name, description,
    disclosure:row.disclosure, footnote:row.footnote,
    file:`/videos/${row.slug}-20261106-v1.mp4`, poster:`/videos/${row.slug}-20261106-v1.webp`, seconds:22,
    // Standard cuts retain the original frame-332 / frame-566 windows. Portrait is a photo-submission route,
    // not the instant text designer, so only its WhatsApp action is cued.
    cues:row.portrait ? [{start:0,cue:'whatsapp'}] : [{start:0,cue:'design'},{start:332/30,cue:'whatsapp'},{start:566/30,cue:'both'}],
  };
  files.push([file, `public${descriptor.file}`], [poster, `public${descriptor.poster}`]);
  return [row.slug, descriptor];
}));
// Validate the whole batch before copying any assets.
for (const [from,to] of files) fs.copyFileSync(from,to);
fs.writeFileSync('services/categoryFilms.mjs', '// Generated from the approved category film manifest by scripts/import-category-films.mjs.\n// The original homepage and /video descriptor stays in promoVideo.mjs.\nexport const categoryFilms = '+JSON.stringify(films,null,2)+';\n\nexport const categoryFilmFor = (slug) => categoryFilms[slug];\n');
console.log(`Imported ${rows.length} films and posters, with independent IDs, disclosures and cue descriptors.`);
