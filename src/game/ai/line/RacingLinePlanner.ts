import type { TrackModel } from '../../track/TrackModel';
import type { RacingLineSample } from '../types';
import { normalize, sub, len, perp, add, scale } from '../../math';

export type RacingLinePlannerOptions = {
  lateralBias?: number;
  smoothing?: number;
};

export class RacingLinePlanner {
  constructor(private track: TrackModel, private options: RacingLinePlannerOptions = {}) {}

  public solve(): RacingLineSample[] {
    const lateralBias = this.options.lateralBias ?? 0.5;
    const smoothing = this.options.smoothing ?? 0.65;

    const samples: RacingLineSample[] = [];
    for (let i = 0; i < this.track.samples.length; i++) {
      const sample = this.track.samples[i];
      const corner = this.track.getCorner(sample.s);
      let apexBias = 0;
      if (corner) {
        const apexDelta = Math.abs(corner.apexS - sample.s);
        const widthSpan = Math.abs(corner.endS - corner.startS);
        const blend = 1 - Math.min(1, apexDelta / (widthSpan * 0.5 + 1));
        apexBias = (corner.apexS < sample.s ? -1 : 1) * blend * lateralBias;
      }
      const offset = sample.normal;
      const targetPos = add(sample.pos, scale(offset, apexBias * (sample.widthLeft + sample.widthRight) * 0.5));
      const prev = samples[samples.length - 1];
      let tangent = sample.tangent;
      if (prev) {
        const delta = sub(targetPos, prev.pos);
        tangent = normalize(delta);
      }
      const curvature = this.estimateCurvature(i, smoothing);
      samples.push({
        s: sample.s,
        pos: targetPos,
        tangent,
        normal: sample.normal,
        curvature,
        widthLeft: sample.widthLeft,
        widthRight: sample.widthRight,
        apexBias,
      });
    }
    return samples;
  }

  private estimateCurvature(index: number, smoothing: number): number {
    const a = this.track.samples[(index - 2 + this.track.samples.length) % this.track.samples.length].pos;
    const b = this.track.samples[(index + this.track.samples.length) % this.track.samples.length].pos;
    const c = this.track.samples[(index + 2) % this.track.samples.length].pos;
    const ab = sub(b, a);
    const bc = sub(c, b);
    const angle = Math.atan2(ab.x * bc.y - ab.y * bc.x, ab.x * bc.x + ab.y * bc.y);
    const chord = len(sub(c, a));
    if (chord < 0.001) return 0;
    const rawCurvature = angle / chord;
    return rawCurvature * smoothing;
  }
}
