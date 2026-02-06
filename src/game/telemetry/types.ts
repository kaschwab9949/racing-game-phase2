import type { TrackSector } from '../track/types';

export type TelemetryChannelId =
  | 'speed'
  | 'throttle'
  | 'brake'
  | 'steer'
  | 'yawRate'
  | 'slipAngle'
  | 'gear';

export type TelemetrySample = {
  time: number;
  s: number;
  speed: number;
  throttle: number;
  brake: number;
  steer: number;
  yawRate: number;
  slipAngle: number;
  offTrack: boolean;
  gear: number | null;
};

export type TelemetryChannelStats = {
  min: number;
  max: number;
  avg: number;
};

export type TelemetryLapStats = {
  channelStats: Record<TelemetryChannelId, TelemetryChannelStats>;
  offTrackTime: number;
  samples: number;
};

export type TelemetrySectorSplit = {
  sector: TrackSector;
  time: number | null;
  deltaBest: number | null;
  deltaGhost: number | null;
};

export type TelemetryLap = {
  samples: TelemetrySample[];
  lapTime: number;
  valid: boolean;
  stats: TelemetryLapStats;
  sectors: TelemetrySectorSplit[];
};

export type TelemetryDeltaState = {
  vsBest: number | null;
  vsGhost: number | null;
};

export type TelemetryHudState = {
  currentLap: TelemetryLap | null;
  bestLap: TelemetryLap | null;
  lastLap: TelemetryLap | null;
  ghostLap: TelemetryLap | null;
  delta: TelemetryDeltaState;
  sectors: TelemetrySectorSplit[];
  hasGhost: boolean;
};

export type TelemetryGraphSeries = {
  id: TelemetryChannelId;
  label: string;
  color: string;
  unit: string;
};
