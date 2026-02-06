import type { Vec2 } from '../math';
import type { SurfaceType } from '../track/types';

/** Surface classification for penalty purposes */
export type OffTrackZone = 'curb' | 'gravel' | 'runoff' | 'grass' | 'none';

/** Grip multiplier by surface */
export const SURFACE_GRIP: Record<OffTrackZone, number> = {
  none: 1.0,
  curb: 0.92,
  gravel: 0.45,
  runoff: 0.55,
  grass: 0.35,
};

/** Drag multiplier by surface (slower surfaces add rolling resistance) */
export const SURFACE_DRAG: Record<OffTrackZone, number> = {
  none: 1.0,
  curb: 1.0,
  gravel: 1.8,
  runoff: 1.4,
  grass: 1.6,
};

/** Width beyond track edge per surface type (meters) */
export const SURFACE_WIDTHS: Record<Exclude<OffTrackZone, 'none'>, number> = {
  curb: 1.2,
  gravel: 4.0,
  runoff: 8.0,
  grass: 20.0,
};

/** Individual wheel position relative to car center */
export type WheelCorner = 'FL' | 'FR' | 'RL' | 'RR';

/** Per-wheel off-track state */
export interface WheelOffTrackState {
  corner: WheelCorner;
  offTrack: boolean;
  surface: OffTrackZone;
  distanceFromEdge: number;
}

/** Full car track limits snapshot */
export interface TrackLimitsSnapshot {
  timestamp: number;
  s: number;
  wheelsOff: number;
  wheelStates: WheelOffTrackState[];
  allWheelsOff: boolean;
  cutDetected: boolean;
  surface: OffTrackZone;
  gripMultiplier: number;
  dragMultiplier: number;
}

/** Penalty severity levels */
export type PenaltySeverity = 'warning' | 'time_penalty' | 'slowdown';

/** Penalty state machine phases */
export type PenaltyPhase = 'none' | 'warning' | 'pending' | 'serving' | 'served';

/** Individual penalty record */
export interface PenaltyRecord {
  id: number;
  type: 'track_limits' | 'cut' | 'shortcut';
  severity: PenaltySeverity;
  phase: PenaltyPhase;
  issuedAt: number;
  lapIndex: number;
  s: number;
  cornerId?: number;
  timePenalty?: number;
  slowdownRequired?: number;
  slowdownServed?: number;
  servedAt?: number;
}

/** Penalty system configuration */
export interface PenaltyConfig {
  warningsBeforePenalty: number;
  warningDecayTime: number;
  timePenaltySeconds: number;
  slowdownDurationSeconds: number;
  slowdownSpeedLimit: number;
  cutPenaltyMultiplier: number;
}

/** Current penalty system state */
export interface PenaltyState {
  warnings: number;
  warningDecayTimer: number;
  activePenalty: PenaltyRecord | null;
  penaltyHistory: PenaltyRecord[];
  totalTimePenalties: number;
  pendingSlowdown: number;
}

/** Race control event for telemetry logging */
export type RaceControlEventType = 
  | 'off_track'
  | 'cut_detected'
  | 'warning_issued'
  | 'penalty_issued'
  | 'penalty_served'
  | 'warning_decayed';

export interface RaceControlEvent {
  type: RaceControlEventType;
  timestamp: number;
  lapIndex: number;
  s: number;
  details: string;
  penaltyId?: number;
}

/** HUD state for penalty widget */
export interface PenaltyHudState {
  warnings: number;
  maxWarnings: number;
  activePenalty: PenaltyRecord | null;
  phase: PenaltyPhase;
  serveProgress: number;
  totalTimePenalties: number;
  lastEvent: RaceControlEvent | null;
  offTrackZone: OffTrackZone;
  wheelsOff: number;
}

/** Default penalty configuration */
export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  warningsBeforePenalty: 3,
  warningDecayTime: 15.0,
  timePenaltySeconds: 3.0,
  slowdownDurationSeconds: 2.5,
  slowdownSpeedLimit: 80 / 3.6, // 80 km/h in m/s
  cutPenaltyMultiplier: 1.5,
};
