// Only the interactive designer and proof exports need the inscription catalogue.
// The @font-face rules point at the same pinned files the production outliner
// uses (see inscriptionFontCatalog.ts); browsers download only the faces in use.
import {
  INSCRIPTION_FALLBACK_FAMILY,
  inscriptionFallbackWeight,
  inscriptionFontFaces,
  inscriptionFontSubsets,
  inscriptionFontSubsetsFor,
  inscriptionFontUrl,
  legacyKernFamilies,
} from './inscriptionFontCatalog';

const faceRule = (family: string, weight: number, style: string, file: { family: string; weight: number; style: 'normal' | 'italic' }) =>
  inscriptionFontSubsetsFor(file.family).map((subset) => {
    const range = inscriptionFontSubsets.find(s => s.name === subset)!.unicodeRange;
    return `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;`
      + `src:url(${inscriptionFontUrl(file.family, file.weight, file.style, subset, 'woff2')}) format('woff2'),`
      + `url(${inscriptionFontUrl(file.family, file.weight, file.style, subset, 'woff')}) format('woff');`
      + `unicode-range:${range};}`;
  });

// Within a family, later @font-face rules are tried first for a character and a
// face without the glyph passes it on. Each family's fallback rules therefore
// come first, so they are used only for characters the family's own files lack.
const fontFaceCss = () => inscriptionFontFaces().flatMap(({ family, weight, style }) => [
  ...(family === INSCRIPTION_FALLBACK_FAMILY ? [] : faceRule(family, weight, style, {
    family: INSCRIPTION_FALLBACK_FAMILY, weight: inscriptionFallbackWeight(weight), style: 'normal',
  })),
  ...faceRule(family, weight, style, { family, weight, style }),
]).join('\n');

// The production outliner draws one glyph per character, or one per standard
// ligature such as "fi". Preview text shows the same: no contextual alternates,
// and no synthetic bold or italic for weights and styles a font does not have.
const textLayerCss = '#ai-text-layer text,#ai-text-layer tspan{'
  + 'font-variant-ligatures:common-ligatures no-discretionary-ligatures no-historical-ligatures no-contextual;'
  + 'font-feature-settings:"calt" 0,"clig" 0,"rclt" 0;font-synthesis:none}\n'
  + legacyKernFamilies.map(family => `#ai-text-layer [font-family="${family}"]{font-kerning:none}`).join('\n');

let pending: Promise<void> | undefined;
export function ensureInscriptionFonts(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (pending) return pending;
  const style = document.createElement('style');
  style.id = 'inscription-fonts';
  style.textContent = `${fontFaceCss()}\n${textLayerCss}`;
  document.head.appendChild(style);
  pending = Promise.resolve();
  return pending;
}
