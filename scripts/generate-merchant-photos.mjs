// Realistic catalogue photos made with the designer's own realistic preview
// (generateRealisticView), one per merchant offer, from the stencils written by
// render-merchant-stencils.cjs. Each photo is checked by the text model and
// regenerated (up to MAX_ATTEMPTS) when the inscription, shape, backing or fixings are wrong.
// Run with the project's Gemini key, without printing it:
//   vercel env run -e development -- node scripts/generate-merchant-photos.mjs
// Options: ONLY=slug,slug  LIMIT=n  CONCURRENCY=3  MAX_ATTEMPTS=3  FORCE=1
// Output: output/merchant-photos/raw/<slug>.png and qa/<slug>.json; publish with
// scripts/publish-merchant-photos.py after review.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { PLAQUE_TEXT_MODEL } from '../services/aiModels.mjs';

const root = process.cwd();
const outDir = path.resolve('output/merchant-photos');
const stencilDir = path.join(outDir, 'stencils');
const rawDir = path.join(outDir, 'raw');
const qaDir = path.join(outDir, 'qa');
for (const dir of [rawDir, qaDir]) fs.mkdirSync(dir, { recursive: true });
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set (run through vercel env run).');

const bundle = path.join(outDir, '.gemini-node.mjs');
await build({
  stdin: { contents: "export { generateRealisticView } from './services/geminiService.ts';\nexport { INITIAL_STATE } from './types.ts';", resolveDir: root, loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: bundle, external: ['@google/genai'], logLevel: 'warning',
});
const { generateRealisticView, INITIAL_STATE } = await import(pathToFileURL(bundle).href);
const { GoogleGenAI } = await import('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const hash = text => [...text].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
const pick = (list, slug) => list[hash(slug) % list.length];

const benchScenes = [
  'to the top backrest rail of a weathered teak memorial bench in a quiet UK park, with lawn and trees softly out of focus behind, in soft overcast daylight',
  'to the backrest of a dark green painted wooden garden bench, with a flower border softly out of focus behind, in gentle morning light',
  'to the backrest of a silvery weathered oak bench on a clifftop path, with the sea and sky softly blurred behind, in soft natural light',
  'to the backrest of a honey-toned hardwood bench in a churchyard, with an old stone wall and a yew hedge softly blurred behind, in soft daylight',
];
const wallScenes = [
  'to a weathered red-brick garden wall, with a few ivy leaves at one edge of the frame, in soft daylight',
  'to a honey-coloured Cotswold stone wall in a memorial garden, in soft afternoon light',
  'to a smooth pale rendered garden wall, with the edge of a flowering shrub at one side of the frame, in gentle daylight',
  'to a grey natural stone wall in a quiet churchyard memorial garden, in soft overcast light',
];
const woodScenes = [
  'to a painted sage-green wall in a quiet hallway, in soft window light from one side',
  'to a warm white plastered wall inside a village church, in soft diffused light',
  'to a pale grey painted wall in a calm reading room, in soft natural light',
  'to a deep navy painted wall in a clubhouse, in soft warm light',
];

export function sceneBrief(offer) {
  const p = offer.preset;
  const bench = offer.format === 'Bench';
  const scene = bench ? pick(benchScenes, offer.slug) : p.wood ? pick(woodScenes, offer.slug) : pick(wallScenes, offer.slug);
  const fill = bench ? 'about 70% of the frame width' : p.height > p.width ? 'about 60% of the frame height'
    : p.shape === 'circle' ? 'about 55% of the frame width, with at least a fifth of the frame clear on every side, so the whole circle is visible' : 'about 60% of the frame width';
  const brick = scene.includes('brick')
    ? ` UK bricks are 215 × 65 mm with 10 mm mortar joints, so the plaque spans about ${(p.width / 225).toFixed(1)} bricks across and ${(p.height / 75).toFixed(1)} brick courses top to bottom.`
    : '';
  const slat = bench ? ` The rail is deeper than the plaque (about ${p.height + 40} mm), so a strip of timber shows above and below it.` : '';
  return [
    'Asset: the main product photograph for this plaque on an online shop.',
    `Setting: the finished plaque${p.wood ? ' on its wood backing board' : ''} is fixed ${scene}.`,
    `Composition: square photo. The plaque is centred and fills ${fill}, with the setting visible on every side. Shot almost straight on at eye level, a few degrees off-axis at most, with an 85 mm lens. The whole plaque face is in sharp focus; anything behind the mounting surface is softly out of focus.`,
    `Scale: the plaque is ${p.width} × ${p.height} mm${p.wood ? ' on a board about 25 mm larger all round' : ''}; keep the setting true to that scale.${brick}${slat}`,
    `Fixing: it is fixed flat through its own ${p.fixingHoleCount} fixing positions exactly as described in the product details. The black dots in the stencil only mark those positions: show real ${p.fixing === 'caps' ? 'metal caps' : 'metal screw heads'} there, never black dots or holes.${p.shape !== 'rect' ? ' The two side caps sit well clear of the lettering, with a gap at least as wide as a letter, exactly as in the stencil.' : ''}`,
    `Lettering: the same size, spacing and line breaks as the stencil. Do not add a separator line under or between the lines of text; the only engraved lines are the border.${p.textColor === 'cream' ? ' The stencil draws the lettering and border in black only for contrast: on the plaque they are filled warm cream, never black.' : ''}`,
    ...(p.material === 'polished-stainless' ? ['Mirror finish: choose the camera angle and surroundings so the plaque reflects only a plain, light, softly blurred background such as a pale wall or sky. Every word must stay clearly legible, with no dark objects, windows, shelves, pews, trees or furniture reflected behind the lettering, and the caps must stay perfectly round.'] : []),
    ...(p.material === 'polished-brass' ? ['Mirror-polished brass: the plate must read unmistakably as bright, warm, golden brass, never pale, cream, white or silver. Choose an angle where it reflects warm, softly lit, plain surroundings, with every word clearly legible and no dark objects, windows or furniture reflected behind the lettering.'] : []),
    'Look: natural light, true-to-life colour, a realistic soft shadow from the plaque onto the surface, real texture in the wall or timber. It must look like a real photograph taken with a good camera, not a 3D render or an illustration.',
    'Exclude: people, hands, flowers or objects on the plaque, any other signs, words or logos, watermarks, and frames or borders around the photo.',
  ].join('\n');
}

const textColour = offer => (offer.preset.textColor === 'cream' ? 'warm cream' : 'black');
const shapeName = offer => ({ rect: 'rectangle with square corners', oval: 'oval', circle: 'circle' })[offer.preset.shape];
const backingName = offer => (offer.preset.wood ? `${offer.preset.woodTone === 'dark' ? 'dark' : 'light'} wood backing board behind the metal plate` : 'no wood backing; the metal plate is fixed directly to the surface');
const fixingName = offer => `${offer.preset.fixingHoleCount} ${offer.preset.fixing === 'screws' ? 'small screw heads' : 'flat round decorative caps'}`;

async function check(offer, base64) {
  const prompt = `You are checking a product photo of an engraved metal plaque before it goes on a shop page.
Expected:
- Shape: ${shapeName(offer)}, ${offer.preset.width} × ${offer.preset.height} mm (${offer.preset.width > offer.preset.height ? 'landscape' : offer.preset.width < offer.preset.height ? 'portrait' : 'square'}).
- Material: ${offer.label}.
- Backing: ${backingName(offer)}.
- Fixings visible on the plaque face: ${fixingName(offer)}.
- Inscription, exactly three lines in ${textColour(offer)} lettering: "In loving memory of" / "ALEX MORGAN" / "Forever in our hearts".
Answer in JSON only with keys:
inscription_lines (array of the lines exactly as you read them), inscription_exact (true only if the wording, spelling and line order match exactly),
shape_ok, material_ok, backing_ok, fixings_seen (integer), fixings_ok, extra_text_or_symbols (true only if words, letters, numbers or decorative symbols appear that are not in the expected inscription; engraved border lines, screw slots, caps and wood or wall texture do not count),
added_lines (true if any line appears under, over or between the lines of text, apart from the border around the edge), fixings_touch_text (true if any cap or screw touches or overlaps a letter),
fixings_look_metal (false if any fixing looks like a flat black dot or hole instead of a metal cap or screw head), plaque_square_on (false only if the plaque is shot from a steep angle, more than about 20 degrees off-axis, or hangs visibly crooked; normal slight perspective is fine),
all_words_clearly_legible (false if reflections, glare or shadows make any word hard to read), colour_matches_material (false if brass looks pale, white, cream or silver rather than gold, or if stainless steel looks gold),
lettering_colour_ok (false unless the lettering is ${textColour(offer)}),
looks_like_real_photo, plaque_fully_in_frame, defects (short string, empty if none).`;
  const response = await ai.models.generateContent({
    model: PLAQUE_TEXT_MODEL,
    contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: base64 } }] },
    config: { responseMimeType: 'application/json', temperature: 0 },
  });
  const text = response.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '{}';
  const result = JSON.parse(text);
  result.pass = Boolean(result.inscription_exact && result.shape_ok && result.backing_ok && result.fixings_ok
    && !result.extra_text_or_symbols && !result.added_lines && !result.fixings_touch_text && result.all_words_clearly_legible
    && result.fixings_look_metal !== false && result.plaque_square_on !== false && result.colour_matches_material !== false
    && result.lettering_colour_ok !== false
    && result.looks_like_real_photo && result.plaque_fully_in_frame);
  return result;
}

const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 3);
let queue = merchantOffers.filter(offer => offer.imageKind === 'render' && (!only || only.has(offer.slug)));
// A finished offer has its QA record; an interrupted one is generated again.
// RECHECK=1: re-check photos accepted by an older version of the checks, regenerating failures.
const checkedWithCurrentRules = slug => {
  const file = path.join(qaDir, `${slug}.json`);
  if (!fs.existsSync(file)) return false;
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  return record.attempts.some(item => item.qa && 'colour_matches_material' in item.qa);
};
if (process.env.RECHECK) queue = queue.filter(offer => fs.existsSync(path.join(qaDir, `${offer.slug}.json`)) && !checkedWithCurrentRules(offer.slug));
else if (!process.env.FORCE) queue = queue.filter(offer => !fs.existsSync(path.join(qaDir, `${offer.slug}.json`)));
if (process.env.LIMIT) queue = queue.slice(0, Number(process.env.LIMIT));
console.log(`Generating ${queue.length} photos with ${PLAQUE_TEXT_MODEL} checks`);

const summary = [];
async function run(offer) {
  const stencil = fs.readFileSync(path.join(stencilDir, `${offer.slug}.png`)).toString('base64');
  const inscriptionScale = offer.preset.shape === 'circle' ? 0.7 : offer.preset.shape === 'oval' ? 0.8 : 1;
  const state = { ...INITIAL_STATE, ...offer.preset, inscriptionScale, generatedSvgContent: '<g/>' };
  const attempts = [];
  const existing = path.join(rawDir, `${offer.slug}.png`);
  if (process.env.RECHECK && fs.existsSync(existing)) {
    const qa = await check(offer, fs.readFileSync(existing).toString('base64'));
    attempts.push({ attempt: 0, file: `${offer.slug}.png`, recheck: true, qa });
  }
  for (let attempt = attempts.length && attempts[0].qa.pass ? maxAttempts + 1 : 1; attempt <= maxAttempts; attempt++) {
    const started = Date.now();
    let image;
    try {
      image = await generateRealisticView(stencil, state, { prompt: sceneBrief(offer), aspectRatio: '1:1', imageSize: '2K' });
    } catch (error) {
      attempts.push({ attempt, error: String(error?.message || error).slice(0, 300) });
      continue;
    }
    if (!image) { attempts.push({ attempt, error: 'no image returned' }); continue; }
    let qa;
    try { qa = await check(offer, image); } catch (error) { qa = { pass: false, defects: `check failed: ${String(error?.message || error).slice(0, 200)}` }; }
    const file = path.join(rawDir, `${offer.slug}${attempt === 1 && !process.env.RECHECK ? '' : `.a${attempt + (process.env.RECHECK ? 1 : 0)}`}.png`);
    fs.writeFileSync(file, Buffer.from(image, 'base64'));
    attempts.push({ attempt, file: path.basename(file), seconds: Math.round((Date.now() - started) / 1000), qa });
    if (qa.pass) break;
  }
  const passed = attempts.find(item => item.qa?.pass);
  // Keep the passing attempt (or the first image) as <slug>.png for publishing.
  const chosen = passed || attempts.find(item => item.file);
  if (chosen && chosen.file !== `${offer.slug}.png`) {
    const main = path.join(rawDir, `${offer.slug}.png`);
    if (fs.existsSync(main)) fs.renameSync(main, path.join(rawDir, `${offer.slug}.a1.png`));
    fs.copyFileSync(path.join(rawDir, chosen.file), main);
  }
  fs.writeFileSync(path.join(qaDir, `${offer.slug}.json`), JSON.stringify({ slug: offer.slug, brief: sceneBrief(offer), chosen: chosen?.file || null, pass: Boolean(passed), attempts }, null, 2));
  summary.push({ slug: offer.slug, pass: Boolean(passed), attempts: attempts.length });
  console.log(`${passed ? 'ok  ' : 'FAIL'} ${offer.slug} (${attempts.length} attempt${attempts.length === 1 ? '' : 's'})${passed ? '' : ` ${attempts.at(-1)?.qa?.defects || attempts.at(-1)?.error || ''}`}`);
}

const concurrency = Number(process.env.CONCURRENCY || 3);
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) await run(queue.shift());
}));
fs.writeFileSync(path.join(outDir, `summary-${Date.now()}.json`), JSON.stringify(summary, null, 2));
console.log(`Done: ${summary.filter(item => item.pass).length}/${summary.length} passed checks`);
