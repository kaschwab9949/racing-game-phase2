import type { TrackSector } from '../track/types';
import type { TelemetrySample, TelemetrySectorSplit } from './types';
import { clamp, lerp } from './utils';

function timeAtS(samples: TelemetrySample[], s: number): number | null {
  if (!samples.length) return null;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].s === s) return samples[mid].time;
    if (samples[mid].s < s) lo = mid + 1;
    else hi = mid - 1;
  }
  const i = Math.max(0, lo - 1);
  const a = samples[i];
  const b = samples[Math.min(i + 1, samples.length - 1)];
  if (!b || a.s === b.s) return a.time;
  const t = clamp((s - a.s) / (b.s - a.s), 0, 1);
  return lerp(a.time, b.time, t);
}

export function computeSectorSplits(
  sectors: TrackSector[],
  samples: TelemetrySample[],
  bestSamples?: TelemetrySample[] | null,
  ghostSamples?: TelemetrySample[] | null
): TelemetrySectorSplit[] {
  return sectors.map((sector) => {
    const timeStart = timeAtS(samples, sector.startS);
    const timeEnd = timeAtS(samples, sector.endS);
    const sectorTime = timeStart !== null && timeEnd !== null ? Math.max(0, timeEnd - timeStart) : null;

    const bestTimeStart = bestSamples ? timeAtS(bestSamples, sector.startS) : null;
    const bestTimeEnd = bestSamples ? timeAtS(bestSamples, sector.endS) : null;
    const bestSectorTime = bestTimeStart !== null && bestTimeEnd !== null ? Math.max(0, bestTimeEnd - bestTimeStart) : null;

    const ghostTimeStart = ghostSamples ? timeAtS(ghostSamples, sector.startS) : null;
    const ghostTimeEnd = ghostSamples ? timeAtS(ghostSamples, sector.endS) : null;
    const ghostSectorTime = ghostTimeStart !== null && ghostTimeEnd !== null ? Math.max(0, ghostTimeEnd - ghostTimeStart) : null;

    return {
      sector,
      time: sectorTime,
      deltaBest: sectorTime !== null && bestSectorTime !== null ? sectorTime - bestSectorTime : null,
      deltaGhost: sectorTime !== null && ghostSectorTime !== null ? sectorTime - ghostSectorTime : null,
    };
  });
}
