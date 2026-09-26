/** The already-reserved, centred inscription area (not the whole plaque). */
export interface ManualTypographyBox {
  width: number;
  height: number;
}

const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 32;
const escapeXml = (value: string) => value.replace(/&/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Conservative fallback when a browser canvas / loaded Lato face is unavailable. */
function estimatedWidth(line: string, size: number): number {
  return Array.from(line).reduce((width, character) => {
    const units = /\s/.test(character) ? 0.4
      : /[ilI1.,'!:;]/.test(character) ? 0.4
        : /[MWmw@%&]/.test(character) ? 1.1
          : /[A-Z0-9]/.test(character) ? 0.85
            : /[a-z]/.test(character) ? 0.75 : 1.3;
    return width + units * size;
  }, 0);
}

function getMeasurer(): (line: string, size: number) => number {
  let context: CanvasRenderingContext2D | null = null;
  try {
    // Do not measure a temporary fallback font while the selected face loads.
    if (typeof document !== 'undefined' && document.fonts?.check('400 16px Lato')) {
      context = document.createElement('canvas').getContext('2d');
    }
  } catch { /* Non-browser consumers use the conservative estimate. */ }
  return (line, size) => {
    if (!context) return estimatedWidth(line, size);
    context.font = `400 ${size}px Lato`;
    const metrics = context.measureText(line);
    const inkWidth = Math.max(metrics.width,
      (metrics.actualBoundingBoxLeft || 0) + (metrics.actualBoundingBoxRight || 0));
    return Number.isFinite(inkWidth) && inkWidth >= 0
      ? inkWidth * 1.08 : estimatedWidth(line, size);
  };
}

/**
 * A local, equal-size editable starter. Explicit line breaks (including blank
 * lines) are retained; no wording, capitalization, or line wrapping is invented.
 * No API calls or automatic model fallback. Call after document.fonts.ready for
 * the most accurate fit; a conservative width estimate supports offline/SSR use.
 */
export function createManualTypography(inscription: string, box: ManualTypographyBox) {
  if (!Number.isFinite(box.width) || !Number.isFinite(box.height)
    || box.width <= 0 || box.height <= 0) {
    throw new Error('The inscription area must have positive, finite dimensions.');
  }
  if (!inscription.trim()) throw new Error('Enter your inscription first.');
  if (inscription.length > 8000) throw new Error('This inscription is too long for a manual layout.');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(inscription)) {
    throw new Error('The inscription contains unsupported control characters.');
  }
  const lines = inscription.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim());
  if (lines.length > 12) throw new Error('Use at most 12 lines for a manual layout.');
  const measure = getMeasurer();
  // Keep a little breathing room INSIDE the real inscription box. Do not add
  // whole-plaque margins again: the caller has already reserved artwork space.
  const usableWidth = box.width * 0.92;
  const usableHeight = box.height * 0.92;
  let size = Math.min(MAX_FONT_SIZE, usableHeight / (lines.length * 1.4));
  const longestAtOne = Math.max(...lines.map(line => measure(line, 1)));
  if (longestAtOne > 0) size = Math.min(size, usableWidth / longestAtOne);
  size = Math.floor(size * 100) / 100;
  // Re-measure at the actual size: browser hinting is not necessarily linear.
  while (size >= MIN_FONT_SIZE && lines.some(line => measure(line, size) > usableWidth)) {
    size = Math.round((size - 0.1) * 100) / 100;
  }
  if (size < MIN_FONT_SIZE) {
    throw new Error('Your wording will not fit at a readable size. Add line breaks, shorten it, or choose a larger plaque.');
  }
  const lineHeight = size * 1.4;
  const top = -(lineHeight * lines.length) / 2;
  const svgContent = lines.map((line, index) => {
    // Baseline leaves 1em for ascent and .4em for descent / line separation.
    const y = top + index * lineHeight + size;
    return `<text x="0" y="${y.toFixed(3)}" text-anchor="middle" font-family="Lato" font-size="${size.toFixed(2)}" font-weight="400" fill="currentColor">${escapeXml(line)}</text>`;
  }).join('\n');
  return {
    svgContent,
    reasoning: 'Created an editable layout locally, preserving your wording and line breaks.',
    conceptImageUrl: null,
  };
}

/**
 * Read wording in document order, keeping text/tspan boundaries as newlines so
 * adjacent spans never concatenate words. This is a reader, NOT an SVG sanitizer.
 */
export function readSvgInscription(svgContent: string): string {
  if (!svgContent.trim()) return '';
  if (typeof DOMParser === 'undefined') throw new Error('Reading a layout requires an XML parser.');
  if (/<!doctype|<!entity/i.test(svgContent)) throw new Error('Unsupported SVG declaration.');
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('The layout is not valid SVG.');
  return Array.from(doc.querySelectorAll('text')).map(text => {
    if (!text.querySelector('tspan')) return (text.textContent || '').trim();
    return Array.from(text.childNodes).flatMap(child => {
      if (child.nodeType === 1 && (child as Element).localName === 'tspan') {
        return [(child.textContent || '').trim()];
      }
      return child.nodeType === 3 && child.textContent?.trim() ? [child.textContent.trim()] : [];
    }).join('\n');
  }).join('\n');
}
