import { ProfessionalInputSystem } from './ProfessionalInputSystem';
import { createCarState, stepCar, checkCarCollision, resolveCarCollision, type CarState } from './carPhysics';
import { createPodiumClubCCW, deltaS, type TrackModel } from './track';
import { createLapState, updateLap, resetLap, type LapState } from './lap';
import { GhostRecorder, type GhostLap } from './ghost';
import { renderRace, type Camera } from './render';
import { lerpVec2, len } from './math';
import { CarVisualSystem, type CarVisualUiState } from './carVisualSystem';
import {
  FIXED_DT,
  MAX_FRAME_DT,
  RACE_PX_PER_M,
  CAMERA_FOLLOW_LERP,
} from './constants';
import {
  DEFAULT_GRAPHICS_SETTINGS,
  type GraphicsSettings,
  type GraphicsSettingsPatch,
  mergeSettings,
} from './settings/graphicsTypes';
import { PerfMonitor, type PerfFrame, type PerfLayerStats } from './render/perf/PerfMonitor';
import { GuardrailController } from './render/perf/GuardrailController';
import { EffectsSystem } from './effects';
import type { EffectsSettings } from './effects/types';
import {
  TelemetryRecorder,
  type TelemetryHudState,
  buildTelemetrySample,
} from './telemetry';
import { carDatabase, type CarDatabaseEntry } from './cars/specs';
import {
  type CarId,
  type CarSpec,
  type CarRenderProfile,
} from './cars/specs/types';
import { sampleGhostAtTime } from './ghost';
import { RacingLineCache } from './ai/line/RacingLineCache';
import { AiDriverController } from './ai/AiDriverController';
import type { AiDebugState, AiGlobalSettings, AiOpponentSnapshot } from './ai/types';
import { AiSettingsStore } from './ai/AiSettingsStore';
import type { AssistState } from './assists/types';
import {
  RaceControlSystem,
  RaceControlTelemetryRecorder,
  type PenaltyHudState,
  type RaceControlEvent,
  type RaceControlState,
} from './raceControl';
import {
  ReplayRecorder,
  ReplayPlayer,
  type ReplaySession,
  type ReplayPlaybackState,
  type ReplayCameraMode,
} from './replay';
import { AudioManager } from '../audio/AudioManager';
import { TrackConditionManager } from './trackCondition/TrackConditionManager';
import { SurfaceLayerRenderer } from './trackCondition/Renderer/SurfaceLayerRenderer';
import { TrackConditionStore } from './trackCondition/TrackConditionStore';
import { WeatherManager } from './trackCondition/WeatherManager';
import { DeterminismManager } from '../devtools/determinism/DeterminismManager';
import { DEFAULT_DETERMINISM_SETTINGS } from '../devtools/determinism/defaults';
import type { DeterminismSettings, InputTape } from '../devtools/determinism/types';
import type { ProcessedInput, InputConfig } from './input/types';

export type HudState = {
  speedMps: number;
  lapIndex: number;
  currentLapTime: number;
  lastLapTime: number | null;
  bestLapTime: number | null;
  position: number;
  totalCars: number;
};

export type AssistsState = {
  abs: boolean;
  tcs: boolean;
};

export type LapCompleteInfo = {
  lapIndex: number;
  lapTime: number;
  valid: boolean;
  isBest: boolean;
};

export type SimulationSnapshot = {
  dt: number;
  simTime: number;
  playerPosition: number;
  lap: LapState;
  playerCar: CarState;
};

export type GameEngineOptions = {
  canvas: HTMLCanvasElement;
  initialCarId: CarId;
  onHud?: (hud: HudState) => void;
  onCarVisuals?: (state: CarVisualUiState) => void;
  onAssists?: (state: AssistsState) => void;
  onAssistState?: (state: AssistState) => void;
  onInputState?: (input: ProcessedInput) => void;
  onTrackDebug?: (car: CarState, lap: LapState) => void;
  onPerfFrame?: (frame: PerfFrame) => void;
  onGuardrail?: (message: string, patch: GraphicsSettingsPatch) => void;
  onTelemetry?: (state: TelemetryHudState) => void;
  onAiDebug?: (states: AiDebugState[], settings: AiGlobalSettings) => void;
  onRaceControl?: (state: PenaltyHudState, events: RaceControlEvent[]) => void;
  initialGraphicsSettings?: GraphicsSettings;
  determinism?: Partial<DeterminismSettings>;
};

interface AICarInfo {
  car: CarState;
  controller: AiDriverController;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputSystem: ProfessionalInputSystem;
  private running = false;
  private raf = 0;
  private lastTs = 0;
  private accumulator = 0;

  private track: TrackModel;
  private playerCar: CarState;
  private aiCars: AICarInfo[] = [];
  private aiCount = 0;
  private lap: LapState;
  private trackSPrev = 0;

  private camera: Camera = { pos: { x: 0, y: 0 }, pxPerMeter: RACE_PX_PER_M };

  private recorder = new GhostRecorder();

  public getTrack(): TrackModel {
    return this.track;
  }
  private bestGhost: GhostLap | null = null;
  private lastGhost: GhostLap | null = null;

  private playerPosition = 1;

  private carVisualSystem: CarVisualSystem;
  private effectsSystem = new EffectsSystem();
  private telemetry: TelemetryRecorder;
  private aiSettings = new AiSettingsStore();
  private aiLineCache: RacingLineCache;
  private aiDebugStates: AiDebugState[] = [];
  private aiIdCounter = 0;
  private raceControl: RaceControlSystem;
  private raceControlTelemetry = new RaceControlTelemetryRecorder();
  private lastRaceControlState: RaceControlState | null = null;

  private replayRecorder: ReplayRecorder | null = null;
  private replayPlayer: ReplayPlayer | null = null;
  private replayModeLabel = 'Free Run';
  private replayCameraMode: ReplayCameraMode = 'follow_player';
  private replayTargetCarId: string | null = null;
  private replayFreePan = { x: 0, y: 0 };

  private frame = 0;
  private graphicsSettings: GraphicsSettings;
  private perfMonitor = new PerfMonitor();
  private guardrail = new GuardrailController();
  private audioManager = new AudioManager();
  private trackCondition: TrackConditionManager;
  private surfaceRenderer: SurfaceLayerRenderer;
  private showTrackConditionOverlay = false;
  private simTime = 0;
  private stepConfig = { ...DEFAULT_DETERMINISM_SETTINGS.fixedStep };
  private determinism = new DeterminismManager(DEFAULT_DETERMINISM_SETTINGS);
  private perfObservers: Array<(frame: PerfFrame) => void> = [];
  private simObservers: Array<(snapshot: SimulationSnapshot) => void> = [];
  private lapObservers: Array<(info: LapCompleteInfo) => void> = [];
  private inputOverride: ((dt: number, car: CarState) => ProcessedInput | null) | null = null;

  constructor(private options: GameEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;

    this.inputSystem = new ProfessionalInputSystem();
    this.track = createPodiumClubCCW();
    this.trackCondition = new TrackConditionManager(this.track);
    this.surfaceRenderer = new SurfaceLayerRenderer(this.trackCondition.getField(), this.track);
    this.aiLineCache = new RacingLineCache(this.track);
    this.raceControl = new RaceControlSystem(this.track);
    this.lap = createLapState();
    this.telemetry = new TelemetryRecorder(this.track);
    this.graphicsSettings =
      options.initialGraphicsSettings ?? { ...DEFAULT_GRAPHICS_SETTINGS };

    const playerCarId = options.initialCarId;
    let playerDbEntry = carDatabase[playerCarId];
    if (!playerDbEntry) {
      const fallbackId = Object.keys(carDatabase)[0];
      if (!fallbackId) {
        throw new Error('No cars in carDatabase');
      }
      console.warn(`Invalid carId '${playerCarId}', falling back to '${fallbackId}'.`);
      playerDbEntry = carDatabase[fallbackId];
    }
    const playerSpec = playerDbEntry.spec;
    const playerRenderProfile = playerDbEntry.renderProfiles['GameplayDialed'];

    const startPos = this.track.getSampleAtS(0).pos;
    const startHeading = this.track.getSampleAtS(0).tangent;

    this.playerCar = createCarState(
      playerSpec,
      startPos,
      Math.atan2(startHeading.y, startHeading.x),
    );
    this.playerCar.isPlayer = true;

    this.spawnAiCars();

    this.carVisualSystem = new CarVisualSystem(
      this.playerCar.spec,
      playerRenderProfile,
    );

    this.camera.pos = { ...this.playerCar.pos };

    this.graphicsSettings = mergeSettings(
      DEFAULT_GRAPHICS_SETTINGS,
      options.initialGraphicsSettings ?? {},
    );

    if (options.determinism) {
      this.configureDeterminism(options.determinism);
    }

    // Initialize track condition systems
    TrackConditionStore.getState().init(this.trackCondition, this.track.metadata.name);
    WeatherManager.getInstance().setCondition(this.trackCondition);
  }

  public getCarSpec(): CarSpec {
    return this.playerCar.spec;
  }

  public getAiSettings(): AiGlobalSettings {
    return this.aiSettings.getGlobal();
  }

  public updateAiSettings(patch: Partial<AiGlobalSettings>): AiGlobalSettings {
    const next = this.aiSettings.updateGlobal(patch);
    this.options.onAiDebug?.(this.aiDebugStates, next);
    return next;
  }

  public getRaceControlState(): RaceControlState | null {
    return this.lastRaceControlState;
  }

  public getRaceControlEventLog(): RaceControlEvent[] {
    return this.raceControl.getEventLog();
  }

  public exportRaceControlTelemetry(): { events: string; samples: string } {
    return {
      events: this.raceControlTelemetry.exportEventsCSV(),
      samples: this.raceControlTelemetry.exportSamplesCSV(),
    };
  }

  public configureDeterminism(patch: Partial<DeterminismSettings>): DeterminismSettings {
    const current = this.determinism.getSettings();
    const next: DeterminismSettings = {
      ...current,
      ...patch,
      fixedStep: {
        ...this.stepConfig,
        ...(patch.fixedStep ?? {}),
      },
    };
    this.stepConfig = { ...next.fixedStep };
    this.determinism.configure(next);
    return { ...next };
  }

  public getDeterminismSettings(): DeterminismSettings {
    return this.determinism.getSettings();
  }

  public startInputRecording(notes?: string): void {
    const settings = this.configureDeterminism({ enabled: true, mode: 'record' });
    this.determinism.resetTime();
    this.determinism.startRecording({
      seed: settings.seed,
      frameDt: this.stepConfig.dt,
      notes,
    });
  }

  public stopInputRecording(): InputTape | null {
    return this.determinism.stopRecording();
  }

  public startInputPlayback(tape: InputTape): void {
    this.configureDeterminism({
      enabled: true,
      seed: tape.seed,
      mode: 'playback',
      fixedStep: { ...this.stepConfig, dt: tape.frameDt },
    });
    this.determinism.resetTime();
    this.determinism.startPlayback(tape);
  }

  public stopInputPlayback(): void {
    this.determinism.stopPlayback();
  }

  public getInputPlaybackProgress(): { index: number; total: number } | null {
    return this.determinism.getPlaybackProgress();
  }

  public setInputOverride(provider: ((dt: number, car: CarState) => ProcessedInput | null) | null): void {
    this.inputOverride = provider;
  }

  public addPerfObserver(cb: (frame: PerfFrame) => void): () => void {
    this.perfObservers.push(cb);
    return () => {
      this.perfObservers = this.perfObservers.filter((f) => f !== cb);
    };
  }

  public addSimulationObserver(cb: (snapshot: SimulationSnapshot) => void): () => void {
    this.simObservers.push(cb);
    return () => {
      this.simObservers = this.simObservers.filter((f) => f !== cb);
    };
  }

  public addLapObserver(cb: (info: LapCompleteInfo) => void): () => void {
    this.lapObservers.push(cb);
    return () => {
      this.lapObservers = this.lapObservers.filter((f) => f !== cb);
    };
  }

  public getSimulationTime(): number {
    return this.simTime;
  }

  public getTelemetryState(): TelemetryHudState | null {
    return this.telemetry.getLastHudState();
  }

  public getPlayerPosition(): number {
    return this.playerPosition;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resizeToDisplaySize();
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  setGraphicsSettings(settings: GraphicsSettings): void {
    this.graphicsSettings = { ...settings };
  }

  getGraphicsSettings(): GraphicsSettings {
    return { ...this.graphicsSettings };
  }

  public getInputConfig(): InputConfig {
    return this.inputSystem.getConfig();
  }

  public setInputConfig(config: InputConfig): void {
    this.inputSystem.updateConfig(config);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.inputSystem.destroy();
  }

  resizeToDisplaySize(): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth * dpr;
    const h = this.canvas.clientHeight * dpr;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  private loop = (ts: number): void => {
    if (!this.running) return;

    const rawDt = (ts - this.lastTs) / 1000;
    const dt = Math.min(rawDt, this.stepConfig.maxFrameDt);
    this.lastTs = ts;

    if (this.stepConfig.enabled) {
      this.accumulator += dt;

      while (this.accumulator >= this.stepConfig.dt) {
        if (this.replayPlayer) {
          this.stepReplay(this.stepConfig.dt);
        } else {
          this.stepSimulation(this.stepConfig.dt);
        }
        this.determinism.advance(this.stepConfig.dt);
        this.simTime += this.stepConfig.dt;
        this.accumulator -= this.stepConfig.dt;
      }
    } else {
      if (this.replayPlayer) {
        this.stepReplay(dt);
      } else {
        this.stepSimulation(dt);
      }
      this.determinism.advance(dt);
      this.simTime += dt;
    }

    this.render(dt);
    this.emitHud();
    this.emitTrackDebug();
    // No-op: inputSystem handles its own frame state if needed

    this.raf = requestAnimationFrame(this.loop);
  };

  private stepSimulation(dt: number): void {

    // Use ProfessionalInputSystem for input/assist pipeline
    const carSpeed = Math.sqrt(
      this.playerCar.vel.x * this.playerCar.vel.x + this.playerCar.vel.y * this.playerCar.vel.y,
    );
    const { finalInput, assistState } = this.inputSystem.processInput(dt, carSpeed);
    if (this.frame % 120 === 0) {
      console.log('[INPUT DEBUG]', { throttle: finalInput.throttle.toFixed(3), brake: finalInput.brake.toFixed(3), steer: finalInput.steer.toFixed(3), rawT: finalInput.raw.throttle.toFixed(3), rawB: finalInput.raw.brake.toFixed(3), speed: carSpeed.toFixed(2) });
    }
    const playbackInput = this.determinism.consumePlaybackInput();
    if (playbackInput === null && this.determinism.hasPlayback()) {
      this.determinism.stopPlayback();
    }
    const overrideInput = this.inputOverride?.(dt, this.playerCar) ?? null;
    const axes = playbackInput ?? overrideInput ?? finalInput;
    this.determinism.recordInput(dt, axes);
    this.options.onInputState?.(axes);

    // Emit assist state to UI
    if (this.options.onAssists) {
      this.options.onAssists({
        abs: assistState.abs.active,
        tcs: assistState.tcs.active
      });
    }
    this.options.onAssistState?.(assistState);

    // Handle reset
    // TODO: Remap reset/session controls to use processed input or keep legacy for now
    // Legacy: keep using keyboard for reset/session controls for now
    // if (axes.reset) { ... }
    if (window && window.document && window.document.activeElement && window.document.activeElement.tagName !== 'INPUT') {
      // Placeholder for remapping session controls
    }
    // Legacy reset
    if (false /* replace with remapped reset if needed */) {
      this.resetRace();
      return;
    }

    // Toggle visual overlay
    // Legacy visual overlay toggle
    if (false /* replace with remapped visual overlay if needed */) {
      this.carVisualSystem.toggleOverlay();
      this.emitCarVisuals();
    }

    // Toggle track condition overlay
    // Legacy track condition overlay toggle
    if (false /* replace with remapped track overlay if needed */) {
      this.showTrackConditionOverlay = !this.showTrackConditionOverlay;
    }

    // Update track condition passive effects
    this.trackCondition.update(dt);

    // Get projections for physics
    const proj = this.track.project(this.playerCar.pos);
    const dx = this.playerCar.pos.x - proj.sample.pos.x;
    const dy = this.playerCar.pos.y - proj.sample.pos.y;
    const playerD = dx * proj.sample.normal.x + dy * proj.sample.normal.y;

    const grip = this.trackCondition.getGripMultiplier(proj.s, playerD);

    // Step player car with dynamic grip
    stepCar(this.playerCar, axes, dt, grip.multiplier);

    // Record tire pass for player
    const speed = len(this.playerCar.vel);
    // Simple slip estimate: angle between velocity and heading
    const angle = Math.atan2(this.playerCar.vel.y, this.playerCar.vel.x) - this.playerCar.heading;
    const slip = Math.abs(Math.sin(angle)) * speed;
    this.trackCondition.onTirePass(proj.s, playerD, speed, slip, 1.0, dt);

    // Update effects system
    const effectsSettings: EffectsSettings = {
      shadows: this.graphicsSettings.shadows,
      skidmarks: this.graphicsSettings.skidmarks,
      particles: this.graphicsSettings.particles,
      cameraShake: this.graphicsSettings.cameraShake,
    };
    this.effectsSystem.update(this.playerCar, dt, effectsSettings);

    // Track progress
    const projNext = this.track.project(this.playerCar.pos);
    const ds = deltaS(this.track.length, this.trackSPrev, projNext.s);
    this.trackSPrev = projNext.s;

    // Check bounds
    // Calculate signed distance along normal
    const dx2 = this.playerCar.pos.x - projNext.sample.pos.x;
    const dy2 = this.playerCar.pos.y - projNext.sample.pos.y;
    const sideDist = dx2 * projNext.sample.normal.x + dy2 * projNext.sample.normal.y;
    const onTrack =
      sideDist >= -projNext.sample.widthLeft && sideDist <= projNext.sample.widthRight;

    // Update lap
    const lapEvent = updateLap(this.lap, dt, this.track.length, {
      s: projNext.s,
      ds,
      onTrack,
    });

    // Record telemetry sample
    const telemetrySample = buildTelemetrySample(
      this.playerCar,
      projNext.s,
      this.lap.currentLapTime,
      dt,
      this.playerCar.heading,
      onTrack,
    );
    this.telemetry.recordSample(telemetrySample);

    // Update race control (track limits + penalties)
    const corner = this.track.getCorner(projNext.s);
    const rcResult = this.raceControl.update(
      this.playerCar,
      dt,
      this.lap.currentLapTime,
      this.lap.lapIndex,
      corner?.id
    );
    this.lastRaceControlState = rcResult.state;

    // Record race control telemetry
    if (rcResult.state.limitsSnapshot && rcResult.state.penaltyHud) {
      this.raceControlTelemetry.recordSample(
        rcResult.state.limitsSnapshot,
        rcResult.state.penaltyHud,
        this.lap.lapIndex
      );
    }
    for (const event of rcResult.events) {
      this.raceControlTelemetry.recordEvent(event);
    }

    // Emit race control state to UI
    if (this.options.onRaceControl && rcResult.state.penaltyHud) {
      this.options.onRaceControl(rcResult.state.penaltyHud, rcResult.events);
    }

    // Record ghost
    this.recorder.record(
      this.lap.currentLapTime,
      this.playerCar.pos,
      this.playerCar.heading,
      this.lap.sUnwrapped,
    );

    if (lapEvent.completed) {
      const finished = this.recorder.finish(lapEvent.lapTime);
      this.recorder.reset();
      this.lastGhost = finished;
      if (lapEvent.isBest) {
        this.bestGhost = finished;
      }
      this.telemetry.finalizeLap(lapEvent.lapTime, lapEvent.valid);
      this.telemetry.setGhostLap(this.bestGhost);

      const completedLapIndex = Math.max(0, this.lap.lapIndex - 1);
      const info: LapCompleteInfo = {
        lapIndex: completedLapIndex,
        lapTime: lapEvent.lapTime,
        valid: lapEvent.valid,
        isBest: lapEvent.isBest,
      };
      this.lapObservers.forEach((cb) => cb(info));
    }

    // Step AI cars
    this.stepAiFleet(dt);

    // Record replay frame (player + AI)
    if (this.replayRecorder) {
      const carsToRecord = [this.playerCar, ...this.aiCars.map(ai => ai.car)];
      this.replayRecorder.recordFrame(dt, carsToRecord);
    }

    // Handle collisions
    this.handleCollisions();

    // Update camera (with effects)
    const t = 1 - Math.exp(-CAMERA_FOLLOW_LERP * dt);
    const basePos = lerpVec2(this.camera.pos, this.playerCar.pos, t);
    this.camera.pos = this.effectsSystem.getCameraPosition(
      basePos,
      dt,
      this.graphicsSettings.cameraShake,
    );

    // Update car visual system
    this.carVisualSystem.update(dt);

    // Calculate positions
    this.calculatePositions();

    const simTime = this.simTime + dt;
    this.simObservers.forEach((cb) =>
      cb({
        dt,
        simTime,
        playerPosition: this.playerPosition,
        lap: this.lap,
        playerCar: this.playerCar,
      }),
    );
  }

  private stepAiFleet(dt: number): void {
    if (!this.aiCars.length) {
      this.aiDebugStates = [];
      return;
    }
    const opponentSnapshots = this.buildOpponentSnapshots();
    const debugStates: AiDebugState[] = [];
    for (const slot of this.aiCars) {
      const opponents = opponentSnapshots.filter(o => o.id !== slot.controller.id);
      const result = slot.controller.update(slot.car, opponents, dt);

      // AI track condition awareness
      const proj = this.track.project(slot.car.pos);
      const dx = slot.car.pos.x - proj.sample.pos.x;
      const dy = slot.car.pos.y - proj.sample.pos.y;
      const d = dx * proj.sample.normal.x + dy * proj.sample.normal.y;

      const grip = this.trackCondition.getGripMultiplier(proj.s, d);
      stepCar(slot.car, result.input, dt, grip.multiplier);

      // Tire pass for AI
      const speed = len(slot.car.vel);
      const angle = Math.atan2(slot.car.vel.y, slot.car.vel.x) - slot.car.heading;
      const slip = Math.abs(Math.sin(angle)) * speed;
      this.trackCondition.onTirePass(proj.s, d, speed, slip, 1.0, dt);

      debugStates.push(result.debug);
    }
    this.aiDebugStates = debugStates;
    this.options.onAiDebug?.(this.aiDebugStates, this.aiSettings.getGlobal());
  }

  private buildOpponentSnapshots(): AiOpponentSnapshot[] {
    const snapshots: AiOpponentSnapshot[] = [];
    const playerProj = this.track.project(this.playerCar.pos);
    snapshots.push({
      id: -1,
      pos: { ...this.playerCar.pos },
      vel: { ...this.playerCar.vel },
      s: playerProj.s,
      isPlayer: true,
      spec: this.playerCar.spec,
    });
    for (const slot of this.aiCars) {
      const proj = this.track.project(slot.car.pos);
      snapshots.push({
        id: slot.controller.id,
        pos: { ...slot.car.pos },
        vel: { ...slot.car.vel },
        s: proj.s,
        isPlayer: false,
        spec: slot.car.spec,
      });
    }
    return snapshots;
  }

  private handleCollisions(): void {
    // Player vs AI
    for (const ai of this.aiCars) {
      if (checkCarCollision(this.playerCar, ai.car)) {
        resolveCarCollision(this.playerCar, ai.car);
        this.audioManager.playCollision(0.7);
      }
    }

    // AI vs AI
    for (let i = 0; i < this.aiCars.length; i++) {
      for (let j = i + 1; j < this.aiCars.length; j++) {
        if (checkCarCollision(this.aiCars[i].car, this.aiCars[j].car)) {
          resolveCarCollision(this.aiCars[i].car, this.aiCars[j].car);
          this.audioManager.playCollision(0.5);
        }
      }
    }
  }

  private calculatePositions(): void {
    const playerProj = this.track.project(this.playerCar.pos);
    const playerProgress = this.lap.lapIndex * this.track.length + playerProj.s;

    let position = 1;
    for (const ai of this.aiCars) {
      const aiProj = this.track.project(ai.car.pos);
      const aiProgress =
        this.lap.lapIndex * this.track.length + aiProj.s; // simplified assumption
      if (aiProgress > playerProgress) {
        position++;
      }
    }
    this.playerPosition = position;
  }

  private resetRace(): void {
    const startPos = this.track.getSampleAtS(0).pos;
    const startHeading = this.track.getSampleAtS(0).tangent;
    this.playerCar = createCarState(
      this.playerCar.spec,
      startPos,
      Math.atan2(startHeading.y, startHeading.x),
    );
    this.playerCar.isPlayer = true;
    this.trackSPrev = 0;
    resetLap(this.lap);
    this.recorder.reset();
    this.camera.pos = { ...this.playerCar.pos };
    this.simTime = 0;
    this.determinism.resetTime();

    // Clear effects
    this.effectsSystem.clear();
    this.telemetry.resetCurrent();
    this.raceControl.reset();
    this.raceControlTelemetry.reset();

    // Reset AI
    this.spawnAiCars();
  }

  private spawnAiCars(): void {
    this.aiCars = [];
    this.aiIdCounter = 0;
    const allCarIds = Object.keys(carDatabase) as CarId[];
    const availableAiCars = allCarIds.filter(id => id !== this.playerCar.spec.id);
    const numAi = this.aiCount;
    const startOffset = -20; // meters behind player
    const spacing = -15; // meters
    for (let i = 0; i < numAi; i++) {
      const carId = availableAiCars[i % availableAiCars.length];
      const spec = carDatabase[carId].spec;
      const startS = (this.track.length + startOffset + i * spacing) % this.track.length;
      const startPos = this.track.getSampleAtS(startS).pos;
      const startHeading = this.track.getSampleAtS(startS).tangent;

      const car = createCarState(
        spec,
        startPos,
        Math.atan2(startHeading.y, startHeading.x),
      );
      car.isAi = true;
      const controller = new AiDriverController({
        id: this.aiIdCounter++,
        slotLabel: `${spec.displayName} #${i + 1}`,
        track: this.track,
        spec,
        cache: this.aiLineCache,
        settings: this.aiSettings,
      });
      this.aiCars.push({ car, controller });
      this.audioManager.addCar(carId);
    }
    this.aiDebugStates = [];
    this.options.onAiDebug?.(this.aiDebugStates, this.aiSettings.getGlobal());
  }

  /** Configure number of AI cars and respawn fleet */
  public setAiCount(count: number): void {
    this.aiCount = Math.max(0, Math.min(24, Math.floor(count)));
    this.spawnAiCars();
  }

  public getAiCount(): number {
    return this.aiCount;
  }

  public resetSession(): void {
    this.resetRace();
  }

  render(dt: number) {
    this.frame++;
    this.resizeToDisplaySize();

    const replayFrame = this.replayPlayer ? this.replayPlayer.getFrame() : null;
    const carsToRender = replayFrame ? this.buildReplayCars(replayFrame) : [this.playerCar, ...this.aiCars.map(ai => ai.car)];

    if (!this.replayPlayer && this.graphicsSettings.showGhost) {
      const ghostFrame = this.bestGhost
        ? sampleGhostAtTime(this.bestGhost, this.lap.currentLapTime)
        : null;
      if (ghostFrame) {
        const ghostCar: CarState = {
          ...createCarState(this.playerCar.spec, ghostFrame.pos, ghostFrame.heading),
          isGhost: true,
        };
        carsToRender.push(ghostCar);
      }
    }

    const targetForVisuals = replayFrame
      ? replayFrame.cars.find(c => c.isPlayer) ?? replayFrame.cars[0]
      : { pos: this.playerCar.pos, heading: this.playerCar.heading } as any;

    const visuals = this.carVisualSystem.getRenderState(
      this.camera.pxPerMeter,
      targetForVisuals.pos,
      targetForVisuals.heading,
    );

    const layerStats: PerfLayerStats = {};
    const start = this.perfMonitor.begin();

    const aiOverlay = {
      enabled: this.aiSettings.getGlobal().debugEnabled,
      states: this.aiDebugStates,
      trackDebug: this.graphicsSettings.debugOverlay,
    };

    // Update camera for replay before rendering
    if (this.replayPlayer && replayFrame) {
      this.updateReplayCamera(replayFrame);
    }

    renderRace(
      this.ctx,
      this.canvas,
      this.camera,
      this.track,
      carsToRender,
      visuals,
      this.graphicsSettings,
      this.effectsSystem,
      aiOverlay,
      this.surfaceRenderer,
      layerStats,
    );

    const perfFrame = this.perfMonitor.end(start, layerStats);
    if (this.graphicsSettings.perfHud && this.options.onPerfFrame) {
      this.options.onPerfFrame(perfFrame);
    }
    this.perfObservers.forEach((cb) => cb(perfFrame));
    const guardAction = this.guardrail.tick(perfFrame, this.graphicsSettings);
    if (guardAction?.applied) {
      const next = mergeSettings(this.graphicsSettings, guardAction.patch);
      this.setGraphicsSettings(next);
      this.options.onGuardrail?.(guardAction.reason, guardAction.patch);
    }
    if (this.options.onTelemetry) {
      this.options.onTelemetry(this.telemetry.getHudState());
    }
    this.emitCarVisuals();
  }

  private emitHud(): void {
    if (!this.options.onHud) return;

    this.options.onHud({
      speedMps: len(this.playerCar.vel),
      lapIndex: this.lap.lapIndex,
      currentLapTime: this.lap.currentLapTime,
      lastLapTime: this.lap.lastLapTime,
      bestLapTime: this.lap.bestLapTime,
      position: this.playerPosition,
      totalCars: this.aiCars.length + 1,
    });
    this.options.onAssists?.({ abs: this.playerCar.abs, tcs: this.playerCar.tcs });
  }

  private emitTrackDebug(): void {
    if (this.options.onTrackDebug) {
      this.options.onTrackDebug(this.playerCar, this.lap);
    }
  }

  private emitCarVisuals() {
    this.options.onCarVisuals?.(
      this.carVisualSystem.getUiState(this.camera.pxPerMeter),
    );
  }

  getCarVisualState(): CarVisualUiState {
    return this.carVisualSystem.getUiState(this.camera.pxPerMeter);
  }
  public getTrackCondition(): TrackConditionManager {
    return this.trackCondition;
  }
  /** Replay controls */
  public startReplayRecording(modeLabel: string): void {
    this.replayModeLabel = modeLabel;
    this.replayRecorder = new ReplayRecorder({ frameDt: this.stepConfig.dt, sampleEveryN: 1, scalePos: 100, scaleHeading: 1000, scaleVel: 100, scaleInput: 1000 });
    this.replayRecorder.reset();
  }

  public stopReplayRecording(): ReplaySession | null {
    if (!this.replayRecorder) return null;
    const session = this.replayRecorder.buildSession({
      id: `${Date.now()}`,
      createdAt: Date.now(),
      trackId: this.track.metadata.name,
      modeLabel: this.replayModeLabel,
      frameDt: this.stepConfig.dt,
    });
    this.replayRecorder = null;
    return session;
  }

  public startReplay(session: ReplaySession): void {
    this.replayPlayer = new ReplayPlayer(session);
    this.replayTargetCarId = session.cars.find(c => c.isPlayer)?.carId ?? session.cars[0]?.carId ?? null;
    this.replayCameraMode = 'follow_player';
    this.replayFreePan = { x: 0, y: 0 };
    const playerCarId = this.replayTargetCarId;
    if (playerCarId) {
      const spec = carDatabase[playerCarId]?.spec;
      const profile = carDatabase[playerCarId]?.renderProfiles['GameplayDialed'];
      if (spec && profile) {
        this.carVisualSystem.setCar(spec, profile);
      }
    }
    this.effectsSystem.clear();
  }

  public stopReplay(): void {
    this.replayPlayer = null;
  }

  public getReplayState(): ReplayPlaybackState | null {
    return this.replayPlayer ? this.replayPlayer.getState() : null;
  }

  public setReplayPaused(paused: boolean): void {
    this.replayPlayer?.setPaused(paused);
  }

  public setReplayTime(t: number): void {
    this.replayPlayer?.setTime(t);
  }

  public setReplaySpeed(speed: number): void {
    this.replayPlayer?.setSpeed(speed);
  }

  public setReplayCameraMode(mode: ReplayCameraMode): void {
    this.replayCameraMode = mode;
    this.replayPlayer?.setCameraMode(mode);
  }

  public setReplayTargetCar(id: string | null): void {
    this.replayTargetCarId = id;
    this.replayPlayer?.setTargetCar(id);
  }

  public setReplayFreePan(x: number, y: number): void {
    this.replayFreePan = { x, y };
    this.replayPlayer?.setFreePan(x, y);
  }

  private stepReplay(dt: number): void {
    this.replayPlayer?.tick(dt);
  }

  private buildReplayCars(frame: { cars: Array<{ carId: string; isPlayer: boolean; pos: { x: number; y: number }; heading: number; vel: { x: number; y: number }; throttle: number; brake: number; steer: number }> }): CarState[] {
    return frame.cars.map((c) => {
      const spec = carDatabase[c.carId]?.spec ?? this.playerCar.spec;
      const car = createCarState(spec, c.pos, c.heading);
      car.vel = { ...c.vel };
      car.throttle = c.throttle;
      car.brake = c.brake;
      car.steer = c.steer;
      car.isPlayer = c.isPlayer;
      car.isAi = !c.isPlayer;
      return car;
    });
  }

  private updateReplayCamera(frame: { cars: Array<{ carId: string; isPlayer: boolean; pos: { x: number; y: number } }> }): void {
    const target =
      frame.cars.find(c => c.carId === this.replayTargetCarId) ||
      frame.cars.find(c => c.isPlayer) ||
      frame.cars[0];

    if (this.replayCameraMode === 'follow_player' || this.replayCameraMode === 'follow_car') {
      if (target) this.camera.pos = { ...target.pos };
      this.camera.pxPerMeter = RACE_PX_PER_M;
    } else if (this.replayCameraMode === 'overhead') {
      const center = this.getTrackCenter();
      this.camera.pos = center;
      this.camera.pxPerMeter = RACE_PX_PER_M * 0.35;
    } else if (this.replayCameraMode === 'free_pan') {
      this.camera.pos = { ...this.replayFreePan };
      this.camera.pxPerMeter = RACE_PX_PER_M * 0.8;
    }
  }

  private getTrackCenter(): { x: number; y: number } {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of this.track.samples) {
      minX = Math.min(minX, s.pos.x);
      maxX = Math.max(maxX, s.pos.x);
      minY = Math.min(minY, s.pos.y);
      maxY = Math.max(maxY, s.pos.y);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }

  setCarVisualOverlayVisible(visible: boolean): void {
    this.carVisualSystem.setOverlayVisible(visible);
    this.emitCarVisuals();
  }

  setCarVisualProfile(id: 'RealSpec' | 'GameplayDialed'): void {
    this.carVisualSystem.setActiveProfile(id);
    this.emitCarVisuals();
  }

  updateCarVisualTuning(
    partial: Partial<CarVisualUiState['profile']['tuning']>,
  ): void {
    this.carVisualSystem.updateGameplayTuning(partial);
    this.emitCarVisuals();
  }

  setGuidesVisible(value: boolean): void {
    this.carVisualSystem.setGuides(value);
    this.emitCarVisuals();
  }

  setSpinTest(enabled: boolean, speedDegPerSec?: number): void {
    const anchor = enabled ? { ...this.playerCar.pos } : undefined;
    this.carVisualSystem.setSpinTest(enabled, speedDegPerSec, anchor);
  }

  setJitterTest(
    enabled: boolean,
    amplitudePx?: number,
    speedHz?: number,
  ): void {
    this.carVisualSystem.setJitterTest(enabled, amplitudePx, speedHz);
  }

  saveGameplayProfile(): void {
    this.carVisualSystem.saveGameplayProfile();
  }

  loadGameplayProfile(): void {
    this.carVisualSystem.loadGameplayProfile();
  }

  setCar(carId: CarId): void {
    const dbEntry = carDatabase[carId];
    if (!dbEntry) {
      console.error(`Car with id ${carId} not found in database`);
      return;
    }
    const { spec, renderProfiles } = dbEntry;
    const renderProfile = renderProfiles['GameplayDialed'];

    this.playerCar.spec = spec;
    this.carVisualSystem.setCar(spec, renderProfile);
    this.resetRace();
    this.emitCarVisuals();
  }
}
