import { PlaqueState } from '../types';
import {
  estimatePlaqueBasePrice as estimatePlaqueBasePriceFromPolicy,
  estimatePlaquePrice as estimatePlaquePriceFromPolicy,
  estimateWoodAddOn as estimateWoodAddOnFromPolicy,
  fitsProductionBed as fitsProductionBedFromPolicy,
} from './checkoutPolicy.mjs';

export function fitsProductionBed(state: Pick<PlaqueState, 'width' | 'height'>) {
  return fitsProductionBedFromPolicy(state);
}

export function estimatePlaquePrice(state: PlaqueState) {
  return estimatePlaquePriceFromPolicy(state);
}

export function estimatePlaqueBasePrice(state: PlaqueState) {
  return estimatePlaqueBasePriceFromPolicy(state);
}

export function estimateWoodAddOn(state: PlaqueState) {
  return estimateWoodAddOnFromPolicy(state);
}
