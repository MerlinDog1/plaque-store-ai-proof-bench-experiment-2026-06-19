import { Material, PlaqueState, Shape } from '../types';

type PricingMaterial = 'stainless' | 'brass' | 'bronzed-brass';

const PACKAGE_AND_POSTAGE = 12.5;
const MM_PER_INCH = 25.4;
const SUPPLIER_VAT_RATE = 0.2;
const TARGET_GROSS_MARGIN = 0.4;
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

function getPricingMaterial(material: Material): PricingMaterial {
  if (material === Material.AgedBrass) return 'bronzed-brass';
  if (
    material === Material.BrushedBrass ||
    material === Material.OrbitalBrassMattLacquer ||
    material === Material.PolishedBrass ||
    material === Material.PolishedSteel
  ) {
    return 'brass';
  }
  return 'stainless';
}

function roundToNearestPound(value: number) {
  return Math.round(value);
}

function dimensionsMatch(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
) {
  return Math.abs(width - targetWidth) <= WOOD_PRICE_MATCH_TOLERANCE_MM
    && Math.abs(height - targetHeight) <= WOOD_PRICE_MATCH_TOLERANCE_MM;
}

function findKnownWoodPrice(width: number, height: number) {
  return WOOD_INVOICE_PRICE_EXAMPLES.find((example) => (
    dimensionsMatch(width, height, example.width, example.height)
    || dimensionsMatch(width, height, example.height, example.width)
  ));
}

function estimateWoodBoardSupplierExVat(state: PlaqueState) {
  const backingWidth = state.width + WOOD_BACKING_EXTRA_MM;
  const backingHeight = state.height + WOOD_BACKING_EXTRA_MM;
  const knownPrice = findKnownWoodPrice(backingWidth, backingHeight);
  if (knownPrice) return knownPrice.priceExVat;

  const areaM2 = (backingWidth * backingHeight) / 1_000_000;
  return Math.max(
    WOOD_MINIMUM_UNIT_EX_VAT,
    WOOD_BASE_CHARGE_EX_VAT + (WOOD_AREA_RATE_EX_VAT_PER_M2 * areaM2),
  );
}

function getTradeEtchedCost(state: PlaqueState, material: PricingMaterial) {
  const areaInches = (state.width / MM_PER_INCH) * (state.height / MM_PER_INCH);
  const etchedBase = areaInches * 0.4;
  const jfkStainless = etchedBase + 10;
  const jfkMirrorBrass = jfkStainless * 1.177;
  const jfkBronzedBrass = jfkMirrorBrass * 1.15;

  if (material === 'stainless') return jfkStainless * 1.155 * 1.1;
  if (material === 'brass') return jfkMirrorBrass * 1.115 * 1.1;
  return jfkBronzedBrass * 1.115 * 1.1;
}

function getShapeUplift(shape: Shape) {
  return shape === Shape.Oval || shape === Shape.Circle ? SHAPED_PLAQUE_CUTTING_UPLIFT : 1;
}

export function fitsProductionBed(state: Pick<PlaqueState, 'width' | 'height'>) {
  return (state.width <= PRODUCTION_BED_WIDTH && state.height <= PRODUCTION_BED_HEIGHT)
    || (state.width <= PRODUCTION_BED_HEIGHT && state.height <= PRODUCTION_BED_WIDTH);
}

export function estimatePlaquePrice(state: PlaqueState) {
  const material = getPricingMaterial(state.material);
  const supplierCostWithVat = getTradeEtchedCost(state, material) * getShapeUplift(state.shape) * (1 + SUPPLIER_VAT_RATE);
  const costBasis = supplierCostWithVat + PACKAGE_AND_POSTAGE;
  const baseRetail = costBasis / (1 - TARGET_GROSS_MARGIN);
  const normalizedWidth = Math.max(state.width, state.height);
  const normalizedHeight = Math.min(state.width, state.height);
  const benchMinimumRetail = normalizedWidth === 150 && normalizedHeight === 50 ? 69 : 0;
  const plaqueRetail = Math.max(
    benchMinimumRetail,
    roundToNearestPound(fitsProductionBed(state) ? baseRetail : baseRetail * OVERSIZED_BED_UPLIFT)
  );
  const woodAddOn = state.wood && state.shape !== Shape.Heart ? estimateWoodAddOn(state) : 0;

  return plaqueRetail + woodAddOn;
}

export function estimatePlaqueBasePrice(state: PlaqueState) {
  return estimatePlaquePrice({ ...state, wood: false });
}

export function estimateWoodAddOn(state: PlaqueState) {
  if (state.shape === Shape.Heart) return 0;
  const boardPriceExVat = estimateWoodBoardSupplierExVat(state);
  const supplierVat = (boardPriceExVat + WOOD_CARRIAGE_EX_VAT) * SUPPLIER_VAT_RATE;

  return roundToNearestPound(
    boardPriceExVat + supplierVat + WOOD_CARRIAGE_EX_VAT + boardPriceExVat,
  );
}
