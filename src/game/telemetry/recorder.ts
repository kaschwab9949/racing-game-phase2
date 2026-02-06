import type { TrackModel } from '../track/TrackModel';
import type { GhostLap } from '../ghost';
import type { TelemetryHudState, TelemetryLap, TelemetrySample } from './types';
import { computeLapStats } from './stats';
import { computeSectorSplits } from './sector';
import { buildDeltaState } from './delta';
import { buildGhostSamples } from './ghostAdapter';

export class TelemetryRecorder {
  private track: TrackModel;
  private currentSamples: TelemetrySample[] = [];
  private bestLap: TelemetryLap | null = null;
  private lastLap: TelemetryLap | null = null;
  private ghostSamples: TelemetrySample[] | null = null;
  private ghostLap: TelemetryLap | null = null;
  private lastHudState: TelemetryHudState | null = null;

  constructor(track: TrackModel) {
    this.track = track;
  }

  resetCurrent(): void {
    this.currentSamples = [];
  }

  setGhostLap(ghost: GhostLap | null): void {
    if (!ghost) {
      this.ghostSamples = null;
      this.ghostLap = null;
      return;
    }
    this.ghostSamples = buildGhostSamples(ghost, this.track);
    this.ghostLap = {
      samples: this.ghostSamples,
      lapTime: ghost.lapTime,
      valid: true,
      stats: computeLapStats(this.ghostSamples),
      sectors: computeSectorSplits(this.track.sectors, this.ghostSamples, this.bestLap?.samples ?? null, null),
    };
  }

  recordSample(sample: TelemetrySample): void {
    this.currentSamples.push(sample);
  }

  finalizeLap(lapTime: number, valid: boolean): void {
    const samples = [...this.currentSamples].sort((a, b) => a.s - b.s);
    const stats = computeLapStats(samples);
    const sectors = computeSectorSplits(this.track.sectors, samples, this.bestLap?.samples ?? null, this.ghostSamples);

    const lap: TelemetryLap = {
      samples,
      lapTime,
      valid,
      stats,
      sectors,
    };

    this.lastLap = lap;
    if (valid) {
      if (!this.bestLap || lapTime < this.bestLap.lapTime) {
        this.bestLap = lap;
      }
    }

    this.currentSamples = [];
  }

  getHudState(): TelemetryHudState {
    const currentSamples = this.currentSamples;
    const sortedCurrentSamples = [...currentSamples].sort((a, b) => a.s - b.s);
    const currentLapTime = currentSamples.length ? currentSamples[currentSamples.length - 1].time : 0;
    const currentS = currentSamples.length ? currentSamples[currentSamples.length - 1].s : 0;

    const currentLap: TelemetryLap | null = sortedCurrentSamples.length
      ? {
          samples: sortedCurrentSamples,
          lapTime: currentLapTime,
          valid: true,
          stats: computeLapStats(sortedCurrentSamples),
          sectors: computeSectorSplits(this.track.sectors, sortedCurrentSamples, this.bestLap?.samples ?? null, this.ghostSamples),
        }
      : null;

    const delta = buildDeltaState(
      sortedCurrentSamples,
      this.bestLap?.samples ?? null,
      this.ghostSamples,
      currentS
    );

    const sectors = currentLap?.sectors ?? [];

    const hudState: TelemetryHudState = {
      currentLap,
      bestLap: this.bestLap,
      lastLap: this.lastLap,
      ghostLap: this.ghostLap,
      delta,
      sectors,
      hasGhost: !!this.ghostSamples?.length,
    };

    this.lastHudState = hudState;
    return hudState;
  }

  getLastHudState(): TelemetryHudState | null {
    return this.lastHudState;
  }
}
