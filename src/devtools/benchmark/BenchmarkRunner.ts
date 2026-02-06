import type { GameEngine, LapCompleteInfo, SimulationSnapshot } from '../../game/engine';
import type { GraphicsSettings } from '../../game/settings/graphicsTypes';
import { mergeSettings } from '../../game/settings/graphicsTypes';
import type { InputTape } from '../determinism/types';
import { InputTapeStorage } from '../determinism/InputTapeStorage';
import type { BenchmarkResult, BenchmarkRunState, BenchmarkScenarioConfig, PerfSample } from './types';
import { computePerfStats } from './BenchmarkStats';
import { PlayerBot } from './PlayerBot';
import { WeatherManager } from '../../game/trackCondition/WeatherManager';

export type BenchmarkRunnerOptions = {
  engine: GameEngine;
  onUpdate?: (state: BenchmarkRunState) => void;
  onComplete?: (result: BenchmarkResult) => void;
  onError?: (message: string) => void;
};

export class BenchmarkRunner {
  private engine: GameEngine;
  private onUpdate?: (state: BenchmarkRunState) => void;
  private onComplete?: (result: BenchmarkResult) => void;
  private onError?: (message: string) => void;

  private scenario: BenchmarkScenarioConfig | null = null;
  private running = false;
  private startSimTime = 0;
  private duration = 0;
  private startWallTime = 0;
  private perfSamples: PerfSample[] = [];
  private lapTimes: number[] = [];
  private sectorBestTimes: Array<number | null> = [];
  private aiOvertakes = 0;
  private playerOvertakes = 0;
  private lastPosition = 1;
  private warningsIssued = 0;
  private penaltiesIssued = 0;
  private lastUpdate = 0;
  private lastState: BenchmarkRunState = {
    status: 'idle',
    progress: 0,
    elapsedSec: 0,
    remainingSec: 0,
  };

  private unsubscribePerf: (() => void) | null = null;
  private unsubscribeSim: (() => void) | null = null;
  private unsubscribeLap: (() => void) | null = null;

  private previousGraphics: GraphicsSettings | null = null;
  private previousAiCount = 0;
  private previousDeterminism: ReturnType<GameEngine['getDeterminismSettings']> | null = null;
  private playerBot: PlayerBot | null = null;
  private tapeStorage = new InputTapeStorage();

  constructor(options: BenchmarkRunnerOptions) {
    this.engine = options.engine;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
  }

  isRunning(): boolean {
    return this.running;
  }

  getLastState(): BenchmarkRunState {
    return { ...this.lastState };
  }

  start(scenario: BenchmarkScenarioConfig, tape?: InputTape): void {
    if (this.running) return;

    try {
      this.running = true;
      this.scenario = scenario;
      this.perfSamples = [];
      this.lapTimes = [];
      this.sectorBestTimes = [];
      this.aiOvertakes = 0;
      this.playerOvertakes = 0;
      this.warningsIssued = 0;
      this.penaltiesIssued = 0;

      this.previousGraphics = this.engine.getGraphicsSettings();
      this.previousAiCount = this.engine.getAiCount();
      this.previousDeterminism = this.engine.getDeterminismSettings();

      const nextGraphics = mergeSettings(this.previousGraphics, scenario.graphics);
      this.engine.setGraphicsSettings(nextGraphics);
      this.engine.setAiCount(scenario.aiCount);
      this.engine.resetSession();

      this.duration = scenario.durationSec;
      this.startSimTime = this.engine.getSimulationTime();
      this.startWallTime = Date.now();
      this.lastPosition = this.engine.getPlayerPosition();
      this.lastUpdate = this.startSimTime;
      this.engine.configureDeterminism({
        enabled: scenario.determinism.enabled,
        seed: scenario.determinism.seed,
      });

      if (scenario.weather && scenario.weather !== 'custom') {
        WeatherManager.getInstance().setScenario(scenario.weather);
      }

      if (scenario.trackOverrides) {
        const track = this.engine.getTrackCondition();
        if (scenario.trackOverrides.globalGripMultiplier !== undefined) {
          track.setGlobalGripMultiplier(scenario.trackOverrides.globalGripMultiplier);
        }
        track.applyEnvironmentOverrides({
          dustStormIntensity: scenario.trackOverrides.dustIntensity,
          humidity: scenario.trackOverrides.humidity,
        });
      }

      if (scenario.inputTapeId && !tape) {
        tape = this.tapeStorage.load(scenario.inputTapeId) ?? undefined;
      }

      if (tape) {
        this.engine.startInputPlayback(tape);
      } else if (scenario.usePlayerBot) {
        this.playerBot = new PlayerBot(this.engine.getTrack(), this.engine.getCarSpec());
        this.engine.setInputOverride((dt, car) => this.playerBot?.update(car, dt) ?? null);
      }

      this.unsubscribePerf = this.engine.addPerfObserver((frame) => {
        this.perfSamples.push({ frameTimeMs: frame.frameTimeMs, fps: frame.fps });
      });

      this.unsubscribeLap = this.engine.addLapObserver((lap: LapCompleteInfo) => {
        this.lapTimes.push(lap.lapTime);
        const telemetry = this.engine.getTelemetryState();
        const sectors = telemetry?.lastLap?.sectors ?? [];
        if (sectors.length && this.sectorBestTimes.length === 0) {
          this.sectorBestTimes = sectors.map((s) => s.time ?? null);
        }
        sectors.forEach((sector, idx) => {
          if (sector.time === null) return;
          const current = this.sectorBestTimes[idx];
          if (current === null || current === undefined || sector.time < current) {
            this.sectorBestTimes[idx] = sector.time;
          }
        });
      });

      this.unsubscribeSim = this.engine.addSimulationObserver((snapshot: SimulationSnapshot) => {
        if (!this.running) return;
        const elapsed = snapshot.simTime - this.startSimTime;
        if (snapshot.playerPosition !== this.lastPosition) {
          if (snapshot.playerPosition > this.lastPosition) {
            this.aiOvertakes += snapshot.playerPosition - this.lastPosition;
          } else {
            this.playerOvertakes += this.lastPosition - snapshot.playerPosition;
          }
          this.lastPosition = snapshot.playerPosition;
        }

        if (snapshot.simTime - this.lastUpdate >= 1) {
          this.lastUpdate = snapshot.simTime;
          this.emitUpdate(elapsed);
        }

        if (elapsed >= this.duration) {
          this.finish();
        }
      });

      this.emitUpdate(0);
    } catch (err) {
      this.running = false;
      this.onError?.('Failed to start benchmark');
      console.error(err);
    }
  }

  stop(): void {
    if (!this.running) return;
    this.finish();
  }

  private emitUpdate(elapsed: number): void {
    const progress = Math.min(1, elapsed / this.duration);
    this.lastState = {
      status: 'running',
      scenarioId: this.scenario?.id,
      progress,
      elapsedSec: elapsed,
      remainingSec: Math.max(0, this.duration - elapsed),
    };
    this.onUpdate?.(this.lastState);
  }

  private finish(): void {
    if (!this.running || !this.scenario) return;
    this.running = false;

    this.unsubscribePerf?.();
    this.unsubscribeSim?.();
    this.unsubscribeLap?.();
    this.unsubscribePerf = null;
    this.unsubscribeSim = null;
    this.unsubscribeLap = null;

    this.engine.setInputOverride(null);
    this.engine.stopInputPlayback();
    this.playerBot = null;

    const events = this.engine.getRaceControlEventLog();
    this.warningsIssued = events.filter((e) => e.type === 'warning_issued').length;
    this.penaltiesIssued = events.filter((e) => e.type === 'penalty_issued').length;

    if (this.previousGraphics) {
      this.engine.setGraphicsSettings(this.previousGraphics);
    }
    if (this.previousAiCount !== undefined) {
      this.engine.setAiCount(this.previousAiCount);
    }
    if (this.previousDeterminism) {
      this.engine.configureDeterminism(this.previousDeterminism);
    }

    const perf = computePerfStats(this.perfSamples);
    const bestLap = this.lapTimes.length ? Math.min(...this.lapTimes) : null;
    const avgLap = this.lapTimes.length
      ? this.lapTimes.reduce((a, b) => a + b, 0) / this.lapTimes.length
      : null;

    const result: BenchmarkResult = {
      id: `bench_${Date.now()}`,
      scenarioId: this.scenario.id,
      scenarioLabel: this.scenario.label,
      startedAt: this.startWallTime,
      finishedAt: Date.now(),
      durationSec: this.duration,
      seed: this.scenario.determinism.seed,
      perf,
      gameplay: {
        lapTimes: [...this.lapTimes],
        bestLap,
        avgLap,
        sectorBestTimes: [...this.sectorBestTimes],
        aiOvertakes: this.aiOvertakes,
        playerOvertakes: this.playerOvertakes,
        penaltiesIssued: this.penaltiesIssued,
        warningsIssued: this.warningsIssued,
      },
    };

    this.lastState = {
      status: 'complete',
      scenarioId: this.scenario.id,
      progress: 1,
      elapsedSec: this.duration,
      remainingSec: 0,
    };

    this.onUpdate?.(this.lastState);
    this.onComplete?.(result);
  }
}
