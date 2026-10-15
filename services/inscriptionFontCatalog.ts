// One catalogue for the designer's web fonts and the production outliner. The
// preview and the outlined proof/production files load exactly the same pinned
// font files, so what the customer approves is what is made.
export const INSCRIPTION_FONT_VERSION = '5.3.0';

export type InscriptionFontStyle = 'normal' | 'italic';

export const inscriptionFontVariants: Record<string, { normal: number[]; italic?: number[] }> = {
  "Abril Fatface": { normal: [400] },
  "Alex Brush": { normal: [400] },
  "Allura": { normal: [400] },
  "Bebas Neue": { normal: [400] },
  "Bitter": { normal: [400, 700] },
  "Caveat": { normal: [400, 700] },
  "Cinzel": { normal: [400, 700, 900] },
  "Dancing Script": { normal: [400, 700] },
  "EB Garamond": { normal: [400, 600, 700] },
  "Great Vibes": { normal: [400] },
  "Lato": { normal: [300, 400, 700] },
  "Lora": { normal: [400, 600, 700], italic: [400] },
  "Merriweather": { normal: [300, 400, 700] },
  "Montserrat": { normal: [400, 600, 700, 800] },
  "Open Sans": { normal: [300, 400, 600, 700] },
  "Oswald": { normal: [400, 600, 700] },
  "Pacifico": { normal: [400] },
  "Pinyon Script": { normal: [400] },
  "Playfair Display": { normal: [400, 700, 900], italic: [400] },
  "Raleway": { normal: [300, 400, 500, 700] },
  "Roboto Slab": { normal: [300, 500, 700] },
  "Satisfy": { normal: [400] },
};

// Fontsource subsets, with the unicode ranges from its own @font-face rules.
export const inscriptionFontSubsets = [
  {
    name: 'latin',
    unicodeRange: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  },
  {
    name: 'latin-ext',
    unicodeRange: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  },
] as const;

export type InscriptionFontSubset = typeof inscriptionFontSubsets[number]['name'];

const familiesWithoutLatinExt = new Set(['Satisfy']);

// Fonts that kern only through a legacy 'kern' table. Browsers using HarfBuzz
// shift the right-hand glyph of such a pair without reporting the shift in the
// character positions the outliner reads, so these are previewed unkerned.
export const legacyKernFamilies = ['Satisfy'];

export const inscriptionFontSubsetsFor = (family: string): InscriptionFontSubset[] =>
  familiesWithoutLatinExt.has(family) ? ['latin'] : ['latin', 'latin-ext'];

// Characters a font lacks (for example ŵ in Lato or Ł in Satisfy) come from this
// face in both the preview and production, instead of a device's system font.
export const INSCRIPTION_FALLBACK_FAMILY = 'Open Sans';

export const inscriptionFallbackWeight = (weight: number) =>
  matchInscriptionFontWeight(inscriptionFontVariants[INSCRIPTION_FALLBACK_FAMILY].normal, weight);

const parsedRanges = new Map<string, Array<[number, number]>>();
export const inscriptionSubsetCovers = (subset: InscriptionFontSubset, codePoint: number) => {
  if (!parsedRanges.has(subset)) {
    const range = inscriptionFontSubsets.find(s => s.name === subset)!.unicodeRange;
    parsedRanges.set(subset, range.split(',').map((part) => {
      const [start, end] = part.trim().replace(/^U\+/i, '').split('-');
      return [Number.parseInt(start, 16), Number.parseInt(end || start, 16)] as [number, number];
    }));
  }
  return parsedRanges.get(subset)!.some(([start, end]) => codePoint >= start && codePoint <= end);
};

export const inscriptionFontUrl = (
  family: string,
  weight: number,
  style: InscriptionFontStyle,
  subset: InscriptionFontSubset,
  format: 'woff' | 'woff2',
) => {
  const slug = family.toLowerCase().replace(/\s+/g, '-');
  return `https://cdn.jsdelivr.net/npm/@fontsource/${slug}@${INSCRIPTION_FONT_VERSION}/files/${slug}-${subset}-${weight}-${style}.${format}`;
};

export const inscriptionFontWeight = (weight: string | number | null | undefined) => {
  const value = String(weight ?? '').trim().toLowerCase();
  if (value === 'bold' || value === 'bolder') return 700;
  if (value === 'lighter') return 300;
  if (!value || value === 'normal' || value === 'regular') return 400;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(1000, Math.max(1, parsed)) : 400;
};

// The face a browser draws for a requested weight, following the CSS Fonts
// matching rules, so production outlines use the same face as the preview.
export const matchInscriptionFontWeight = (available: number[], desired: number) => {
  if (!available.length || available.includes(desired)) return desired;
  const sorted = [...available].sort((a, b) => a - b);
  const below = sorted.filter(w => w < desired).reverse();
  const above = sorted.filter(w => w > desired);
  if (desired >= 400 && desired <= 500) {
    const upTo500 = above.filter(w => w <= 500);
    return upTo500[0] ?? below[0] ?? above[0];
  }
  return desired < 400 ? (below[0] ?? above[0]) : (above[0] ?? below[0]);
};

export const inscriptionFontFaces = () => Object.entries(inscriptionFontVariants).flatMap(([family, variants]) =>
  (['normal', 'italic'] as const).flatMap(style => (variants[style] || []).map(weight => ({ family, weight, style }))));
