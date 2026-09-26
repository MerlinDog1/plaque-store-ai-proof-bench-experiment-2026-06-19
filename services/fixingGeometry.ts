import { BorderStyle, Fixing, PlaqueState } from "../types";

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
