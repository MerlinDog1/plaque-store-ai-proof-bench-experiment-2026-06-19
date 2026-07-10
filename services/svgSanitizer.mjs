import sanitizeHtml from "sanitize-html";

// Proof SVG is deliberately much smaller than uploaded source images. Keeping a
// separate ceiling here prevents pathological markup from reaching the parser in
// either the browser or the proof-session API.
export const MAX_PROOF_SVG_CHARS = 1_000_000;

const allowedTags = [
  "svg",
  "g",
  "defs",
  "symbol",
  "use",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "title",
  "desc",
  "clipPath",
  "mask",
  "pattern",
  "linearGradient",
  "radialGradient",
  "stop",
  "filter",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
];

const allowedAttributes = [
  "xmlns",
  "xmlns:xlink",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "pathLength",
  "transform",
  "transform-origin",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "clip-path",
  "clip-rule",
  "mask",
  "filter",
  "opacity",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "vector-effect",
  "paint-order",
  "shape-rendering",
  "text-rendering",
  "text-anchor",
  "dominant-baseline",
  "alignment-baseline",
  "baseline-shift",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "letter-spacing",
  "word-spacing",
  "textLength",
  "lengthAdjust",
  "dx",
  "dy",
  "rotate",
  "id",
  "class",
  "role",
  "aria-label",
  "aria-hidden",
  "focusable",
  "preserveAspectRatio",
  "href",
  "xlink:href",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "fx",
  "fy",
  "fr",
  "offset",
  "stop-color",
  "stop-opacity",
  "patternUnits",
  "patternContentUnits",
  "patternTransform",
  "marker-start",
  "marker-mid",
  "marker-end",
  "in",
  "in2",
  "result",
  "type",
  "values",
  "operator",
  "k1",
  "k2",
  "k3",
  "k4",
  "stdDeviation",
  "edgeMode",
  "mode",
  "scale",
  "xChannelSelector",
  "yChannelSelector",
  "surfaceScale",
  "diffuseConstant",
  "specularConstant",
  "specularExponent",
  "kernelUnitLength",
  "azimuth",
  "elevation",
  "limitingConeAngle",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "flood-color",
  "flood-opacity",
  "radius",
  "seed",
  "stitchTiles",
  "baseFrequency",
  "numOctaves",
];

const localReference = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/u;
const localUrlReference = /^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/u;
const unsafeCssSyntax = /[\\\u0000-\u001f\u007f]|\/\*/u;
const paintAttributes = new Set([
  "fill",
  "stroke",
  "color",
  "stop-color",
  "flood-color",
]);
const resourceReferenceAttributes = new Set([
  "clip-path",
  "mask",
  "filter",
  "marker-start",
  "marker-mid",
  "marker-end",
]);

const safePaintKeywords = new Set([
  "none",
  "currentColor",
  "transparent",
  "black",
  "white",
  "gray",
  "grey",
]);
const safeHexColor = /^#[0-9A-Fa-f]{3,8}$/u;
const safeNumericColorFunction = /^(?:rgb|rgba|hsl|hsla)\([0-9+\-.,% /]+\)$/iu;
const isSafePaint = (value) => (
  !unsafeCssSyntax.test(value)
  && (
    localUrlReference.test(value)
    || safePaintKeywords.has(value)
    || safeHexColor.test(value)
    || safeNumericColorFunction.test(value)
  )
);
const isSafeResourceReference = (value) => (
  !unsafeCssSyntax.test(value)
  && (value === "none" || localUrlReference.test(value))
);

const filterAttributes = (attributes) => {
  const next = {};
  for (const [name, rawValue] of Object.entries(attributes)) {
    const lowerName = name.toLowerCase();
    const value = String(rawValue);

    // Event handlers are forbidden regardless of casing or parser behaviour.
    if (lowerName.startsWith("on")) continue;

    if (lowerName === "href" || lowerName === "xlink:href") {
      if (unsafeCssSyntax.test(value) || !localReference.test(value)) continue;
    }

    if (paintAttributes.has(lowerName) && !isSafePaint(value)) continue;
    if (resourceReferenceAttributes.has(lowerName) && !isSafeResourceReference(value)) continue;

    if (lowerName === "xmlns" && value !== "http://www.w3.org/2000/svg") continue;
    if (lowerName === "xmlns:xlink" && value !== "http://www.w3.org/1999/xlink") continue;

    next[name] = value;
  }
  return next;
};

const sanitizerOptions = {
  allowedTags,
  allowedAttributes: { "*": allowedAttributes },
  allowedSchemes: [],
  allowProtocolRelative: false,
  // These elements can contain HTML or executable text. Drop their complete
  // subtrees rather than retaining their children as sanitize-html normally can.
  nonTextTags: [
    "script",
    "style",
    "foreignObject",
    "iframe",
    "object",
    "embed",
    "audio",
    "video",
    "canvas",
    "noscript",
    "template",
  ],
  transformTags: {
    "*": (tagName, attributes) => ({
      tagName,
      attribs: filterAttributes(attributes),
    }),
  },
  parser: {
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  },
  selfClosing: [
    "path",
    "rect",
    "circle",
    "ellipse",
    "line",
    "polyline",
    "polygon",
    "use",
    "stop",
    "feBlend",
    "feColorMatrix",
    "feComposite",
    "feDisplacementMap",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "feTile",
    "feTurbulence",
  ],
};

export const sanitizeSvgMarkup = (value) => {
  if (typeof value !== "string") return null;
  if (value.length > MAX_PROOF_SVG_CHARS) return "";
  try {
    return sanitizeHtml(value, sanitizerOptions).trim();
  } catch {
    return "";
  }
};

export const sanitizeProofStateSvg = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const state = { ...value };
  if (Object.prototype.hasOwnProperty.call(state, "generatedSvgContent")) {
    state.generatedSvgContent = sanitizeSvgMarkup(state.generatedSvgContent);
  }
  if (Object.prototype.hasOwnProperty.call(state, "memorialImageSvg")) {
    state.memorialImageSvg = sanitizeSvgMarkup(state.memorialImageSvg);
  }
  if (Object.prototype.hasOwnProperty.call(state, "generated_svg_content")) {
    state.generated_svg_content = sanitizeSvgMarkup(state.generated_svg_content);
  }
  if (Object.prototype.hasOwnProperty.call(state, "memorial_image_svg")) {
    state.memorial_image_svg = sanitizeSvgMarkup(state.memorial_image_svg);
  }
  return state;
};

const sanitizeNullableSvg = (value) => value === null || value === undefined
  ? null
  : sanitizeSvgMarkup(value);

export const sanitizeProofPackageSvg = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const proofPackage = { ...value };
  for (const key of ["productionSvg", "visualProofSvg", "production_svg", "visual_proof_svg"]) {
    if (Object.prototype.hasOwnProperty.call(proofPackage, key)) {
      proofPackage[key] = sanitizeNullableSvg(proofPackage[key]);
    }
  }
  return proofPackage;
};

export const sanitizeOrderSvgFields = (value, depth = 0, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  if (depth > 4 || seen.has(value)) return {};
  seen.add(value);

  const order = { ...value };
  for (const key of ["plaqueState", "plaque_state", "state"]) {
    if (Object.prototype.hasOwnProperty.call(order, key)) {
      order[key] = sanitizeProofStateSvg(order[key]);
    }
  }
  for (const key of ["proofPackage", "proof_package"]) {
    if (Object.prototype.hasOwnProperty.call(order, key)) {
      order[key] = sanitizeProofPackageSvg(order[key]);
    }
  }
  for (const key of ["order", "orderSnapshot"]) {
    if (order[key] && typeof order[key] === "object" && !Array.isArray(order[key])) {
      order[key] = sanitizeOrderSvgFields(order[key], depth + 1, seen);
    }
  }
  if (order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)) {
    const metadata = { ...order.metadata };
    for (const key of ["order", "mockOrder"]) {
      if (metadata[key] && typeof metadata[key] === "object" && !Array.isArray(metadata[key])) {
        metadata[key] = sanitizeOrderSvgFields(metadata[key], depth + 1, seen);
      }
    }
    order.metadata = metadata;
  }
  return order;
};

export const sanitizeProofSessionSvgFields = (payload) => {
  const value = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const plaqueState = sanitizeProofStateSvg(value.plaqueState || value.plaque_state || {});
  const rawGeneratedSvg = value.generatedSvg ?? value.generated_svg ?? null;
  return {
    plaqueState,
    generatedSvg: rawGeneratedSvg === null ? null : sanitizeSvgMarkup(rawGeneratedSvg),
  };
};

export const sanitizeProofSessionRecord = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const fields = sanitizeProofSessionSvgFields(value);
  const record = {
    ...value,
    plaque_state: fields.plaqueState,
    generated_svg: fields.generatedSvg,
  };
  if (record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)) {
    const metadata = { ...record.metadata };
    for (const key of ["order", "mockOrder"]) {
      if (metadata[key] && typeof metadata[key] === "object" && !Array.isArray(metadata[key])) {
        metadata[key] = sanitizeOrderSvgFields(metadata[key]);
      }
    }
    record.metadata = metadata;
  }
  return record;
};
