// Catalogue offers with their price and example wording, as JSON on stdout, for scripts/photo-review/build.py.
// Usage (from the repo): node scripts/photo-review/offers.mjs
import fs from 'node:fs';
import { merchantOffers } from '../../services/merchantCatalogue.mjs';

const metricsFile = new URL('../../output/catalogue-wording/metrics.json', import.meta.url);
const metrics = fs.existsSync(metricsFile) ? JSON.parse(fs.readFileSync(metricsFile, 'utf8')) : {};
const offers = merchantOffers.map(offer => ({
  slug: offer.slug,
  label: offer.label,
  size: offer.size,
  format: offer.format,
  shape: offer.preset.shape,
  wood: offer.preset.wood ? offer.preset.woodTone : '',
  price: offer.price,
  kind: offer.imageKind,
  image: offer.image,
  words: ((metrics[offer.slug] || {}).lines || []).filter(line => line[0] !== 'gap').map(line => line[1]),
}));
process.stdout.write(JSON.stringify(offers));
