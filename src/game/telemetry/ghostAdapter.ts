import type { GhostLap } from '../ghost';
import type { TrackModel } from '../track/TrackModel';
import type { TelemetrySample } from './types';
import { clamp } from './utils';

export function buildGhostSamples(ghost: GhostLap, track: TrackModel): TelemetrySample[] {
  const samples: TelemetrySample[] = [];
  for (const frame of ghost.frames) {
    const proj = track.project(frame.pos);
    samples.push({
      time: frame.time,
      s: clamp(proj.s, 0, track.length),
      speed: 0,
      throttle: 0,
      brake: 0,
      steer: 0,
      yawRate: 0,
      slipAngle: 0,
      offTrack: false,
      gear: null,
    });
  }
  return samples.sort((a, b) => a.s - b.s);
}
