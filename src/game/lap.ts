import type { Vec2 } from './math';

export interface LapState {
  lapIndex: number;
  currentLapTime: number;
  lastLapTime: number | null;
  bestLapTime: number | null;
  sUnwrapped: number;
  invalid: boolean;
}

export function createLapState(): LapState {
  return {
    lapIndex: 0,
    currentLapTime: 0,
    lastLapTime: null,
    bestLapTime: null,
    sUnwrapped: 0,
    invalid: false,
  };
}

export function resetLap(state: LapState): void {
  state.lapIndex = 0;
  state.currentLapTime = 0;
  state.lastLapTime = null;
  state.bestLapTime = null;
  state.sUnwrapped = 0;
  state.invalid = false;
}

export interface LapUpdateResult {
  completed: boolean;
  lapTime: number;
  valid: boolean;
  isBest: boolean;
}

export function updateLap(
  state: LapState,
  dt: number,
  trackLength: number,
  info: { s: number; ds: number; onTrack: boolean }
): LapUpdateResult {
  state.currentLapTime += dt;
  state.sUnwrapped += info.ds;

  // Check for lap completion
  const lapsCompleted = Math.floor(state.sUnwrapped / trackLength);
  let result: LapUpdateResult = { completed: false, lapTime: 0, valid: true, isBest: false };

  if (lapsCompleted > state.lapIndex) {
    const lapTime = state.currentLapTime;
    const valid = !state.invalid;
    const isBest = valid && (state.bestLapTime === null || lapTime < state.bestLapTime);

    if (isBest) {
      state.bestLapTime = lapTime;
    }
    
    state.lastLapTime = lapTime;
    state.lapIndex = lapsCompleted;
    state.currentLapTime = 0;
    state.invalid = false;

    result = { completed: true, lapTime, valid, isBest };
  }

  // Mark invalid if off track
  if (!info.onTrack) {
    state.invalid = true;
  }

  return result;
}
