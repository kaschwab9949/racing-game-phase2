import type { TrackModel } from '../../track/TrackModel';
import type { CarSpec } from '../../cars/specs/types';
import type { RacingLineSolution, SpeedProfile } from '../types';
import { RacingLinePlanner } from './RacingLinePlanner';
import { SpeedProfileSolver } from './SpeedProfileSolver';

export class RacingLineCache {
  private lineCache = new Map<string, RacingLineSolution>();
  private speedCache = new Map<string, SpeedProfile>();

  constructor(private track: TrackModel) {}

  getLine(): RacingLineSolution {
    const key = this.cacheKey('line');
    let cached = this.lineCache.get(key);
    if (!cached) {
      const planner = new RacingLinePlanner(this.track, { lateralBias: 0.6 });
      const samples = planner.solve();
      cached = { track: this.track, samples, totalLength: this.track.length };
      this.lineCache.set(key, cached);
    }
    return cached;
  }

  getSpeedProfile(spec: CarSpec): SpeedProfile {
    const key = this.cacheKey(spec.id);
    let cached = this.speedCache.get(key);
    if (!cached) {
      const line = this.getLine();
      const solver = new SpeedProfileSolver(spec, line.samples);
      cached = solver.solve();
      this.speedCache.set(key, cached);
    }
    return cached;
  }

  invalidate(): void {
    this.lineCache.clear();
    this.speedCache.clear();
  }

  private cacheKey(suffix: string): string {
    return `${this.track.metadata.name}:${suffix}`;
  }
}
