import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlaquePreview from '../../components/PlaquePreview';
import { createCorelSvgText } from '../../services/exportService';
import { BorderStyle, INITIAL_STATE, PlaqueState, Shape } from '../../types';

// Border-only fixture: the real preview renderer and real production exporter,
// with no AI, checkout, analytics, customer data or external font dependency.
// Text fidelity has its own glyph-parity suite. Fail if font loading is reached.
window.opentype = { load: () => { throw new Error('Unexpected font load in border-only fixture'); } };

const geometry = (element: Element) => ({
  tag: element.tagName.toLowerCase(),
  attributes: Object.fromEntries(Array.from(element.attributes)
    .filter(({ name }) => !['class', 'id', 'fill', 'stroke', 'opacity', 'filter', 'style'].includes(name))
    .map(({ name, value }) => [name, value]).sort(([a], [b]) => a.localeCompare(b))),
});
const bordersInExport = (svg: Element) => Array.from(svg.querySelectorAll('[stroke="#000000"][fill="none"]'));
const serialize = (svg: Element) => new XMLSerializer().serializeToString(svg);
const parsed = (xml: string) => new DOMParser().parseFromString(xml, 'image/svg+xml').documentElement;

async function renderBorderCase(overrides: Partial<PlaqueState>, baselineUrl?: string) {
  const state = { ...INITIAL_STATE, border: true, ...overrides };
  const host = document.querySelector('#fixture')!;
  host.innerHTML = renderToStaticMarkup(<PlaquePreview state={state} activeStep={6} inscription="" />);
  const source = host.querySelector('svg')!;
  // Remove only the wording/prompt layer. All real border, cut and fixing
  // geometry, including wood offsets and corner radii, stays as rendered.
  source.querySelector('#ai-text-layer')?.remove();
  const untouchedSource = source.outerHTML;
  const previewBorders = Array.from(source.querySelectorAll('.engraved-border'));
  const production = await createCorelSvgText(source, state);
  const exported = parsed(production);
  const productionBorders = bordersInExport(exported);
  let before: string | undefined;
  let unchangedOtherLayers: boolean | undefined;
  if (baselineUrl) {
    const baseline = await import(/* @vite-ignore */ baselineUrl);
    before = await baseline.createCorelSvgText(source, state);
    const oldDoc = parsed(before!);
    const newDoc = exported.cloneNode(true) as Element;
    for (const svg of [oldDoc, newDoc]) {
      bordersInExport(svg).forEach(border => border.removeAttribute('stroke-width'));
    }
    unchangedOtherLayers = serialize(oldDoc) === serialize(newDoc);
  }
  // A white-background drawing of the actual preview border layer, retaining
  // its opacity and exact viewBox. Used in the comparison sheet, not exports.
  const proofBorders = source.cloneNode(false) as SVGSVGElement;
  proofBorders.removeAttribute('class');
  proofBorders.setAttribute('width', `${source.viewBox.baseVal.width}mm`);
  proofBorders.setAttribute('height', `${source.viewBox.baseVal.height}mm`);
  proofBorders.appendChild(source.querySelector('#border-layer')!.cloneNode(true));
  const customerPreview = source.cloneNode(true) as SVGSVGElement;
  customerPreview.removeAttribute('class');
  customerPreview.setAttribute('width', `${source.viewBox.baseVal.width}mm`);
  customerPreview.setAttribute('height', `${source.viewBox.baseVal.height}mm`);
  return {
    state,
    preview: previewBorders.map(geometry),
    exported: productionBorders.map(geometry),
    solidBlack: productionBorders.every(el => el.getAttribute('stroke') === '#000000'
      && el.getAttribute('fill') === 'none' && !el.closest('[opacity], [stroke-opacity]')),
    sourceUnchanged: untouchedSource === source.outerHTML,
    viewBox: exported.getAttribute('viewBox'),
    width: exported.getAttribute('width'), height: exported.getAttribute('height'),
    previewViewBox: source.getAttribute('viewBox'),
    holeCount: source.querySelectorAll('#fixings-layer > g').length,
    unchangedOtherLayers,
    previewSvg: serialize(proofBorders), customerPreviewSvg: serialize(customerPreview), productionSvg: production, beforeSvg: before,
  };
}

Object.assign(window, {
  renderBorderCase,
  borderParityStyles: Object.values(BorderStyle),
  borderParityShapes: Object.values(Shape),
});
