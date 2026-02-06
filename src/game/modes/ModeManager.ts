import type { GameEngine } from '../engine';
import type { TelemetryHudState } from '../telemetry';
import type { RaceControlEvent } from '../raceControl/types';
import type { GameMode, ModeUiState, SessionConfig, SessionResults, SessionPhase } from './types';
import { PracticeMode } from './PracticeMode';
import { TimeTrialMode } from './TimeTrialMode';
import { RaceMode } from './RaceMode';
import { WeekendMode } from './WeekendMode';

export class ModeManager {
  private engine: GameEngine;
  private config: SessionConfig;
  private mode: GameMode;
  private ui: ModeUiState = { panels: [], phase: 'idle' };
  private results: SessionResults | null = null;
  private hud: TelemetryHudState | null = null;
  private raceEvents: RaceControlEvent[] = [];

  constructor(engine: GameEngine, initial: SessionConfig) {
    this.engine = engine;
    this.config = initial;
    this.mode = this.createMode(initial.type);
  }

  private createMode(type: SessionConfig['type']): GameMode {
    switch (type) {
      case 'practice': return new PracticeMode();
      case 'time_trial': return new TimeTrialMode();
      case 'qualifying': return new RaceMode(true);
      case 'race': return new RaceMode(false);
      case 'weekend': return new WeekendMode();
      default: return new PracticeMode();
    }
  }

  public setSessionConfig(config: SessionConfig) {
    this.config = { ...this.config, ...config };
  }

  public getUi(): ModeUiState { return this.ui; }
  public getResults(): SessionResults | null { return this.results; }

  public start(): void {
    this.ui.phase = 'grid';
    this.raceEvents = [];
    this.mode = this.createMode(this.config.type);
    this.mode.start(this.engine, this.config);
    this.ui.phase = 'running';
  }

  public update(dt: number): void {
    if (this.ui.phase !== 'running') return;
    this.mode.update(this.engine, dt);
    if (this.mode.shouldFinish(this.engine, this.config)) {
      this.results = this.mode.buildResults(this.engine, this.config);
      this.ui.phase = 'finished';
    }
  }

  public attachCallbacks(options: {
    onTelemetry?: (hud: TelemetryHudState) => void;
    onRaceControl?: (events: RaceControlEvent[]) => void;
  }) {
    const prevTelemetry = this.engine['options'].onTelemetry;
    this.engine['options'].onTelemetry = (hud) => {
      this.hud = hud;
      options.onTelemetry?.(hud);
      prevTelemetry?.(hud);
    };
    const prevRace = this.engine['options'].onRaceControl;
    this.engine['options'].onRaceControl = (state, events) => {
      if (events.length) this.raceEvents.push(...events);
      options.onRaceControl?.(events);
      prevRace?.(state, events);
    };
  }

  /** Advance weekend phase if current mode supports it */
  public advanceWeekendPhase(): void {
    const anyMode = this.mode as any;
    if (typeof anyMode.advancePhase === 'function') {
      anyMode.advancePhase(this.engine);
    }
  }
}
