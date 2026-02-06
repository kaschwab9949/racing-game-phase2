// Level of Detail (LOD) rules for environment rendering

/**
 * Determines the level of detail based on zoom level.
 * @param zoom The current zoom level.
 * @returns The LOD level (0 = low, 1 = medium, 2 = high).
 */
export function getLOD(zoom: number): number {
  if (zoom > 2) return 0; // Low detail for far zoom
  if (zoom > 1) return 1; // Medium detail for mid zoom
  return 2; // High detail for close zoom
}