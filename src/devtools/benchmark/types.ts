import type { GraphicsSettingsPatch } from '../../game/settings/graphicsTypes';
import type { WeatherScenario } from '../../game/trackCondition/WeatherManager';

export type BenchmarkScenarioConfig = {
  id: string;
  label: string;
  description?: string;
  durationSec: number;
  aiCount: number;
  graphics: GraphicsSettingsPatch;
  weather?: WeatherScenario | 'custom';
  trackOverrides?: {
    globalGripMultiplier?: number;
    dustIntensity?: number;
    humidity?: number;
  };
  determinism: {
    enabled: boolean;
    seed: number;
  };
  inputTapeId?: string;
  usePlayerBot?: boolean;
};

export type PerfSample = {
  frameTimeMs: number;
  fps: number;
};

export type PerfStats = {
  frameCount: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  avgFrameMs: number;
  p95FrameMs: number;
  p99FrameMs: number;
  worstFrameMs: number;
  budget60Pct: number; // % of frames within 16.67ms
};

export type GameplayStats = {
  lapTimes: number[];
  bestLap: number | null;
  avgLap: number | null;
  sectorBestTimes: Array<number | null>;
  aiOvertakes: number;
  playerOvertakes: number;
  penaltiesIssued: number;
  warningsIssued: number;
};

export type BenchmarkResult = {
  id: string;
  scenarioId: string;
  scenarioLabel: string;
  startedAt: number;
  finishedAt: number;
  durationSec: number;
  seed: number;
  perf: PerfStats;
  gameplay: GameplayStats;
  notes?: string;
};

export type BenchmarkRunState = {
  status: 'idle' | 'running' | 'complete' | 'error';
  scenarioId?: string;
  progress: number; // 0..1
  elapsedSec: number;
  remainingSec: number;
  message?: string;
};
