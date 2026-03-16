import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/** Design base width (e.g. iPhone 14 Pro). Scale layout for smaller/larger devices. */
const BASE_WIDTH = 390;

/**
 * Scale factor for current device. Clamped so small phones don't get tiny UI
 * and large phones/tablets don't get oversized UI.
 */
const scale = Math.min(Math.max(width / BASE_WIDTH, 0.8), 1.3);

/**
 * Scale a dimension (padding, margin, size) by device width.
 * Use for spacing, icon sizes, and touch targets.
 */
export function scaleSize(n: number): number {
  return Math.round(n * scale);
}

/**
 * Scale font size with a slightly gentler curve so text stays readable.
 */
export function scaleFont(n: number): number {
  const f = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.2);
  return Math.round(n * f);
}

/**
 * Return a height as a percentage of screen height (0–1).
 */
export function pctHeight(pct: number): number {
  return Math.round(height * pct);
}

export const layout = {
  width,
  height,
  scale,
  s: scaleSize,
  f: scaleFont,
  pctH: pctHeight,
} as const;
