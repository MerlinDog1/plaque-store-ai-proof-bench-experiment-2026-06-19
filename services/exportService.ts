import { ensureInscriptionFonts } from './inscriptionFonts';
import {
  INSCRIPTION_FALLBACK_FAMILY,
  InscriptionFontStyle,
  InscriptionFontSubset,
  inscriptionFallbackWeight,
  inscriptionFontSubsetsFor,
  inscriptionFontUrl,
  inscriptionFontVariants,
  inscriptionFontWeight,
  inscriptionSubsetCovers,
  matchInscriptionFontWeight,
} from './inscriptionFontCatalog';
import { PlaqueState, Fixing, Material, MemorialImageMethod } from "../types";
import QRCode from "qrcode";
import { hasGroundStake } from "./pricing";

interface PdfExportOptions {
  continueUrl?: string;
  proofImageBase64?: string;
  // The customer's AI "Realistic preview" of this exact design, if they made one: a labelled page of its own after
  // the proof, never in place of the drawing (owner msg 8124).
  aiPreviewImage?: string;
  wording?: string;
  price?: number;
}

const createProofQrDataUrl = (continueUrl: string) => QRCode.toDataURL(continueUrl, {
  color: { dark: "#000000", light: "#ffffff" },
  margin: 4,
  width: 512,
  errorCorrectionLevel: "Q",
});

// Type definitions for external libraries loaded via CDN
declare global {
  interface Window {
    opentype: any;
    jspdf: any;
    jsPDF: any;
    svg2pdf: any;
  }
}

const DEFAULT_FALLBACK_FONT = "Open Sans";
const scriptPromises = new Map<string, Promise<void>>();

const loadScript = (src: string) => {
  const existing = scriptPromises.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
  scriptPromises.set(src, promise);
  return promise;
};

const ensureOpenType = async () => {
  if (!window.opentype) {
    await loadScript("https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js");
  }
};

const ensurePdfLibraries = async () => {
  if (!window.jspdf?.jsPDF && !window.jsPDF) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
  window.jsPDF = window.jsPDF || window.jspdf?.jsPDF;
  if (!window.svg2pdf) {
    await loadScript("https://unpkg.com/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js");
  }
};

const firstFontFamily = (ff: string) => ff ? ff.split(",")[0].trim().replace(/^["']|["']$/g, "") : "";
// The catalogue face the browser draws for this family, weight and style. With
// font-synthesis off, a missing italic is drawn upright, so outline it upright.
const fontDescriptor = (family: string, weight: string, style: string) => {
  const variants = inscriptionFontVariants[family];
  const italic = style === "italic" && !!variants?.italic?.length;
  const available = (italic ? variants?.italic : variants?.normal) || [];
  const faceWeight = matchInscriptionFontWeight(available, inscriptionFontWeight(weight));
  return `${family}::${faceWeight}::${italic ? "italic" : "normal"}`;
};
const parseLength = (value: string | null, fontSize: number) => {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "normal") return 0;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) return 0;
  return trimmed.endsWith("em") ? parsed * fontSize : parsed;
};

const loadFontsUsedInLayer = async (liveLayer: Element) => {
  const descriptors = new Set<string>();
  const elems = Array.from(liveLayer.querySelectorAll("text, tspan"));

  descriptors.add(fontDescriptor(DEFAULT_FALLBACK_FONT, "600", "normal"));

  elems.forEach((node) => {
    const style = window.getComputedStyle(node);
    const fam = firstFontFamily(node.getAttribute("font-family") || style.fontFamily);
    if (fam) {
      descriptors.add(fontDescriptor(
        fam,
        node.getAttribute("font-weight") || style.fontWeight,
        node.getAttribute("font-style") || style.fontStyle
      ));
    }
  });

  const loadedFonts: Record<string, OutlineFont> = {};

  await Promise.all(Array.from(descriptors).map(async (descriptor) => {
    const [fam, weight, style] = descriptor.split("::");
    if (!inscriptionFontVariants[fam]) {
      console.error(`FAILED to load font "${descriptor}": not in the inscription font catalogue.`);
      return;
    }
    try {
      const own = await loadOutlineFaces(fam, Number(weight), style as InscriptionFontStyle);
      const fallback = fam === INSCRIPTION_FALLBACK_FAMILY
        ? []
        : await loadOutlineFaces(INSCRIPTION_FALLBACK_FAMILY, inscriptionFallbackWeight(Number(weight)), "normal")
          .catch((e) => {
            console.warn(`Could not load the fallback characters for "${descriptor}".`, e);
            return [];
          });
      // Browsers try the last @font-face rule for a character first, and the
      // fallback rules come first (see inscriptionFonts.ts), so check in reverse.
      loadedFonts[descriptor] = {
        faces: [...own].reverse().concat([...fallback].reverse()),
        primary: own.find(({ subset }) => subset === "latin")!.face,
      };
    } catch (e) {
      console.error(`FAILED to load font "${descriptor}".`, e);
    }
  }));

  return loadedFonts;
};

type OutlineFace = { face: any; subset: InscriptionFontSubset };
type OutlineFont = { faces: OutlineFace[]; primary: any };
type Ligature = { sub: number[]; by: number };

// The same pinned files the preview's @font-face rules use; latin-ext covers
// names such as Tŷ or Łucja.
const loadOutlineFaces = async (family: string, weight: number, style: InscriptionFontStyle) => {
  const faces = await Promise.all(inscriptionFontSubsetsFor(family).map(async (subset) => {
    const url = inscriptionFontUrl(family, weight, style, subset, "woff");
    const fetchFace = async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return window.opentype.parse(await response.arrayBuffer());
    };
    try {
      return { face: await fetchFace().catch(fetchFace), subset };
    } catch (e) {
      if (subset === "latin") throw e;
      console.warn(`Could not load the ${subset} characters of ${family} ${weight}.`, e);
      return null;
    }
  }));
  return faces.filter((face): face is OutlineFace => face !== null);
};

// The face a browser draws this character from: the first in order whose
// unicode-range covers it and which has the glyph.
const faceForChar = (font: OutlineFont, char: string) => {
  const codePoint = char.codePointAt(0) ?? 0;
  return font.faces.find(({ face, subset }) =>
    inscriptionSubsetCovers(subset, codePoint) && face.charToGlyphIndex(char) > 0)?.face;
};

const ligatureCache = new WeakMap<object, Ligature[]>();
// Standard and required ligatures ("liga", "rlig"), which browsers apply by
// default, longest first so "ffi" wins over "ff".
const standardLigatures = (face: any): Ligature[] => {
  const cached = ligatureCache.get(face);
  if (cached) return cached;
  const ligatures: Ligature[] = [];
  for (const feature of ["liga", "rlig"]) {
    for (const script of ["latn", "DFLT"]) {
      let found: Ligature[] = [];
      try {
        found = face.substitution?.getFeature?.(feature, script) || [];
      } catch {
        found = [];
      }
      if (found.length) {
        ligatures.push(...found);
        break;
      }
    }
  }
  ligatures.sort((a, b) => b.sub.length - a.sub.length);
  ligatureCache.set(face, ligatures);
  return ligatures;
};

// Browsers draw a standard ligature such as "fi" as one glyph but still report
// a position for each of its characters, splitting the joined width between
// them. Outlining those characters separately squeezes a full "f" and a dotted
// "i" into that width. The preview text layer turns common ligatures on
// explicitly (inscriptionFonts.ts), and every browser joins them unless text
// is letter-spaced, so a matching ligature is outlined as the one glyph shown.
const ligatureAt = (face: any, ligatures: Ligature[], text: string, start: number, charCount: number) => {
  const glyphAt = (index: number) => face.charToGlyphIndex(text[index]);
  const first = glyphAt(start);
  return ligatures.find((ligature) => {
    if (ligature.sub[0] !== first || start + ligature.sub.length > charCount) return false;
    return ligature.sub.every((glyph, k) => glyph === glyphAt(start + k));
  }) || null;
};

const assertTextLayerOutlined = (cloneSvg: SVGSVGElement) => {
  const remainingText = Array.from(cloneSvg.querySelectorAll("#ai-text-layer text"))
    .filter(text => (text.textContent || "").trim().length > 0);
  if (remainingText.length > 0) {
    throw new Error("Production export could not freeze all preview text to vector paths. Check font loading before exporting.");
  }
};

const visibleTextRunCount = (layer: Element) =>
  Array.from(layer.querySelectorAll("text")).reduce((count, text) => {
    const directText = Array.from(text.childNodes).some((child) =>
      child.nodeType === Node.TEXT_NODE && (child.textContent || "").trim().length > 0
    );
    const tspanCount = Array.from(text.querySelectorAll("tspan"))
      .filter(tspan => (tspan.textContent || "").trim().length > 0)
      .length;
    return count + (directText ? 1 : 0) + tspanCount;
  }, 0);

const loadBrowserFontsUsedInLayer = async (layer: Element) => {
  if (!document.fonts?.load) return;
  const nodes = Array.from(layer.querySelectorAll("text, tspan"))
    .filter(node => (node.textContent || "").trim().length > 0);

  await Promise.all(nodes.map(async (node) => {
    const style = window.getComputedStyle(node);
    const family = style.fontFamily || node.getAttribute("font-family");
    if (!family) return;
    const font = `${style.fontStyle || "normal"} ${style.fontWeight || "400"} ${style.fontSize || "16px"} ${family}`;
    try {
      await document.fonts.load(font, node.textContent || "");
    } catch {
      // The export font loader below will still fail closed if outlining cannot
      // find a matching font. This step is for browser measurement parity.
    }
  }));
  await document.fonts.ready;
};

const waitForSvgTextLayout = async (layer?: Element) => {
  await ensureInscriptionFonts();
  if (layer) await loadBrowserFontsUsedInLayer(layer);
  else await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

const recomputePreviewFitTransform = (
  sourceTextGroup: Element,
  cloneTextGroup: Element,
) => {
  const fitW = Number.parseFloat(sourceTextGroup.getAttribute("data-fit-width") || "");
  const fitH = Number.parseFloat(sourceTextGroup.getAttribute("data-fit-height") || "");
  const userScale = Number.parseFloat(sourceTextGroup.getAttribute("data-fit-scale") || "1");
  const inscriptionScale = Number.isFinite(userScale) ? Math.max(0.1, userScale) : 1;
  if (!Number.isFinite(fitW) || !Number.isFinite(fitH) || fitW <= 0 || fitH <= 0) {
    const groupTransform = sourceTextGroup.getAttribute("transform");
    if (groupTransform) cloneTextGroup.setAttribute("transform", groupTransform);
    return;
  }

  try {
    const bbox = (sourceTextGroup as SVGGElement).getBBox();
    if (!bbox.width || !bbox.height) return;

    const scale = Math.min(fitW / bbox.width, fitH / bbox.height, 3.0) * inscriptionScale;
    const centerOffsetX = -(bbox.x + bbox.width / 2);
    const centerOffsetY = -(bbox.y + bbox.height / 2);
    cloneTextGroup.setAttribute(
      "transform",
      `scale(${scale}) translate(${centerOffsetX}, ${centerOffsetY})`
    );
  } catch {
    const groupTransform = sourceTextGroup.getAttribute("transform");
    if (groupTransform) cloneTextGroup.setAttribute("transform", groupTransform);
  }
};

// Convert text nodes to path data
const outlineTextLayer = async (
  cloneSvg: SVGSVGElement,
  sourceSvg: SVGSVGElement,
  options: { pathFill?: string; preserveSourceFill?: boolean } = {},
) => {
  await ensureOpenType();
  const cloneTextGroup = cloneSvg.querySelector("#ai-text-layer");
  const sourceTextGroup = sourceSvg.querySelector("#ai-text-layer");

  if (!cloneTextGroup || !sourceTextGroup) return;

  // Gemini-authored typography often selects fonts that have not been used
  // elsewhere on the page. Measure only after browser font layout has settled,
  // otherwise bbox registration can compare fallback-font preview geometry
  // against real-font outlined geometry.
  await waitForSvgTextLayout(sourceTextGroup);
  // Export must not depend on whether React has already committed the latest
  // preview fit transform. Recompute it from the measured live text and the
  // explicit inscription-box dimensions immediately before freezing paths.
  recomputePreviewFitTransform(sourceTextGroup, cloneTextGroup);

  const loadedFonts = await loadFontsUsedInLayer(sourceTextGroup);
  const fallbackFont = loadedFonts[DEFAULT_FALLBACK_FONT]
    || loadedFonts[fontDescriptor(DEFAULT_FALLBACK_FONT, "600", "normal")];

  const cloneTextEls = Array.from(cloneTextGroup.querySelectorAll("text"));
  const sourceTextEls = Array.from(sourceTextGroup.querySelectorAll("text"));
  const expectedRunCount = visibleTextRunCount(sourceTextGroup);
  const initialPathCount = cloneTextGroup.querySelectorAll("path").length;

  for (let i = 0; i < cloneTextEls.length; i++) {
    const textEl = cloneTextEls[i];
    const sourceEl = sourceTextEls[i];
    if (!sourceEl) continue;

    const cloneTspans = Array.from(textEl.querySelectorAll("tspan"));
    const sourceTspans = Array.from(sourceEl.querySelectorAll("tspan"));

    const isMultiPart = cloneTspans.length > 0;
    const runs = isMultiPart ? cloneTspans : [textEl];
    const sourceRuns = isMultiPart ? sourceTspans : [sourceEl];

    let fullyConverted = true;

    for (let j = 0; j < runs.length; j++) {
      const run = runs[j];
      const sourceRun = sourceRuns[j] as SVGTextContentElement;

      const textContent = run.textContent || "";
      if (!textContent.trim()) continue;

      const style = window.getComputedStyle(sourceRun);
      const fam = firstFontFamily(sourceRun.getAttribute("font-family") || style.fontFamily);
      const descriptor = fontDescriptor(
        fam,
        sourceRun.getAttribute("font-weight") || style.fontWeight,
        sourceRun.getAttribute("font-style") || style.fontStyle
      );

      // A catalogue font that failed to load must stop the export rather than be
      // swapped for another face; only unknown families use the fallback.
      const font = loadedFonts[descriptor] || (inscriptionFontVariants[fam] ? undefined : fallbackFont);
      if (!font) {
        console.error(`CRITICAL: No fonts available for "${textContent}".`);
        run.setAttribute("fill", "#FF0000");
        fullyConverted = false;
        continue;
      }

      // Robust Font Size Detection: Prefer Attribute over Computed Style (which returns px on screen)
      let fontSize = 12;
      const fsAttr = sourceRun.getAttribute("font-size") || sourceRun.parentElement?.getAttribute("font-size");
      if (fsAttr) {
        fontSize = parseFloat(fsAttr.replace("px", ""));
      } else {
        // Fallback to style only if attribute is missing, but be wary of unit mismatch
        fontSize = parseFloat(style.fontSize) || 12;
      }

      let pathData = "";
      let usedBrowserLayout = false;
      const letterSpacing = parseLength(
        sourceRun.getAttribute("letter-spacing")
        || sourceRun.parentElement?.getAttribute("letter-spacing")
        || style.letterSpacing,
        fontSize
      );
      // Outline one glyph at a time at the browser-calculated positions, for
      // script and non-script faces alike. This preserves SVG text-anchor,
      // kerning, letter-spacing and script joins exactly as previewed. Contextual
      // alternates and synthetic bold/italic are switched off for the preview
      // text layer (inscriptionFonts.ts), so each character, or each joined
      // standard ligature, is one glyph on screen and here.
      let unavailableChar = "";
      try {
        const charCount = sourceRun.getNumberOfChars();
        if (charCount > 0) {
          // Browsers do not join ligatures in letter-spaced text.
          const ligatures = letterSpacing === 0 ? standardLigatures(font.primary) : [];
          for (let charIndex = 0; charIndex < charCount; charIndex++) {
            const char = textContent[charIndex];
            if (!char || !char.trim()) continue;

            const face = faceForChar(font, char);
            if (!face) {
              unavailableChar = Array.from(textContent.slice(charIndex))[0] || char;
              break;
            }
            const pt = sourceRun.getStartPositionOfChar(charIndex);
            const ligature = ligatures.length && face === font.primary
              ? ligatureAt(face, ligatures, textContent, charIndex, charCount)
              : null;
            if (ligature) {
              pathData += `${face.glyphs.get(ligature.by).getPath(pt.x, pt.y, fontSize).toPathData(2)} `;
              charIndex += ligature.sub.length - 1;
              continue;
            }
            pathData += `${face.getPath(char, pt.x, pt.y, fontSize).toPathData(2)} `;
          }
          usedBrowserLayout = !unavailableChar && pathData.trim().length > 0;
        }
      } catch (e) {
        // Fall back to whole-run layout for unusual SVG text nodes.
      }
      if (unavailableChar) {
        // The browser drew this from a device font the plaque cannot be made in.
        throw new Error(`"${unavailableChar}" is not available in ${fam}, so the plaque cannot be made exactly as previewed. Remove that character or choose another font.`);
      }

      if (!usedBrowserLayout) {
        const textAnchor = sourceRun.getAttribute("text-anchor") || style.textAnchor || "start";
        let xAttr = run.getAttribute("x");
        let yAttr = run.getAttribute("y");

        // Inherit from parent text if tspan missing coords
        if (!xAttr && textEl.getAttribute("x")) xAttr = textEl.getAttribute("x");
        if (!yAttr && textEl.getAttribute("y")) yAttr = textEl.getAttribute("y");

        let x = parseFloat(xAttr || "0");
        let y = parseFloat(yAttr || "0");

        const width = font.primary.getAdvanceWidth(textContent, fontSize);

        if (textAnchor === "middle") x -= width / 2;
        if (textAnchor === "end") x -= width;

        const runPath = font.primary.getPath(textContent.trim(), x, y, fontSize);
        pathData = runPath.toPathData(2);
      }

      try {
        const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("d", pathData);
        const sourceFill = style.fill && style.fill !== "none" ? style.fill : "#000000";
        pathEl.setAttribute("fill", options.pathFill || (options.preserveSourceFill ? sourceFill : "#000000"));
        pathEl.setAttribute("stroke", "none");

        // Preserve transform from the text element itself (e.g. if individual text was rotated)
        // But do NOT apply group transforms here, they are on the parent group.
        const transform = run.getAttribute("transform");
        if (transform) pathEl.setAttribute("transform", transform);

        if (textEl.parentNode) {
          textEl.parentNode.insertBefore(pathEl, textEl);
        }
      } catch (err) {
        console.warn(`Could not generate path for text "${textContent}".`, err);
        fullyConverted = false;
      }
    }

    if (fullyConverted) {
      textEl.remove();
    }
  }

  assertTextLayerOutlined(cloneSvg);
  const producedRunCount = cloneTextGroup.querySelectorAll("path").length - initialPathCount;
  if (producedRunCount < expectedRunCount) {
    throw new Error("Production export skipped part of the preview text while outlining. Regenerate the inscription layout and export again.");
  }
};

export const outlinePreviewTextLayer = async (
  cloneSvg: SVGSVGElement,
  sourceSvg: SVGSVGElement,
  options: { pathFill?: string; preserveSourceFill?: boolean } = {},
) => {
  await outlineTextLayer(cloneSvg, sourceSvg, options);
};

const prepareCloneForProduction = async (sourceSvg: SVGSVGElement, state: PlaqueState) => {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;

  // The live preview SVG is the geometry source of truth. Reusing its actual
  // viewBox avoids export-time size drift if preview dimensions and state ever
  // get out of step during generated layout updates.
  const previewBox = sourceSvg.viewBox.baseVal;
  const totalW = previewBox.width || Number(sourceSvg.getAttribute("width")) || state.width + (state.wood ? 25 : 0);
  const totalH = previewBox.height || Number(sourceSvg.getAttribute("height")) || state.height + (state.wood ? 25 : 0);
  const minX = previewBox.width ? previewBox.x : 0;
  const minY = previewBox.height ? previewBox.y : 0;
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("width", `${totalW}mm`);
  clone.setAttribute("height", `${totalH}mm`);
  clone.setAttribute("viewBox", `${minX} ${minY} ${totalW} ${totalH}`);

  // Ensure the clone is in the DOM so getStartPositionOfChar works
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "-10000px";
  wrapper.style.left = "-10000px";
  wrapper.style.opacity = "0.01";
  wrapper.style.pointerEvents = "none";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await outlineTextLayer(clone, sourceSvg);

    // ======= CLEAN FOR CORELDRAW =======

    // 1. Keep the exact preview transform hierarchy.
    // The proof SVG is the source of truth; export must not rewrite the
    // text-layer translate/scale chain after the browser has fitted it.

    // 2. Remove ALL visual-only elements (noise, patina, shadows, portrait guides)
    clone.querySelectorAll('.visual-effect').forEach(el => el.remove());
    clone.querySelectorAll('.portrait-placeholder').forEach(el => el.remove());
    if (
      state.memorialImageEnabled &&
      state.memorialImageMethod === MemorialImageMethod.Engraved &&
      !state.memorialImageSvg
    ) {
      clone.querySelector('#memorial-artwork-layer')?.remove();
    }

    // 3. Process Wood Backing -> blue cut line
    const woodBacking = clone.querySelector('.wood-backing');
    if (woodBacking) {
      woodBacking.removeAttribute('filter');
      woodBacking.querySelectorAll('rect').forEach(rect => {
        rect.removeAttribute('rx');
        rect.removeAttribute('ry');
      });
      const shapes = Array.from(woodBacking.querySelectorAll('rect, ellipse, path'));
      shapes.forEach((shape, index) => {
        if (index === 0) {
          shape.removeAttribute('fill');
          shape.setAttribute('fill', 'none');
          shape.setAttribute('stroke', '#0000FF');
          shape.setAttribute('stroke-width', '0.25');
          shape.removeAttribute('filter');
          shape.removeAttribute('style');
        } else {
          shape.remove();
        }
      });
    }

    // 4. Process Cut Line -> red cut line
    const cutLine = clone.querySelector('.cut-line') as SVGElement | null;
    if (cutLine) {
      cutLine.removeAttribute('fill');
      cutLine.setAttribute('fill', 'none');
      cutLine.setAttribute('stroke', '#FF0000');
      cutLine.setAttribute('stroke-width', '0.25');
      cutLine.removeAttribute('filter');
      cutLine.removeAttribute('style');
    }

    // 5. Process Fixings -> simple red circles
    const fixingsLayer = clone.querySelector('#fixings-layer');
    if (fixingsLayer) {
      const groups = fixingsLayer.querySelectorAll('g');
      groups.forEach(g => {
        const mainCircle = g.querySelector('circle');
        if (mainCircle) {
          const newCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          newCircle.setAttribute("cx", mainCircle.getAttribute("cx") || "0");
          newCircle.setAttribute("cy", mainCircle.getAttribute("cy") || "0");
          newCircle.setAttribute("r", state.fixing === Fixing.Screws ? "1.5" : "2.5");
          newCircle.setAttribute("fill", "none");
          newCircle.setAttribute("stroke", "#FF0000");
          newCircle.setAttribute("stroke-width", "0.25");
          g.parentNode?.insertBefore(newCircle, g);
          g.remove();
        } else {
          g.remove();
        }
      });
    }

    // 6. Process Engraved borders -> black engrave line
    clone.querySelectorAll('.engraved-border').forEach(el => {
      el.removeAttribute('fill');
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', '#000000');
      el.setAttribute('stroke-width', '0.5');
      el.removeAttribute('filter');
      el.removeAttribute('style');
    });

    // 7. Ensure all text paths are black filled
    clone.querySelectorAll('path').forEach(path => {
      if (path.closest('.uv-vector-artwork')) {
        path.removeAttribute('stroke');
        return;
      }
      if (path.classList.contains('engraved-border') ||
        path.getAttribute('stroke') === '#FF0000' ||
        path.getAttribute('stroke') === '#0000FF') return;
      path.setAttribute('fill', '#000000');
      path.setAttribute('stroke', 'none');
    });

    // 8. Remove visual defs but retain UV portrait clipping geometry.
    clone.querySelectorAll('defs').forEach(defs => {
      const portraitClip = defs.querySelector('#uv-portrait-shape');
      const vectorClip = defs.querySelector('#uv-vector-portrait-shape');
      if (!portraitClip && !vectorClip) {
        defs.remove();
        return;
      }
      Array.from(defs.children).forEach(child => {
        if (child !== portraitClip && child !== vectorClip) child.remove();
      });
    });

    // 9. Strip all visual-only attributes everywhere
    clone.querySelectorAll('filter, style').forEach(el => el.remove());
    clone.querySelectorAll('*').forEach(el => {
      el.removeAttribute('filter');
      el.removeAttribute('style');
      el.removeAttribute('class');
      if (el.getAttribute('opacity')) el.removeAttribute('opacity');
    });

    // 10. Unwrap the plate-group <g> (had filter="url(#dropShadow)")
    const plateGroup = clone.querySelector('[id="plate-group"]');
    if (plateGroup && plateGroup.tagName === 'g') {
      while (plateGroup.firstChild) {
        plateGroup.parentNode?.insertBefore(plateGroup.firstChild, plateGroup);
      }
      plateGroup.remove();
    }

    // 11. Clean up IDs that are not still used by clip paths.
    const referencedIds = new Set(
      Array.from(clone.querySelectorAll('*'))
        .flatMap(el => Array.from(el.attributes))
        .map(attr => attr.value.match(/url\(#([^)]+)\)/)?.[1])
        .filter((id): id is string => !!id)
    );
    clone.querySelectorAll('*').forEach(el => {
      const id = el.getAttribute('id');
      if (id && !referencedIds.has(id)) el.removeAttribute('id');
    });

    return clone;
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const createCorelSvgText = async (sourceSvg: SVGSVGElement, state: PlaqueState) => {
  const clone = await prepareCloneForProduction(sourceSvg, state);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + new XMLSerializer().serializeToString(clone);
};

export const downloadCorelSvg = async (sourceSvg: SVGSVGElement, state: PlaqueState) => {
  try {
    const xml = await createCorelSvgText(sourceSvg, state);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `plaque_${state.width}x${state.height}_${state.material}.svg`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Clean up after a short delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (e) {
    console.error("Export failed", e);
    alert("Export failed: " + e);
  }
};

export const createCorelPdfBlob = async (sourceSvg: SVGSVGElement, state: PlaqueState) => {
  await ensurePdfLibraries();
  const jsPDFCtor = window.jsPDF || window.jspdf?.jsPDF;
  const svg2pdf = window.svg2pdf?.svg2pdf || window.svg2pdf;
  if (!jsPDFCtor || !svg2pdf) throw new Error("PDF library not loaded. Please refresh.");

  const xml = await createCorelSvgText(sourceSvg, state);
  const docSvg = new DOMParser().parseFromString(xml, "image/svg+xml").querySelector("svg");
  if (!docSvg) throw new Error("Production artwork could not be prepared.");

  const box = docSvg.viewBox.baseVal;
  const width = box.width || Number.parseFloat(docSvg.getAttribute("width") || "") || state.width;
  const height = box.height || Number.parseFloat(docSvg.getAttribute("height") || "") || state.height;
  const pdf = new jsPDFCtor({
    orientation: width >= height ? "l" : "p",
    unit: "mm",
    format: [width, height],
    compress: true,
  });

  await svg2pdf(docSvg, pdf, {
    x: 0,
    y: 0,
    width,
    height,
  });
  return pdf.output("blob") as Blob;
};

export const downloadCorelPdf = async (sourceSvg: SVGSVGElement, state: PlaqueState, filename?: string) => {
  try {
    const blob = await createCorelPdfBlob(sourceSvg, state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `plaque_${state.width}x${state.height}_${state.material}.pdf`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (e) {
    console.error("Production PDF export failed", e);
    alert("Production PDF export failed: " + e);
  }
};

const labelFromSlug = (value: string) => value
  .split("-")
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const formatPrice = (value?: number) => {
  if (!Number.isFinite(value)) return "Live price shown in designer";
  return value!.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const addWrappedText = (doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight = 5) => {
  const lines = doc.splitTextToSize(text || "", maxWidth);
  doc.text(lines, x, y);
  return y + Math.max(lines.length, 1) * lineHeight;
};

const formatSavedUntil = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const drawInstaPlaqueWordmark = (doc: any, x: number, y: number, fontSize = 15.8) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  doc.setTextColor(244, 202, 103);
  doc.text("Insta", x, y);
  doc.setTextColor(246, 240, 222);
  doc.text("Plaque", x + fontSize * 0.85, y);
};

// Owner msg 8124 (31 Oct 2026): the proof page always shows the designer drawing, which is what we make. An AI picture
// can change the lighting, texture and details, so it gets its own page, labelled as an illustration.
const addAiPreviewPage = (doc: any, image: string, portrait: boolean) => {
  const pageW = portrait ? 210 : 297;
  const pageH = portrait ? 297 : 210;
  const data = image.startsWith("data:") ? image : `data:image/png;base64,${image}`;
  const format = /^data:image\/jpe?g/i.test(data) ? "JPEG" : /^data:image\/webp/i.test(data) ? "WEBP" : "PNG";
  const props = doc.getImageProperties(data);
  doc.addPage("a4", portrait ? "p" : "l");
  doc.setFillColor(243, 239, 229);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFillColor(8, 31, 26);
  doc.rect(0, 0, pageW, 13, "F");
  drawInstaPlaqueWordmark(doc, portrait ? 13 : 14, 9.9);
  doc.setTextColor(23, 32, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(portrait ? 10.5 : 12);
  doc.text("AI impression, for illustration only", 14, 24.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(portrait ? 6.8 : 7.6);
  doc.setTextColor(105, 90, 67);
  addWrappedText(
    doc,
    "Made by AI from your design, to show how it might look in place. Lighting, colour and small details can differ. Your plaque is made exactly as the drawing on page 1.",
    14,
    30,
    pageW - 28,
    3.6
  );
  const boxX = 14;
  const boxY = 40;
  const boxW = pageW - 28;
  const boxH = pageH - boxY - 14;
  const scale = Math.min(boxW / props.width, boxH / props.height);
  const w = props.width * scale;
  const h = props.height * scale;
  doc.addImage(data, format, boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h);
};

export const downloadPdf = async (sourceSvg: SVGSVGElement, state: PlaqueState, options: PdfExportOptions = {}) => {
  try {
    await ensurePdfLibraries();
    const jsPDFCtor = window.jsPDF || window.jspdf?.jsPDF;
    if (!jsPDFCtor) throw new Error("PDF Library not loaded. Please refresh.");

    const viewBox = sourceSvg.viewBox.baseVal;
    const widthMm = Math.round(viewBox.width || state.width + (state.wood ? 25 : 0));
    const heightMm = Math.round(viewBox.height || state.height + (state.wood ? 25 : 0));
    const isPortraitPdf = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
    const doc = new jsPDFCtor({
      orientation: isPortraitPdf ? "p" : "l",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageW = isPortraitPdf ? 210 : 297;
    const pageH = isPortraitPdf ? 297 : 210;
    const savedUntil = formatSavedUntil();
    const proofImageBase64 = options.proofImageBase64 || await svgToProofPngBase64(sourceSvg);
    const proofImageData = proofImageBase64.startsWith("data:")
      ? proofImageBase64
      : `data:image/png;base64,${proofImageBase64}`;
    const imageProps = doc.getImageProperties(proofImageData);
    const specs = [
      ["Size", `${widthMm} x ${heightMm} mm`],
      ["Material", labelFromSlug(state.material)],
      ["Text colour", labelFromSlug(state.textColor)],
      ["Fixing", state.fixing === Fixing.None ? "No fixings" : labelFromSlug(state.fixing)],
      ["Border", state.border ? labelFromSlug(state.borderStyle) : "No border"],
      ["Wood backing", state.wood
        ? `${labelFromSlug(state.woodTone)} wood, ${state.woodEdge} edge${hasGroundStake(state) ? ", black steel ground stake" : ""}`
        : "No backing"],
      ["Estimate", `${formatPrice(options.price)} inc. UK delivery`],
    ];

    if (isPortraitPdf) {
      const imageBoxW = 186;
      const imageBoxH = 112;
      const imageScale = Math.min(imageBoxW / imageProps.width, imageBoxH / imageProps.height);
      const imageW = imageProps.width * imageScale;
      const imageH = imageProps.height * imageScale;
      const proofX = 12;
      const proofY = 34;
      const imageX = proofX + (imageBoxW - imageW) / 2;
      const imageY = proofY + (imageBoxH - imageH) / 2;

      doc.setFillColor(243, 239, 229);
      doc.rect(0, 0, pageW, pageH, "F");
      doc.setFillColor(8, 31, 26);
      doc.rect(0, 0, pageW, 13, "F");
      drawInstaPlaqueWordmark(doc, 13, 9.9);

      doc.setTextColor(244, 202, 103);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`Saved until ${savedUntil}`, pageW - 13, 8.5, { align: "right" });

      doc.setTextColor(23, 32, 29);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("Your plaque preview", proofX, 24.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(105, 90, 67);
      doc.text("Artwork proof - not shown at physical size", proofX, 28.6);

      doc.addImage(proofImageData, "PNG", imageX, imageY, imageW, imageH);

      const panelX = 12;
      const panelY = 148;
      const panelW = 186;
      const panelH = 137;
      doc.setFillColor(8, 31, 26);
      doc.roundedRect(panelX, panelY, panelW, panelH, 4, 4, "F");
      doc.setDrawColor(193, 150, 64);
      doc.roundedRect(panelX, panelY, panelW, panelH, 4, 4, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(245, 230, 186);
      doc.text("Proof details", panelX + 7, panelY + 13);
      doc.line(panelX + 7, panelY + 17, panelX + panelW - 7, panelY + 17);

      specs.forEach(([label, value], index) => {
        const y = panelY + 29 + index * 9.4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.setTextColor(177, 161, 128);
        doc.text(String(label).toUpperCase(), panelX + 7, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(index === specs.length - 1 ? 9.6 : 9.1);
        doc.setTextColor(index === specs.length - 1 ? 245 : 246, index === specs.length - 1 ? 218 : 240, index === specs.length - 1 ? 151 : 222);
        doc.text(value, panelX + 58, y, { maxWidth: 118 });
      });

      doc.setDrawColor(193, 150, 64);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(237, 238, 232);
      addWrappedText(
        doc,
        "Please check all spelling, dates, dimensions, materials and fixing options carefully before approving.",
        panelX + 7,
        panelY + 98,
        106,
        3.4
      );

      doc.line(panelX + 7, panelY + 103, panelX + panelW - 7, panelY + 103);
      doc.setTextColor(245, 230, 186);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Continue online", panelX + 7, panelY + 114);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(237, 238, 232);
      addWrappedText(
        doc,
        "Scan or open online.",
        panelX + 7,
        panelY + 121,
        86,
        3.4
      );

      if (options.continueUrl) {
        const qrDataUrl = await createProofQrDataUrl(options.continueUrl);
        doc.addImage(qrDataUrl, "PNG", panelX + panelW - 35, panelY + 108, 28, 28);
        doc.setFillColor(237, 190, 82);
        doc.roundedRect(panelX + 7, panelY + 126, 54, 11, 5.5, 5.5, "F");
        doc.setTextColor(23, 32, 29);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.textWithLink("Open proof", panelX + 34, panelY + 133.1, { url: options.continueUrl, align: "center" });
      }

      if (options.aiPreviewImage) addAiPreviewPage(doc, options.aiPreviewImage, true);
      doc.save(`instaplaque-proof_${widthMm}x${heightMm}_${state.material}.pdf`);
      return;
    }

    const imageBoxW = 197;
    const imageBoxH = 136;
    const imageScale = Math.min(imageBoxW / imageProps.width, imageBoxH / imageProps.height);
    const imageW = imageProps.width * imageScale;
    const imageH = imageProps.height * imageScale;
    const proofX = 14;
    const proofY = 22;
    const imageX = proofX + (imageBoxW - imageW) / 2;
    const imageY = proofY + (imageBoxH - imageH) / 2;

    doc.setFillColor(243, 239, 229);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setFillColor(8, 31, 26);
    doc.rect(0, 0, pageW, 13, "F");

    drawInstaPlaqueWordmark(doc, 14, 9.9);

    const savedPillX = pageW - 91;
    const savedPillY = 1.9;
    const savedPillW = 77;
    const savedPillH = 9.2;
    doc.setFillColor(237, 190, 82);
    doc.roundedRect(savedPillX, savedPillY, savedPillW, savedPillH, savedPillH / 2, savedPillH / 2, "F");
    doc.setTextColor(23, 32, 29);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.text(`Design saved until ${savedUntil}`, savedPillX + savedPillW / 2, savedPillY + 6.2, { align: "center" });

    doc.addImage(proofImageData, "PNG", imageX, imageY, imageW, imageH);

    const panelX = 222;
    const panelY = 22;
    const panelW = pageW - panelX - 14;
    const panelH = 172;
    doc.setFillColor(8, 31, 26);
    doc.roundedRect(panelX, panelY, panelW, panelH, 4, 4, "F");
    doc.setDrawColor(193, 150, 64);
    doc.roundedRect(panelX, panelY, panelW, panelH, 4, 4, "S");

    const specY = 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(245, 230, 186);
    doc.text("Proof details", panelX + 7, specY);
    doc.setDrawColor(193, 150, 64);
    doc.line(panelX + 7, specY + 4, panelX + panelW - 7, specY + 4);
    specs.forEach(([label, value], index) => {
      const y = specY + 14 + index * 9;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      doc.setTextColor(177, 161, 128);
      doc.text(String(label).toUpperCase(), panelX + 7, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(index === specs.length - 1 ? 8.2 : 7.6);
      doc.setTextColor(index === specs.length - 1 ? 245 : 237, index === specs.length - 1 ? 218 : 238, index === specs.length - 1 ? 151 : 232);
      doc.text(value, panelX + 7, y + 4.2, { maxWidth: panelW - 14 });
    });

    doc.setDrawColor(193, 150, 64);
    doc.line(panelX + 7, 117, panelX + panelW - 7, 117);

    doc.setTextColor(245, 230, 186);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.3);
    doc.text("Before production", panelX + 7, 126);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.2);
    doc.setTextColor(237, 238, 232);
    addWrappedText(
      doc,
      "Check names, dates, material, size, fixings and layout before approval.",
      panelX + 7,
      131,
      panelW - 14,
      2.7
    );

    doc.setDrawColor(193, 150, 64);
    doc.line(panelX + 7, 144, panelX + panelW - 7, 144);

    doc.setTextColor(245, 230, 186);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    doc.text("Continue online", panelX + 7, 155);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(237, 238, 232);
    addWrappedText(
      doc,
      "Scan to continue editing or checkout.",
      panelX + 7,
      162,
      panelW - 14,
      3
    );

    if (options.continueUrl) {
      const qrDataUrl = await createProofQrDataUrl(options.continueUrl);
      doc.addImage(qrDataUrl, "PNG", panelX + 7, 165, 28, 28);
      doc.setFillColor(237, 190, 82);
      doc.roundedRect(panelX + 40, 173, 29, 9.5, 4.75, 4.75, "F");
      doc.setTextColor(23, 32, 29);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.textWithLink("Open proof", panelX + 54.5, 179.3, { url: options.continueUrl, align: "center" });
    }

    if (options.aiPreviewImage) addAiPreviewPage(doc, options.aiPreviewImage, false);
    doc.save(`instaplaque-proof_${widthMm}x${heightMm}_${state.material}.pdf`);
  } catch (e) {
    console.error("PDF Export failed", e);
    alert("PDF Export failed: " + e);
  }
};

const realisticReferenceMaterialFill: Record<Material, string> = {
  [Material.BrushedBrass]: "#c79a45",
  [Material.OrbitalBrassMattLacquer]: "#c7ad67",
  [Material.PolishedBrass]: "#e3bd47",
  [Material.AgedBrass]: "#8a704f",
  [Material.BrushedSteel]: "#c6ced0",
  [Material.PolishedSteel]: "#dfe5e8",
};

const realisticReferenceWoodFill = (state?: PlaqueState) =>
  state?.woodTone === "light" ? "#b99058" : "#5b3524";

const imageUrlToDataUrl = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load SVG image asset: ${url}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not encode SVG image asset: ${url}`));
    reader.readAsDataURL(blob);
  });
};

const inlineSvgImageHrefs = async (svg: SVGSVGElement) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (!origin) return;

  await Promise.all(Array.from(svg.querySelectorAll("image")).map(async (image) => {
    const href = image.getAttribute("href") || image.getAttribute("xlink:href");
    if (!href || href.startsWith("data:")) return;
    const absolute = href.startsWith("http") ? href : href.startsWith("/") ? `${origin}${href}` : new URL(href, origin).toString();
    const dataUrl = await imageUrlToDataUrl(absolute);
    image.setAttribute("href", dataUrl);
    image.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataUrl);
  }));
};

export const svgToProofPngBase64 = async (sourceSvg: SVGSVGElement): Promise<string> => {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  const vb = sourceSvg.viewBox.baseVal;
  const targetW = 1800;
  const scale = targetW / Math.max(1, vb.width);
  const w = Math.round(vb.width * scale);
  const h = Math.round(vb.height * scale);
  clone.setAttribute("width", `${w}px`);
  clone.setAttribute("height", `${h}px`);

  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "-9999px";
  wrapper.style.left = "-9999px";
  wrapper.style.opacity = "0";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await document.fonts?.ready;
    await outlineTextLayer(clone, sourceSvg, { preserveSourceFill: true });
    await inlineSvgImageHrefs(clone);
    const xml = new XMLSerializer().serializeToString(clone);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");
        ctx.fillStyle = "#f5f2ea";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = reject;
      img.src = image64;
    });
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const svgToPngBase64 = async (sourceSvg: SVGSVGElement, state?: PlaqueState): Promise<string> => {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  const vb = sourceSvg.viewBox.baseVal;
  const scale = 1024 / vb.width;
  const w = Math.round(vb.width * scale);
  const h = Math.round(vb.height * scale);
  clone.setAttribute("width", `${w}px`);
  clone.setAttribute("height", `${h}px`);

  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.top = "-9999px";
  wrapper.style.left = "-9999px";
  wrapper.style.opacity = "0";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    await outlineTextLayer(clone, sourceSvg);
    await inlineSvgImageHrefs(clone);

    // Realistic View needs a clear product reference, not a white-on-white mask.
    // Keep wood, fixings, border, and text visible so the image model preserves them.
    clone.querySelectorAll(".visual-effect").forEach(el => el.remove());
    clone.querySelectorAll(".portrait-placeholder").forEach(el => el.remove());

    clone.querySelectorAll(".wood-backing").forEach(el => {
      el.setAttribute("fill", realisticReferenceWoodFill(state));
      // The board shapes carry their own url(#wood…) texture fill and the defs are removed
      // below, which left the board blank (cream) in the reference image.
      el.querySelectorAll('[fill^="url("]').forEach(shape => shape.setAttribute("fill", realisticReferenceWoodFill(state)));
      el.setAttribute("stroke", "#2b1b12");
      el.setAttribute("stroke-width", "1.1");
      el.removeAttribute("style");
    });

    const cutLine = clone.querySelector(".cut-line");
    if (cutLine) {
      cutLine.setAttribute("fill", realisticReferenceMaterialFill[state?.material || Material.BrushedBrass]);
      cutLine.setAttribute("stroke", "#151515");
      cutLine.setAttribute("stroke-width", "1.2");
      cutLine.removeAttribute("style");
    }

    clone.querySelectorAll(".engraved-border").forEach(el => {
      el.setAttribute("stroke", "#000000");
      el.setAttribute("fill", "none");
      el.setAttribute("stroke-width", "1.2");
      el.removeAttribute("style");
    });

    clone.querySelectorAll("#ai-text-layer path, #ai-text-layer text, #ai-text-layer tspan, #memorial-artwork-layer path, #fixings-layer path, #fixings-layer circle").forEach(el => {
      el.setAttribute("fill", "#000000");
      el.setAttribute("stroke", "none");
      el.removeAttribute("style");
    });

    clone.querySelectorAll("filter").forEach(el => el.remove());
    clone.querySelectorAll("defs").forEach(defs => {
      if (!defs.querySelector("#uv-portrait-shape")) defs.remove();
    });
    clone.querySelectorAll("[filter]").forEach(el => el.removeAttribute("filter"));
    clone.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"));

    const xml = new XMLSerializer().serializeToString(clone);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = `data:image/svg+xml;base64,${svg64}`;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas error");
        ctx.fillStyle = "#f3f1ea";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png").split(",")[1]);
      };
      img.onerror = reject;
      img.src = image64;
    });
  } finally {
    document.body.removeChild(wrapper);
  }
};
