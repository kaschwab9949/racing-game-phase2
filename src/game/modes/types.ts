import type { GameEngine } from '../engine';
import type { CarId } from '../cars/specs/types';
import type { RaceControlEvent } from '../raceControl/types';

export type SessionType = 'practice' | 'time_trial' | 'qualifying' | 'race' | 'weekend';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SessionConfig = {
  type: SessionType;
  laps?: number; // for race/qualifying
  aiCount?: number; // for race/qualifying/practice
  difficulty?: Difficulty;
  carId?: CarId;
  gridSpacingMeters?: number;
};

export type SessionPhase = 'idle' | 'grid' | 'running' | 'finished';

export type LapResult = {
  lapIndex: number;
  time: number;
  valid: boolean;
  sectors?: { id: number; time: number | null; deltaBest: number | null; deltaGhost: number | null }[];
};

export type PenaltySummary = {
  warnings: number;
  timePenaltySeconds: number;
  slowdownServedSeconds: number;
};

export type RaceStandingsRow = {
  position: number;
  label: string; // player or AI slot label
  lapsCompleted: number;
  lastLapTime?: number | null;
};

export type SessionResults = {
  type: SessionType;
  totalLaps?: number;
  lapResults: LapResult[];
  bestLapTime?: number | null;
  sectorSummary?: { sectorId: number; best: number | null }[];
  penalties?: PenaltySummary;
  standings?: RaceStandingsRow[];
  raceControlEvents?: RaceControlEvent[];
};

export interface GameMode {
  id: SessionType;
  label: string;
  start(engine: GameEngine, config: SessionConfig): void;
  update(engine: GameEngine, dt: number): void;
  shouldFinish(engine: GameEngine, config: SessionConfig): boolean;
  buildResults(engine: GameEngine, config: SessionConfig): SessionResults;
}

export interface ModeUiPanel {
  id: string;
  label: string;
  visible: boolean;
}

export type ModeUiState = {
  panels: ModeUiPanel[];
  phase: SessionPhase;
};
