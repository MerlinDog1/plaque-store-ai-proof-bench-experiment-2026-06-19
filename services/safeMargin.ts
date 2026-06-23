import { Shape } from "../types";
import { isBenchPlaqueFormat } from "./plaqueRules";

export const DEFAULT_SAFE_MARGIN_PERCENT = 10;
export const BENCH_SAFE_MARGIN_PERCENT = 10;

export const SAFE_MARGIN_PRESETS = [
  { label: "Normal", percent: 10 },
  { label: "Aggressive", percent: 16 },
  { label: "Max", percent: 24 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function getSafeMarginPercent(value?: number) {
  return clamp(Number.isFinite(value) ? Number(value) : DEFAULT_SAFE_MARGIN_PERCENT, 6, 30);
}

export function getSafeMarginMm(params: {
  width: number;
  height: number;
  shape: Shape;
  safeMargin?: number;
}) {
  const minSide = Math.min(params.width, params.height);
  const percentMargin = minSide * (getSafeMarginPercent(params.safeMargin) / 100);
  const shapeFloor = params.shape === Shape.Rect
    ? minSide * 0.06
    : params.shape === Shape.Heart
      ? minSide * 0.13
      : minSide * 0.16;
  return clamp(Math.max(percentMargin, shapeFloor), shapeFloor, minSide * 0.30);
}

export function getSafeMarginsMm(params: {
  width: number;
  height: number;
  shape: Shape;
  safeMargin?: number;
}) {
  const base = getSafeMarginMm(params);
  if (!isBenchPlaqueFormat(params.width, params.height, params.shape)) {
    return { x: base, y: base };
  }

  const minSide = Math.min(params.width, params.height);
  const longSide = Math.max(params.width, params.height);
  const percentMargin = minSide * (getSafeMarginPercent(params.safeMargin) / 100);
  const horizontal = clamp(
    Math.max(percentMargin, minSide * 0.18, longSide * 0.065),
    minSide * 0.14,
    minSide * 0.32,
  );

  return { x: horizontal, y: base };
}
