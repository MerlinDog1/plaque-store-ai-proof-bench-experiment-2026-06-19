// Test page for scripts/check-glyph-parity.mjs. It draws sample wording as live
// SVG text, exactly as the designer preview does, and beside it the outlined
// copy that the emailed proof and the production PDF are made from.
import { ensureInscriptionFonts } from '../../services/inscriptionFonts';
import { outlinePreviewTextLayer } from '../../services/exportService';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 1400;
const LINE_HEIGHT = 84;
const FONT_SIZE = 56;

type ParityCase = { family: string; weight: number; style?: string; letterSpacing?: string };

// Synthetic wording only. Covers standard ligatures (fi, fl, ff, ffi, ffl),
// kerning pairs, figures, punctuation, accents (latin and latin-ext), centred
// text and tspans.
const LINES = [
  'Office Fife Clifford fjord',
  'fluffy staff affluent flora',
  'The Waverley Avenue, To 1948',
  'Ever in our hearts & always',
  'ÉLAN Dún Laoghaire café',
  'Tŷ Dŵr Łucja Ćwik Ōtaki',
];
// 0141 496 0xxx is Ofcom's range reserved for fiction.
const CENTRED_TSPANS = ['Fieldfare Office', 'Tel: 0141 496 0199'];

const textElement = (attrs: Record<string, string>, content?: string) => {
  const el = document.createElementNS(SVG_NS, 'text');
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  if (content !== undefined) el.textContent = content;
  return el;
};

const buildSource = ({ family, weight, style = 'normal', letterSpacing }: ParityCase) => {
  const height = LINE_HEIGHT * (LINES.length + CENTRED_TSPANS.length) + 40;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', 'parity-live');
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${height}`);
  svg.setAttribute('width', String(WIDTH));
  svg.setAttribute('height', String(height));
  const layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('id', 'ai-text-layer');
  const common: Record<string, string> = {
    'font-family': family,
    'font-size': String(FONT_SIZE),
    'font-weight': String(weight),
    'font-style': style,
    fill: '#000000',
  };
  if (letterSpacing) common['letter-spacing'] = letterSpacing;

  LINES.forEach((line, index) => {
    layer.appendChild(textElement({ ...common, x: '24', y: String(LINE_HEIGHT * (index + 1)) }, line));
  });
  const centred = textElement({ ...common, x: String(WIDTH / 2), y: String(LINE_HEIGHT * (LINES.length + 1)), 'text-anchor': 'middle' });
  CENTRED_TSPANS.forEach((line, index) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');
    tspan.setAttribute('x', String(WIDTH / 2));
    tspan.setAttribute('dy', index === 0 ? '0' : String(LINE_HEIGHT));
    tspan.textContent = line;
    centred.appendChild(tspan);
  });
  layer.appendChild(centred);
  svg.appendChild(layer);
  return svg;
};

declare global {
  interface Window {
    renderParityCase: (parityCase: ParityCase) => Promise<{ width: number; height: number }>;
  }
}

window.renderParityCase = async (parityCase) => {
  const stage = document.getElementById('stage')!;
  stage.replaceChildren();
  await ensureInscriptionFonts();
  const source = buildSource(parityCase);
  stage.appendChild(source);
  const fontSpec = `${parityCase.style === 'italic' ? 'italic ' : ''}${parityCase.weight} ${FONT_SIZE}px "${parityCase.family}"`;
  await document.fonts.load(fontSpec, LINES.join(' '));
  await document.fonts.ready;

  const clone = source.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('id', 'parity-outlined');
  stage.appendChild(clone);
  await outlinePreviewTextLayer(clone, source, { pathFill: '#000000' });
  return { width: WIDTH, height: Number(source.getAttribute('height')) };
};
