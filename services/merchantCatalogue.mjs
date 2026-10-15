import { estimatePlaquePrice } from './checkoutPolicy.mjs';

// Exact advertised variants, not every possible bespoke size or inscription.
// Stable IDs preserve Google's history when catalogue copy changes.
export const merchantFinishes = [
  ['brushed-stainless', 'Brushed stainless steel', 'stainless', 'silver'],
  ['polished-stainless', 'Polished stainless steel', 'stainless', 'silver'],
  ['brushed-brass', 'Brushed brass', 'brass', 'gold'],
  ['polished-brass', 'Polished brass', 'brass', 'gold'],
  ['orbital-brass-matt-lacquer', 'Orbital brass', 'brass', 'gold'],
  ['aged-brass', 'Aged brass', 'aged', 'brown'],
];
export const merchantFormats = [
  [150, 50, 'Bench'], [225, 75, 'Bench'], [225, 65, 'Bench'],
  [150, 75, 'Bench'], [150, 65, 'Bench'], [200, 50, 'Bench'],
  [210, 148, 'A5 landscape'], [148, 210, 'A5 portrait'],
  [297, 210, 'A4 landscape'], [210, 297, 'A4 portrait'],
  [200, 150, 'Wall'], [300, 200, 'Wall'], [400, 300, 'Wall'],
];
const entries = [];
function add(material, label, cue, colour, width, height, format, shape = 'rect', woodTone = null) {
  const bench = format === 'Bench';
  const twoHoles = shape === 'oval' || shape === 'circle' || (Math.min(width, height) <= 90 && Math.max(width, height) / Math.min(width, height) >= 3);
  const wood = woodTone !== null;
  const backing = wood ? ` with ${woodTone === 'dark' ? 'dark' : 'light'} wood backing` : '';
  const shapeLabel = shape === 'rect' ? 'rectangular' : shape === 'circle' ? 'circular' : 'oval';
  const size = `${width} × ${height} mm`;
  let slug = `${material}-${width}x${height}-${shape}${wood ? `-${woodTone}-wood` : ''}-plaque`;
  let image = `/site-images/merchant/${slug}.jpg`;
  let imageKind = 'render';
  if (material === 'brushed-stainless' && width === 210 && height === 148 && shape === 'rect' && !wood) {
    slug = 'a5-brushed-steel-personalised-plaque'; image = '/site-images/merchant-steel-a5.webp'; imageKind = 'ai';
  }
  const preset = {
    width, height, material, shape, wood, woodTone: woodTone || 'light', woodEdge: wood ? 'bevel' : 'square',
    fixing: bench ? 'screws' : 'caps', fixingHoleCount: twoHoles ? 2 : 4,
    capSize: Math.max(width, height) >= 297 && Math.min(width, height) >= 210 ? 15 : 10,
    border: true, borderStyle: bench ? 'single' : 'double', cornerRadius: 0,
    textColor: material === 'aged-brass' ? 'cream' : 'black', reverseEtch: false,
    ageIntensity: 0.5, designStyle: 'auto', safeMargin: 10,
  };
  const productionDays = wood ? (format.startsWith('A4') || format.startsWith('A5') ? 10 : 15) : shape !== 'rect' ? 15 : material === 'aged-brass' ? 7 : 5;
  const title = `Personalised ${label.toLowerCase()} ${bench ? 'bench ' : ''}${shape !== 'rect' ? shapeLabel + ' ' : ''}plaque ${size}${backing}`;
  const description = `${size} ${shapeLabel} ${label.toLowerCase()} plaque${backing}. ${preset.fixingHoleCount} ${preset.fixing === 'caps' ? 'decorative fixing caps' : 'screw fixings'}, ${preset.textColor} paint-filled etched lettering${wood ? '' : ', no wood backing'}. Your wording and proof approval included. UK delivery included. Estimated production ${productionDays} working days after proof approval and payment.`;
  entries.push({slug, title, description, label, materialCue: cue, colour, size, format, image, imageKind, productionDays, preset, price: estimatePlaquePrice(preset), groupId: `plaque-${shape}-${bench ? 'screws' : 'caps'}-${woodTone || 'metal'}`});
}
for (const [material, label, cue, colour] of merchantFinishes) {
  for (const [width, height, format] of merchantFormats) {
    add(material, label, cue, colour, width, height, format);
    if (format !== 'Bench') for (const tone of ['dark', 'light']) add(material, label, cue, colour, width, height, format, 'rect', tone);
  }
  add(material, label, cue, colour, 250, 150, 'Oval', 'oval');
  add(material, label, cue, colour, 200, 200, 'Circle', 'circle');
}
// Keep the already-submitted polished brass offer, with unchanged ID/image/configuration.
add('polished-brass', 'Polished brass', 'brass', 'gold', 200, 100, 'Bench');
const legacy = entries[entries.length - 1];
Object.assign(legacy, {slug: 'polished-brass-bench-plaque-200x100', image: '/site-images/merchant-brass-bench.webp', imageKind: 'ai', productionDays: 15});
legacy.description = legacy.description.replace('production 5 working', 'production 15 working');
const shortMaterials = { 'brushed-stainless': 'bs', 'polished-stainless': 'ps', 'brushed-brass': 'bb', 'polished-brass': 'pb', 'orbital-brass-matt-lacquer': 'ob', 'aged-brass': 'ab' };
for (const entry of entries) {
  const originalId = `instaplaque-${entry.slug}`;
  const p = entry.preset;
  entry.offerId = originalId.length <= 50 ? originalId : `ip-${shortMaterials[p.material]}-${p.width}x${p.height}-${p.shape}-${p.wood ? p.woodTone : 'metal'}`;
}
export const merchantOffers = entries;
