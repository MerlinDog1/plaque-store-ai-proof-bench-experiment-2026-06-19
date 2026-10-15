export interface TextBounds { x: number; y: number; width: number; height: number }

/** Fit each rendered line to the circle or oval rather than its enclosing rectangle.
 * Real glyph bounds keep accents/descenders inside the reserved ellipse, while
 * short outer lines let wider middle lines use more of the plaque.
 */
export function fitTextToEllipse(
  lines: TextBounds[], bounds: TextBounds, width: number, height: number,
  maxScale: number, offsetX = 0, offsetY = 0,
) {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const rx = width / 2;
  const ry = height / 2;
  if (rx <= 0 || ry <= 0 || !lines.length) return 0;
  const fits = (scale: number) => lines.every(line =>
    [line.x, line.x + line.width].every(x =>
      [line.y, line.y + line.height].every(y =>
        ((x - cx) * scale + offsetX) ** 2 / rx ** 2
        + ((y - cy) * scale + offsetY) ** 2 / ry ** 2 <= 1,
      ),
    ),
  );
  let low = 0;
  let high = Math.max(0, maxScale);
  for (let i = 0; i < 32; i += 1) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}
