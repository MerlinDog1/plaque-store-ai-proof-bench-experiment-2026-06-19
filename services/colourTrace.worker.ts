import { contours } from "d3-contour";

type ColourTraceRequest = {
  imageBuffer: ArrayBuffer;
  mimeType: string;
  paletteSize?: number;
  detail?: number;
};

type ColourTraceResponse = {
  type?: "progress";
  message?: string;
  svg?: string;
  error?: string;
};

type Lab = { l: number; a: number; labB: number };
type PaletteColour = Lab & { r: number; g: number; b: number; count: number };

function postProgress(message: string) {
  self.postMessage({ type: "progress", message } satisfies ColourTraceResponse);
}

async function loadBitmap(imageBuffer: ArrayBuffer, mimeType: string): Promise<ImageBitmap> {
  const blob = new Blob([imageBuffer], { type: mimeType || "image/png" });
  return createImageBitmap(blob);
}

function srgbToLinear(value: number) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function rgbToLab(r: number, g: number, b: number): Lab {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  let x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  let y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
  let z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    labB: 200 * (y - z),
  };
}

function labDistance(a: Lab, b: Lab) {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.labB - b.labB;
  return dl * dl + da * da + db * db;
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function buildPalette(pixels: Uint8ClampedArray, width: number, height: number, paletteSize: number) {
  const bins = new Map<number, { r: number; g: number; b: number; count: number }>();
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 90000)));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const alpha = pixels[i + 3];
      if (alpha < 32) continue;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3);
      const bin = bins.get(key) || { r: 0, g: 0, b: 0, count: 0 };
      bin.r += r;
      bin.g += g;
      bin.b += b;
      bin.count += 1;
      bins.set(key, bin);
    }
  }

  const seeds = Array.from(bins.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(2, paletteSize * 5))
    .map(bin => ({
      r: bin.r / bin.count,
      g: bin.g / bin.count,
      b: bin.b / bin.count,
      count: bin.count,
      ...rgbToLab(bin.r / bin.count, bin.g / bin.count, bin.b / bin.count),
    }));

  let palette: PaletteColour[] = [];
  for (const seed of seeds) {
    if (palette.length >= paletteSize) break;
    if (palette.every(existing => labDistance(existing, seed) > 42)) {
      palette.push({ ...seed });
    }
  }
  palette = palette.concat(seeds.slice(0, paletteSize - palette.length).map(seed => ({ ...seed })));

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const sums = palette.map(() => ({ r: 0, g: 0, b: 0, l: 0, a: 0, bb: 0, count: 0 }));
    for (const sample of seeds) {
      let best = 0;
      let bestDistance = Infinity;
      for (let index = 0; index < palette.length; index += 1) {
        const distance = labDistance(sample, palette[index]);
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      }
      const sum = sums[best];
      sum.r += sample.r * sample.count;
      sum.g += sample.g * sample.count;
      sum.b += sample.b * sample.count;
      sum.l += sample.l * sample.count;
      sum.a += sample.a * sample.count;
      sum.bb += sample.labB * sample.count;
      sum.count += sample.count;
    }
    palette = palette.map((colour, index) => {
      const sum = sums[index];
      if (!sum.count) return colour;
      return {
        r: sum.r / sum.count,
        g: sum.g / sum.count,
        b: sum.b / sum.count,
        l: sum.l / sum.count,
        a: sum.a / sum.count,
        labB: sum.bb / sum.count,
        count: sum.count,
      };
    });
  }

  return palette.sort((a, b) => b.count - a.count);
}

function simplifyRing(ring: [number, number][], tolerance: number): [number, number][] {
  if (ring.length <= 2) return ring;
  let maxDist = 0;
  let maxIdx = 0;
  const p1 = ring[0];
  const p2 = ring[ring.length - 1];

  for (let i = 1; i < ring.length - 1; i += 1) {
    const p = ring[i];
    const num = Math.abs((p2[1] - p1[1]) * p[0] - (p2[0] - p1[0]) * p[1] + p2[0] * p1[1] - p2[1] * p1[0]);
    const den = Math.hypot(p2[1] - p1[1], p2[0] - p1[0]);
    const dist = den === 0 ? Math.hypot(p[0] - p1[0], p[1] - p1[1]) : num / den;
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyRing(ring.slice(0, maxIdx + 1), tolerance);
    const right = simplifyRing(ring.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [p1, p2];
}

function polygonArea(ring: [number, number][]) {
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % ring.length];
    area += p1[0] * p2[1] - p2[0] * p1[1];
  }
  return Math.abs(area / 2);
}

function pathsForMask(mask: Float32Array, width: number, height: number, minArea: number, tolerance: number) {
  const contourList = contours().size([width, height]).thresholds([128])(mask as any);
  if (!contourList.length) return "";
  const multiPolygon = contourList[0] as any;
  const commands: string[] = [];

  multiPolygon.coordinates
    .filter((polygon: [number, number][][]) => polygon?.[0]?.length && polygonArea(polygon[0]) >= minArea)
    .forEach((polygon: [number, number][][]) => {
      polygon.map(ring => simplifyRing(ring, tolerance)).forEach((ring: [number, number][]) => {
        if (ring.length < 3) return;
        const p0 = ring[0];
        const p1 = ring[1];
        commands.push(`M ${((p0[0] + p1[0]) / 2).toFixed(2)},${((p0[1] + p1[1]) / 2).toFixed(2)}`);
        for (let i = 1; i < ring.length - 1; i += 1) {
          const current = ring[i];
          const next = ring[i + 1];
          commands.push(`Q ${current[0].toFixed(2)},${current[1].toFixed(2)} ${((current[0] + next[0]) / 2).toFixed(2)},${((current[1] + next[1]) / 2).toFixed(2)}`);
        }
        commands.push("Z");
      });
    });

  return commands.join(" ");
}

async function traceColourImage(imageBuffer: ArrayBuffer, mimeType: string, paletteSize = 12, detail = 64): Promise<string> {
  postProgress("Decoding colour artwork...");
  const img = await loadBitmap(imageBuffer, mimeType);

  try {
    const sourceMax = Math.max(img.width, img.height);
    const maxDimension = 1800;
    const scale = sourceMax > maxDimension ? maxDimension / sourceMax : 1;
    const width = Math.max(1, Math.floor(img.width * scale));
    const height = Math.max(1, Math.floor(img.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context available for colour tracing.");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    postProgress("Building balanced print palette...");
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const palette = buildPalette(pixels, width, height, Math.max(3, Math.min(24, Math.round(paletteSize))));
    if (!palette.length) throw new Error("Could not build a colour palette from that image.");
    const masks = palette.map(() => new Float32Array(width * height));

    postProgress("Separating colour regions...");
    for (let idx = 0; idx < width * height; idx += 1) {
      const r = pixels[idx * 4];
      const g = pixels[idx * 4 + 1];
      const b = pixels[idx * 4 + 2];
      const alpha = pixels[idx * 4 + 3];
      if (alpha < 32) continue;
      const lab = rgbToLab(r, g, b);
      let best = 0;
      let bestDistance = Infinity;
      for (let index = 0; index < palette.length; index += 1) {
        const distance = labDistance(lab, palette[index]);
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      }
      masks[best][idx] = 255;
    }

    postProgress("Tracing layered colour vectors...");
    const minArea = Math.max(3, (100 - Math.max(1, Math.min(100, detail))) * scale * 0.35);
    const tolerance = Math.max(0.45, (100 - Math.max(1, Math.min(100, detail))) / 45);
    const layers = palette
      .map((colour, index) => ({ colour, index, path: pathsForMask(masks[index], width, height, minArea, tolerance) }))
      .filter(layer => layer.path)
      .sort((a, b) => a.colour.l - b.colour.l)
      .map(layer => `<path d="${layer.path}" fill="${toHex(layer.colour.r, layer.colour.g, layer.colour.b)}" fill-rule="evenodd"/>`);

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
      `<metadata>InstaPlaque colour vector trace; palette=${palette.length}; source=${img.width}x${img.height}</metadata>`,
      ...layers,
      `</svg>`,
    ].join("");
  } finally {
    img.close();
  }
}

self.onmessage = async (event: MessageEvent<ColourTraceRequest>) => {
  const response: ColourTraceResponse = {};
  try {
    response.svg = await traceColourImage(
      event.data.imageBuffer,
      event.data.mimeType,
      event.data.paletteSize,
      event.data.detail,
    );
  } catch (error) {
    response.error = error instanceof Error ? error.message : "Colour image tracing failed.";
  }
  self.postMessage(response);
};
