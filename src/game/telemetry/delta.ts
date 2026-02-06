import type { TelemetryDeltaState, TelemetrySample } from './types';
import { interpolateSample } from './utils';

export function deltaAtS(
  currentSamples: TelemetrySample[],
  referenceSamples: TelemetrySample[] | null,
  s: number
): number | null {
  if (!referenceSamples || referenceSamples.length === 0 || currentSamples.length === 0) return null;
  const current = interpolateSample(currentSamples, s);
  const reference = interpolateSample(referenceSamples, s);
  if (!current || !reference) return null;
  return current.time - reference.time;
}

export function buildDeltaState(
  currentSamples: TelemetrySample[],
  bestSamples: TelemetrySample[] | null,
  ghostSamples: TelemetrySample[] | null,
  s: number
): TelemetryDeltaState {
  return {
    vsBest: deltaAtS(currentSamples, bestSamples, s),
    vsGhost: deltaAtS(currentSamples, ghostSamples, s),
  };
}
