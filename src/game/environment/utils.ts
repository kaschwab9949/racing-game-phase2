// Utility functions for procedural environment generation

import { randRange } from '../../devtools/determinism/Random';

/**
 * Generates a random number between min and max.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random number between min and max.
 */
export function randomBetween(min: number, max: number): number {
  return randRange(min, max);
}

/**
 * Generates a random color within a given range.
 * @param baseColor The base color in hex format.
 * @param variance The variance in RGB values.
 * @returns A random color in hex format.
 */
export function randomColor(baseColor: string, variance: number): string {
  const base = parseInt(baseColor.slice(1), 16);
  const r = Math.min(255, Math.max(0, (base >> 16) + Math.floor(randRange(-variance / 2, variance / 2))));
  const g = Math.min(255, Math.max(0, ((base >> 8) & 0xff) + Math.floor(randRange(-variance / 2, variance / 2))));
  const b = Math.min(255, Math.max(0, (base & 0xff) + Math.floor(randRange(-variance / 2, variance / 2))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
