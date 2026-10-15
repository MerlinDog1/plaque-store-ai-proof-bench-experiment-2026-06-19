import { PlaqueState, Shape } from '../types';

export function normalizeCurvedFixings<T extends Partial<Pick<PlaqueState, 'shape' | 'fixingHoleCount'>>>(state: T): T {
  return state.shape === Shape.Circle || state.shape === Shape.Oval
    ? { ...state, fixingHoleCount: 2 }
    : state;
}

export function isBenchPlaqueFormat(width: number, height: number, shape: Shape) {
  if (shape !== Shape.Rect) return false;
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  if (shortSide <= 0) return false;
  return shortSide <= 90 && longSide / shortSide >= 3;
}
