export * from './types';
export * from './spline';
export * from './TrackModel';
export * from './podiumClubCCW';

export function deltaS(trackLength: number, s1: number, s2: number): number {
  let diff = s2 - s1;
  const half = trackLength / 2;
  if (diff > half) diff -= trackLength;
  if (diff < -half) diff += trackLength;
  return diff;
}

