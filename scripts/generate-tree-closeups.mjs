// Memorial tree close-ups made with the designer's own realistic preview (generateRealisticView): the owner asked
// for "the plaques AI thing that has the ai image stuff built in" (msg 5796, 24 Oct 2026). The plaque face is the
// designer's own stencil, rendered by output/catalogue-wording/render-wording-stencils.cjs from the same wording
// file, and the built-in prompt is used unchanged. The scene brief carries the owner's rules: a close-up with no
// people (msg 5778) and the Nicola-order mount, an oak board on one black steel ground stake (msg 5762).
// Run with the project's Gemini key, without printing it (from the Vercel-linked projects/instaplaque folder):
//   vercel env run -e development -- node <repo>/scripts/generate-tree-closeups.mjs WORDING STENCIL_DIR OUT_DIR [slug ...]
// WORDING entries: { slug, offer, overrides, lines, setting, ground, light, side }. An entry may instead give a
// complete scene `brief` and an `aspectRatio` (default 3:2), e.g. the memorial page hero (owner msg 5876).
// Env: VERSIONS (default 2 per slug), CONCURRENCY (default 3), IMAGE_SIZE (default 4K, as in the designer).
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { merchantOffers } from '../services/merchantCatalogue.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [wordingFile, stencilDir, outDir, ...only] = process.argv.slice(2);
if (!wordingFile || !stencilDir || !outDir) throw new Error('Usage: generate-tree-closeups.mjs WORDING STENCIL_DIR OUT_DIR [slug ...]');
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set (run through vercel env run).');
const items = JSON.parse(fs.readFileSync(wordingFile, 'utf8')).filter(item => !only.length || only.includes(item.slug));
const versions = Number(process.env.VERSIONS || 2);
const imageSize = process.env.IMAGE_SIZE || '4K';
const logFile = path.join(outDir, 'builtin-log.jsonl');
fs.mkdirSync(outDir, { recursive: true });

const bundleDir = path.join(root, 'output', 'tree-closeups');
fs.mkdirSync(bundleDir, { recursive: true });
const bundle = path.join(bundleDir, '.gemini-node.mjs');
await build({
  stdin: { contents: "export { generateRealisticView } from './services/geminiService.ts';\nexport { INITIAL_STATE } from './types.ts';", resolveDir: root, loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', outfile: bundle, external: ['@google/genai'], logLevel: 'warning',
});
const { generateRealisticView, INITIAL_STATE } = await import(pathToFileURL(bundle).href);

export function sceneBrief(item) {
  return [
    `Asset: a close-up photograph of this memorial tree plaque standing in place, for the memorial tree plaques page of a UK plaque maker's website. Setting: ${item.setting}.`,
    'Mount, always the same: the plaque on its light oak backing board is held upright by ONE chunky black powder-coated steel ground stake: a solid square steel bar about 30 mm thick, satin black, fixed by a bracket to the middle of the back of the board and pushed straight down into the ground. Nothing else holds it: no wooden post, no second leg, no frame, and it is not fixed to the tree, a fence, a wall or a planter. It does not hang on a wall.',
    `Placement: the plaque stands in ${item.ground} at the foot of the young tree, facing the camera. The tree's slim trunk, about 4 cm thick, with a black rubber tree tie and a wooden support stake, rises just behind the board on its ${item.side} side.`,
    'Scale: the oak board is only 235 x 173 mm, about the size of a hardback book. Keep it true to that size against the tree trunk, the grass and the soil.',
    'Composition: a close-up. The camera is about 60 cm from the plaque at the height of the board, looking at it almost straight on, 50 mm lens. The board is sharp in the middle of the frame and fills about 60% of the frame width, with a little space above it; below it the black stake runs straight down into the ground at the bottom of the frame. Everything behind the plaque and the trunk is softly out of focus.',
    `Light: ${item.light}, outdoors, with a soft natural shadow and real texture in the oak grain, the metal, the grass and the bark.`,
    'No people and no hands anywhere in the photo. No other signs, labels, plant tags, logos or words.',
  ].join('\n');
}

const extension = buffer => (buffer[0] === 0x89 ? 'png' : buffer[0] === 0xff ? 'jpg' : buffer.subarray(8, 12).toString() === 'WEBP' ? 'webp' : 'bin');
const jobs = items.flatMap(item => Array.from({ length: versions }, () => item));
let next = 0;

async function worker() {
  while (next < jobs.length) {
    const item = jobs[next++];
    const offer = merchantOffers.find(entry => entry.slug === item.offer);
    if (!offer) throw new Error(`Unknown offer ${item.offer}`);
    const state = { ...INITIAL_STATE, ...offer.preset, ...(item.overrides || {}), inscriptionScale: 1, generatedSvgContent: '<g/>' };
    const stencil = fs.readFileSync(path.join(stencilDir, `${item.slug}.png`)).toString('base64');
    const attempt = fs.readdirSync(outDir).filter(name => name.startsWith(`${item.slug}.builtin.v`)).length + 1;
    const reserved = path.join(outDir, `${item.slug}.builtin.v${attempt}.pending`);
    fs.writeFileSync(reserved, '');
    const started = Date.now();
    let file = null;
    let error = '';
    try {
      const data = await generateRealisticView(stencil, state, { prompt: item.brief || sceneBrief(item), aspectRatio: item.aspectRatio || '3:2', imageSize });
      if (data) {
        const buffer = Buffer.from(data, 'base64');
        file = `${item.slug}.builtin.v${attempt}.${extension(buffer)}`;
        fs.writeFileSync(path.join(outDir, file), buffer);
      } else error = 'no image returned';
    } catch (caught) {
      error = String(caught?.message || caught).slice(0, 300);
    }
    fs.rmSync(reserved, { force: true });
    // The built-in call returns no usage data; the cost is the published per-image price for this model and size.
    const cost = file ? ({ '1K': 0.067, '2K': 0.101, '4K': 0.151 }[imageSize] || 0.151) : 0;
    const record = { time: new Date().toISOString(), slug: item.slug, model: 'gemini-3.1-flash-image-preview (generateRealisticView)', imageSize, attempt, seconds: Math.round((Date.now() - started) / 1000), file, error, cost_usd_est: cost };
    fs.appendFileSync(logFile, `${JSON.stringify(record)}\n`);
    console.log(item.slug, `v${attempt}`, file || 'FAILED', `${record.seconds}s`, `$${cost.toFixed(3)}`, error);
  }
}

await Promise.all(Array.from({ length: Number(process.env.CONCURRENCY || 3) }, worker));
const total = fs.readFileSync(logFile, 'utf8').trim().split('\n').reduce((sum, line) => sum + JSON.parse(line).cost_usd_est, 0);
console.log(`done; logged estimate for all runs $${total.toFixed(2)}`);
