const PACKAGE_AND_POSTAGE = 12.5;
const MM_PER_INCH = 25.4;
const SUPPLIER_VAT_RATE = 0.2;
const TARGET_GROSS_MARGIN = 0.4;
const WOOD_TARGET_GROSS_MARGIN = 0.25;
const SHAPED_PLAQUE_CUTTING_UPLIFT = 1.04;
const PRODUCTION_BED_WIDTH = 610;
const PRODUCTION_BED_HEIGHT = 420;
const OVERSIZED_BED_UPLIFT = 1.25;
const WOOD_BACKING_EXTRA_MM = 25;
const WOOD_BASE_CHARGE_EX_VAT = 3.69;
const WOOD_AREA_RATE_EX_VAT_PER_M2 = 447.4;
const WOOD_MINIMUM_UNIT_EX_VAT = 10;
const WOOD_CARRIAGE_EX_VAT = 15;
const WOOD_PRICE_MATCH_TOLERANCE_MM = 0.55;

export const CHECKOUT_POLICY_VERSION = "2026-07-10";
export const CHECKOUT_CURRENCY = "gbp";
export const MIN_PLAQUE_DIMENSION_MM = 50;
export const MAX_PLAQUE_DIMENSION_MM = 600;

export const ALLOWED_PLAQUE_SHAPES = Object.freeze(["rect", "oval", "circle", "heart"]);
export const ALLOWED_PLAQUE_MATERIALS = Object.freeze([
  "brushed-brass",
  "orbital-brass-matt-lacquer",
  "polished-brass",
  "aged-brass",
  "brushed-stainless",
  "polished-stainless",
]);
export const ALLOWED_PLAQUE_FIXINGS = Object.freeze(["none", "vhb", "screws", "caps"]);

const allowedShapes = new Set(ALLOWED_PLAQUE_SHAPES);
const allowedMaterials = new Set(ALLOWED_PLAQUE_MATERIALS);
const allowedFixings = new Set(ALLOWED_PLAQUE_FIXINGS);

const WOOD_INVOICE_PRICE_EXAMPLES = [
  { width: 340, height: 240, priceExVat: 40 },
  { width: 345, height: 260, priceExVat: 44 },
  { width: 235, height: 115, priceExVat: 18 },
  { width: 325, height: 575, priceExVat: 90 },
  { width: 445, height: 322, priceExVat: 65 },
  { width: 175, height: 100, priceExVat: 10 },
  { width: 400, height: 400, priceExVat: 75 },
  { width: 609.6, height: 457.2, priceExVat: 128 },
  { width: 235, height: 322, priceExVat: 38 },
  { width: 220, height: 220, priceExVat: 25 },
];

const materialLabels = {
  "brushed-brass": "Brushed brass",
  "orbital-brass-matt-lacquer": "Orbital brass",
  "polished-brass": "Polished brass",
  "aged-brass": "Aged brass",
  "brushed-stainless": "Brushed stainless",
  "polished-stainless": "Polished stainless",
};

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

const getPricingMaterial = (material) => {
  if (material === "aged-brass") return "bronzed-brass";
  if (
    material === "brushed-brass"
    || material === "orbital-brass-matt-lacquer"
    || material === "polished-brass"
    || material === "polished-stainless"
  ) {
    return "brass";
  }
  return "stainless";
};

const roundUpToNearestHalfPound = (value) => Math.ceil(value * 2) / 2;

const dimensionsMatch = (width, height, targetWidth, targetHeight) => (
  Math.abs(width - targetWidth) <= WOOD_PRICE_MATCH_TOLERANCE_MM
  && Math.abs(height - targetHeight) <= WOOD_PRICE_MATCH_TOLERANCE_MM
);

const findKnownWoodPrice = (width, height) => WOOD_INVOICE_PRICE_EXAMPLES.find((example) => (
  dimensionsMatch(width, height, example.width, example.height)
  || dimensionsMatch(width, height, example.height, example.width)
));

const estimateWoodBoardSupplierExVat = (state) => {
  const backingWidth = state.width + WOOD_BACKING_EXTRA_MM;
  const backingHeight = state.height + WOOD_BACKING_EXTRA_MM;
  const knownPrice = findKnownWoodPrice(backingWidth, backingHeight);
  if (knownPrice) return knownPrice.priceExVat;

  const areaM2 = (backingWidth * backingHeight) / 1_000_000;
  return Math.max(
    WOOD_MINIMUM_UNIT_EX_VAT,
    WOOD_BASE_CHARGE_EX_VAT + (WOOD_AREA_RATE_EX_VAT_PER_M2 * areaM2),
  );
};

const estimateWoodBackingSupplierExVat = (state) => (
  estimateWoodBoardSupplierExVat(state) + WOOD_CARRIAGE_EX_VAT
);

const getTradeEtchedCost = (state, material) => {
  const areaInches = (state.width / MM_PER_INCH) * (state.height / MM_PER_INCH);
  const etchedBase = areaInches * 0.4;
  const jfkStainless = etchedBase + 10;
  const jfkMirrorBrass = jfkStainless * 1.177;
  const jfkBronzedBrass = jfkMirrorBrass * 1.15;

  if (material === "stainless") return jfkStainless * 1.155 * 1.1;
  if (material === "brass") return jfkMirrorBrass * 1.115 * 1.1;
  return jfkBronzedBrass * 1.115 * 1.1;
};

const getShapeUplift = (shape) => (
  shape === "oval" || shape === "circle" ? SHAPED_PLAQUE_CUTTING_UPLIFT : 1
);

export const fitsProductionBed = (state) => (
  (state.width <= PRODUCTION_BED_WIDTH && state.height <= PRODUCTION_BED_HEIGHT)
  || (state.width <= PRODUCTION_BED_HEIGHT && state.height <= PRODUCTION_BED_WIDTH)
);

export const estimateWoodAddOn = (state) => {
  if (state.shape === "heart") return 0;
  const supplierCostWithVat = estimateWoodBackingSupplierExVat(state) * (1 + SUPPLIER_VAT_RATE);
  return roundUpToNearestHalfPound(supplierCostWithVat / (1 - WOOD_TARGET_GROSS_MARGIN));
};

export const estimatePlaquePrice = (state) => {
  const material = getPricingMaterial(state.material);
  const metalSupplierCostExVat = getTradeEtchedCost(state, material) * getShapeUplift(state.shape);
  const supplierCostWithVat = metalSupplierCostExVat * (1 + SUPPLIER_VAT_RATE);
  const costBasis = supplierCostWithVat + PACKAGE_AND_POSTAGE;
  const baseRetail = costBasis / (1 - TARGET_GROSS_MARGIN);
  const metalRetail = roundUpToNearestHalfPound(
    fitsProductionBed(state) ? baseRetail : baseRetail * OVERSIZED_BED_UPLIFT,
  );
  const woodAddOn = state.wood && state.shape !== "heart" ? estimateWoodAddOn(state) : 0;

  return roundUpToNearestHalfPound(metalRetail + woodAddOn);
};

export const estimatePlaqueBasePrice = (state) => estimatePlaquePrice({ ...state, wood: false });

export const getCheckoutQuoteReasons = (state, inscription = "") => {
  const reasons = [];
  if (state.width > 420 || state.height > 300) {
    reasons.push("oversized plaque dimensions");
  }
  if (state.memorialImageEnabled) {
    reasons.push("image/artwork check required");
  }
  if (String(inscription).trim().length > 360) {
    reasons.push("long inscription needs readability review");
  }
  if (state.shape === "heart") {
    reasons.push("special shape production check");
  }
  return reasons;
};

export const getCheckoutPriceBreakdown = (state, inscription = "") => {
  const total = estimatePlaquePrice(state);
  const wood = state.wood
    ? estimatePlaquePrice({ ...state, wood: true }) - estimatePlaquePrice({ ...state, wood: false })
    : 0;
  const quoteReasons = getCheckoutQuoteReasons(state, inscription);
  return {
    total,
    wood,
    delivery: 0,
    base: total - wood,
    quoteRequired: quoteReasons.length > 0,
    quoteReasons,
  };
};

const requireDimension = (value, field) => {
  if (!Number.isInteger(value) || value < MIN_PLAQUE_DIMENSION_MM || value > MAX_PLAQUE_DIMENSION_MM) {
    throw new Error(`${field} must be a whole number from ${MIN_PLAQUE_DIMENSION_MM} to ${MAX_PLAQUE_DIMENSION_MM} mm.`);
  }
  return value;
};

export const validateCheckoutPlaqueState = (input) => {
  if (!isRecord(input)) throw new Error("Missing plaque configuration for checkout.");

  const width = requireDimension(input.width, "Plaque width");
  const height = requireDimension(input.height, "Plaque height");
  const shape = String(input.shape || "");
  const material = String(input.material || "");
  const fixing = String(input.fixing || "");

  if (!allowedShapes.has(shape)) throw new Error("Unsupported plaque shape for checkout.");
  if (!allowedMaterials.has(material)) throw new Error("Unsupported plaque material for checkout.");
  if (!allowedFixings.has(fixing)) throw new Error("Unsupported plaque fixing for checkout.");
  if (shape === "circle" && width !== height) {
    throw new Error("Circular plaques must use the same width and height.");
  }
  if (typeof input.wood !== "boolean") throw new Error("Invalid wood backing selection.");
  if (typeof input.memorialImageEnabled !== "boolean") throw new Error("Invalid artwork selection.");
  if (input.fixingHoleCount !== 2 && input.fixingHoleCount !== 4) {
    throw new Error("Unsupported fixing hole count.");
  }

  return {
    ...input,
    width,
    height,
    shape,
    material,
    fixing,
    wood: input.wood,
    memorialImageEnabled: input.memorialImageEnabled,
    fixingHoleCount: input.fixingHoleCount,
  };
};

export const getPlaqueSummaryTitle = (state) => {
  const material = materialLabels[state.material] || "Custom plaque";
  return `${material} / ${state.width} x ${state.height} mm`;
};
