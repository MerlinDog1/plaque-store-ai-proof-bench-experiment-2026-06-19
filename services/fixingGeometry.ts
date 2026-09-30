import { BorderStyle, Fixing, PlaqueState, Shape } from "../types";
import { isBenchPlaqueFormat } from './plaqueRules';

// Shared by the SVG proof/export and 3D preview, including restored old proofs.
export function getFixingPositions(state: PlaqueState) {
  if (state.shape === Shape.Heart || ![Fixing.Screws, Fixing.Caps].includes(state.fixing)) return [];
  const { holeInset } = getFixingGeometry(state);
  const offset = state.wood ? 12.5 : 0;
  const count = state.fixingHoleCount ?? (isBenchPlaqueFormat(state.width, state.height, state.shape) ? 2 : 4);
  const corners = state.shape === Shape.Rect && (state.fixing === Fixing.Screws ? count === 4 : state.height >= 80);
  const left = offset + holeInset;
  const right = offset + state.width - holeInset;
  if (!corners) return [{ x: left, y: offset + state.height / 2 }, { x: right, y: offset + state.height / 2 }];
  const top = offset + holeInset;
  const bottom = offset + state.height - holeInset;
  return [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
}

// Shared by the visible hardware and inscription clearance, in millimetres.
export function getFixingGeometry(state: PlaqueState) {
  const isScallopedBorder = state.borderStyle === BorderStyle.Scalloped || state.borderStyle === BorderStyle.DoubleScalloped;
  const borderOuterInset = 3;
  const borderInnerInset = 5;
  const borderStrokeScale = state.width < 100 || state.height < 100 ? 0.5 : 1;
  const fixingBorderClearance = state.fixing === Fixing.Screws ? 2.25 : 2;
  const screwRadius = 2.5;
  const capRadius = state.capSize / 2;
  const fixingRadius = state.fixing === Fixing.Caps ? capRadius : screwRadius;
  const scallopedCapCenterInset = state.capSize === 15 ? 12 : 10;
  const standardCapBorderClearance = state.borderStyle === BorderStyle.Double ? 4 : 2;
  const capBorderInset = state.borderStyle === BorderStyle.Double ? borderInnerInset : borderOuterInset;
  const screwBorderInset = state.borderStyle === BorderStyle.Double ? borderInnerInset : borderOuterInset;
  const borderedCapInset = isScallopedBorder
    ? scallopedCapCenterInset
    : capBorderInset + capRadius + standardCapBorderClearance;
  const borderedFixingInset = state.fixing === Fixing.Caps
    ? borderedCapInset
    : screwBorderInset + fixingRadius + fixingBorderClearance;
  const holeInset = state.border
    ? borderedFixingInset
    : state.fixing === Fixing.Screws ? 7 : 10 + (state.capSize === 15 ? 2 : 0);
  return { isScallopedBorder, borderOuterInset, borderInnerInset, borderStrokeScale, fixingBorderClearance, screwRadius, capRadius, fixingRadius, holeInset };
}
