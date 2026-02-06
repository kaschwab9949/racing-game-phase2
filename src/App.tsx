import { useEffect, useRef, useState, useCallback } from 'react';
import type React from 'react';
import { GameEngine, type HudState } from './game/engine';
import type { CarVisualUiState } from './game/carVisualSystem';
import type { CarState } from './game/carPhysics';
import type { TrackModel } from './game/track/TrackModel';
import type { TrackDebugState } from './ui/TrackDebugOverlay';
import type { TelemetryHudState } from './game/telemetry';
import { CarTuningOverlay } from './ui/CarTuningOverlay';
import { TrackDebugOverlay } from './ui/TrackDebugOverlay';
import { GraphicsSettingsProvider, useGraphicsSettings } from './game/settings/GraphicsSettingsContext';
import type { PerfFrame } from './game/render/perf/PerfMonitor';
import { PerfHud } from './game/render/perf/PerfHud';
import { GraphicsSettingsPanel } from './ui/GraphicsSettingsPanel';
import { AudioSettingsPanel } from './audio/AudioSettingsPanel';
import { TelemetryPanel } from './ui/telemetry/TelemetryPanel';
import { TelemetryHudWidget } from './ui/telemetry/TelemetryHudWidget';
import { CarSwitcher } from './ui/CarSwitcher';
import { carDatabase } from './game/cars/specs';
import { type CarId, type CarRenderProfileTuning } from './game/cars/specs/types';
import { BMW_M3_CS_G80_SPEC } from './game/cars/specs/bmw_m3_cs';
import { AssistsDisplay } from './ui/AssistsDisplay';
import AssistIndicatorWidget from './ui/input/AssistIndicatorWidget';
import DrivingFeelOverlay from './ui/input/DrivingFeelOverlay';
import AssistSettingsPanel from './ui/input/AssistSettingsPanel';
import InputRemappingPanel from './ui/input/InputRemappingPanel';
import DrivingFeelPanel from './ui/input/DrivingFeelPanel';
import type { AiDebugState, AiGlobalSettings } from './game/ai/types';
import { AiDirectorPanel } from './ui/AiDirectorPanel';
import { DEFAULT_AI_GLOBAL_SETTINGS } from './game/ai/AiSettingsStore';
import type { PenaltyHudState, RaceControlEvent } from './game/raceControl/types';
import { PenaltyWidget } from './ui/PenaltyWidget';
import { RaceControlLog } from './ui/RaceControlLog';
import { ModeSelectionMenu } from './ui/ModeSelectionMenu';
import { SessionConfigPanel } from './ui/SessionConfigPanel';
import { ResultsScreen } from './ui/ResultsScreen';
import { ModeManager } from './game/modes/ModeManager';
import type { SessionConfig, SessionResults } from './game/modes/types';
import { PersistenceManager } from './game/persistence/manager';
import { LeaderboardPanel } from './ui/LeaderboardPanel';
import { ReplayStorage, type ReplaySession, type ReplaySessionMeta } from './game/replay';
import { ReplayViewer } from './ui/replay/ReplayViewer';
import { ReplayListPanel } from './ui/replay/ReplayListPanel';
import { TrackConditionHud } from './game/trackCondition/UI/TrackConditionHud';
import { EvolutionHeatmap } from './game/trackCondition/UI/EvolutionHeatmap';
import type { AssistState, AssistConfig } from './game/assists/types';
import type { InputConfig, ProcessedInput } from './game/input/types';
import { PODIUM_CLUB_TRACE } from './game/track/podiumClubTrace';
import { DevtoolsPanel } from './ui/devtools/DevtoolsPanel';
import { DEFAULT_DETERMINISM_SETTINGS } from './devtools/determinism/defaults';
import type { DeterminismSettings } from './devtools/determinism/types';
import { BenchmarkRunner } from './devtools/benchmark/BenchmarkRunner';
import type { BenchmarkRunState, BenchmarkResult } from './devtools/benchmark/types';
import { BenchmarkStorage } from './devtools/benchmark/BenchmarkStorage';
import { RegressionStore } from './devtools/regression/RegressionStore';
import type { RegressionReport } from './devtools/regression/types';
import { compareResults } from './devtools/regression/RegressionComparator';
import { DevScenarioRunner } from './devtools/scenarios/DevScenarioRunner';

function formatTime(t: number | null): string {
  if (t === null || !Number.isFinite(t)) return '--:--.---';
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

const DEFAULT_CAR_ID = BMW_M3_CS_G80_SPEC.id as CarId;

function AppInner() {
    // New state for overlays and configs
    const [showAssistSettings, setShowAssistSettings] = useState(false);
    const [showInputRemap, setShowInputRemap] = useState(false);
    const [showDrivingFeelPanel, setShowDrivingFeelPanel] = useState(false);
    const [showDrivingFeelOverlay, setShowDrivingFeelOverlay] = useState(false);
    const [assistState, setAssistState] = useState<AssistState | null>(null);
    const [rawInput, setRawInput] = useState<ProcessedInput | null>(null);
    const [inputConfig, setInputConfig] = useState<InputConfig | null>(null);
    const [assistConfig, setAssistConfig] = useState<AssistConfig | null>(null);

    // Handlers for new overlays
    const handleShowAssistSettings = () => setShowAssistSettings(true);
    const handleShowInputRemap = () => setShowInputRemap(true);
    const handleShowDrivingFeelPanel = () => setShowDrivingFeelPanel(true);
    const handleShowDrivingFeelOverlay = () => setShowDrivingFeelOverlay((v) => !v);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { settings, update, notices, pushNotice } = useGraphicsSettings();

  const [hud, setHud] = useState<HudState>({
    speedMps: 0,
    lapIndex: 0,
    currentLapTime: 0,
    lastLapTime: null,
    bestLapTime: null,
    position: 1,
    totalCars: 1,
  });
  const [carVisual, setCarVisual] = useState<CarVisualUiState | null>(null);
  const [debugState, setDebugState] = useState<{ state: TrackDebugState; car: CarState; track: TrackModel } | null>(null);
  const [perfFrame, setPerfFrame] = useState<PerfFrame | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHudMenu, setShowHudMenu] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryHudState | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<CarId>(DEFAULT_CAR_ID);
  const [assists, setAssists] = useState({ abs: true, tcs: true });
  const [aiStates, setAiStates] = useState<AiDebugState[]>([]);
  const [aiSettingsSnapshot, setAiSettingsSnapshot] = useState<AiGlobalSettings>(DEFAULT_AI_GLOBAL_SETTINGS);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [penaltyHud, setPenaltyHud] = useState<PenaltyHudState | null>(null);
  const [raceControlEvents, setRaceControlEvents] = useState<RaceControlEvent[]>([]);
  const [showRaceControlLog, setShowRaceControlLog] = useState(false);
  const [modeType, setModeType] = useState<SessionConfig['type']>('practice');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({ type: 'practice', laps: 5, aiCount: 0, difficulty: 'medium', carId: DEFAULT_CAR_ID });
  const modeManagerRef = useRef<ModeManager | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const persistenceRef = useRef<PersistenceManager | null>(null);
  const replayStorageRef = useRef<ReplayStorage | null>(null);
  const [savedReplays, setSavedReplays] = useState<ReplaySessionMeta[]>([]);
  const [replaySession, setReplaySession] = useState<ReplaySession | null>(null);
  const [showReplayViewer, setShowReplayViewer] = useState(false);
  const [showReplayList, setShowReplayList] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [showDevtools, setShowDevtools] = useState(false);
  const [determinismSettings, setDeterminismSettings] = useState<DeterminismSettings>(DEFAULT_DETERMINISM_SETTINGS);
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkRunState>({ status: 'idle', progress: 0, elapsedSec: 0, remainingSec: 0 });
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [previousBenchmark, setPreviousBenchmark] = useState<BenchmarkResult | null>(null);
  const [regressionReport, setRegressionReport] = useState<RegressionReport | null>(null);
  const benchmarkRunnerRef = useRef<BenchmarkRunner | null>(null);
  const benchmarkStorageRef = useRef<BenchmarkStorage | null>(null);
  const regressionStoreRef = useRef<RegressionStore | null>(null);
  const scenarioRunnerRef = useRef<DevScenarioRunner | null>(null);

  const debugEnabledRef = useRef(settings.debugOverlay);
  useEffect(() => { debugEnabledRef.current = settings.debugOverlay; }, [settings.debugOverlay]);

  useEffect(() => {
    if (PODIUM_CLUB_TRACE.length === 0) {
      pushNotice({ kind: 'info', message: 'Podium Club trace missing. Use Devtools → Track Map.' });
    }
  }, [pushNotice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    let engine: GameEngine;
    try {
      engine = new GameEngine({
        canvas,
        initialCarId: selectedCarId,
        onHud: setHud,
        onCarVisuals: setCarVisual,
        onAssists: setAssists,
        onAssistState: setAssistState,
        onInputState: setRawInput,
        onTrackDebug: (car, lap) => {
          if (!debugEnabledRef.current) {
            setDebugState(null);
            return;
          }
          const track = engine.getTrack();
          const proj = track.project(car.pos);
          const dx = car.pos.x - proj.sample.pos.x;
          const dy = car.pos.y - proj.sample.pos.y;
          const sideDist = dx * proj.sample.normal.x + dy * proj.sample.normal.y;
          const offTrack = sideDist < -proj.sample.widthLeft || sideDist > proj.sample.widthRight;

          let nearestId = -1;
          let nearestDist = Infinity;
          for (const c of track.corners) {
            let d = Math.abs(c.startS - proj.s);
            if (d > track.length / 2) d = track.length - d;
            if (d < nearestDist) {
              nearestDist = d;
              nearestId = c.id;
            }
          }

          setDebugState({
            track,
            car: { ...car },
            state: {
              overlayVisible: true,
              trackLength: track.length,
              lapDistance: lap.sUnwrapped,
              lastLapTime: lap.lastLapTime,
              currentLapTime: lap.currentLapTime,
              straightError: 0,
              lengthError: 0,
              offTrack,
              nearestCornerId: nearestId,
              nearestCornerDist: nearestDist,
            },
          });
        },
        onPerfFrame: setPerfFrame,
        onTelemetry: setTelemetry,
        onAiDebug: (states, settings) => {
          setAiStates(states);
          setAiSettingsSnapshot(settings);
        },
        onRaceControl: (state, events) => {
          setPenaltyHud(state);
          if (events.length > 0) {
            setRaceControlEvents((prev) => [...prev, ...events].slice(-50));
          }
        },
        onGuardrail: (message, patch) => {
          pushNotice({ message, kind: 'warn' });
          update(patch);
        },
        initialGraphicsSettings: settings,
      });
      setBootError(null);
    } catch (err) {
      console.error('Engine boot failed', err);
      setBootError(err instanceof Error ? err.message : String(err));
      return;
    }

    engineRef.current = engine;
    setInputConfig(engine.getInputConfig());
    benchmarkStorageRef.current = new BenchmarkStorage();
    regressionStoreRef.current = new RegressionStore();
    const runner = new BenchmarkRunner({
      engine,
      onUpdate: setBenchmarkState,
      onComplete: (result) => {
        setBenchmarkResult(result);
        benchmarkStorageRef.current?.save(result);
        const previous = regressionStoreRef.current?.load(result.scenarioId) ?? null;
        setPreviousBenchmark(previous);
        setRegressionReport(previous ? compareResults(result, previous) : null);
        regressionStoreRef.current?.save(result);
        setDeterminismSettings(engine.getDeterminismSettings());
      },
    });
    benchmarkRunnerRef.current = runner;
    scenarioRunnerRef.current = new DevScenarioRunner(engine);
    setDeterminismSettings(engine.getDeterminismSettings());
    setBenchmarkResult(benchmarkStorageRef.current?.loadLast() ?? null);

    // Initialize mode manager
    const mm = new ModeManager(engine, sessionConfig);
    mm.attachCallbacks({
      onTelemetry: () => { mm.update(0); },
      onRaceControl: () => {}
    });
    modeManagerRef.current = mm;
    // Persistence manager
    const pm = new PersistenceManager();
    pm.attach(engine);
    persistenceRef.current = pm;
    replayStorageRef.current = new ReplayStorage();
    setSavedReplays(replayStorageRef.current.list());
    engine.start();

    const onResize = () => engine.resizeToDisplaySize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      engine.destroy();
      engineRef.current = null;
      benchmarkRunnerRef.current = null;
      scenarioRunnerRef.current = null;
    };
  }, []);

  // Push live settings into engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGraphicsSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.code === 'KeyT') {
        setShowTelemetry((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const speedKph = Math.round(hud.speedMps * 3.6);

  const toggleDebug = useCallback(() => update({ debugOverlay: !settings.debugOverlay }), [update, settings.debugOverlay]);
  const togglePerfHud = useCallback(() => update({ perfHud: !settings.perfHud }), [update, settings.perfHud]);

  const handleCarSelected = useCallback((id: CarId) => {
    setSelectedCarId(id);
    engineRef.current?.setCar(id);
    setSessionConfig(prev => ({ ...prev, carId: id }));
  }, []);

  const handleInputConfigChange = useCallback((config: InputConfig) => {
    setInputConfig(config);
    engineRef.current?.setInputConfig(config);
  }, []);

  const handleDeterminismChange = useCallback((patch: Partial<DeterminismSettings>) => {
    if (!engineRef.current) return;
    const next = engineRef.current.configureDeterminism(patch);
    setDeterminismSettings(next);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        onPointerDown={() => canvasRef.current?.focus()}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {bootError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          background: 'rgba(10, 10, 20, 0.92)',
          color: '#fff',
          padding: 20,
          fontFamily: 'monospace',
        }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Game Failed To Start</div>
            <div style={{ opacity: 0.9, whiteSpace: 'pre-wrap' }}>{bootError}</div>
            <div style={{ opacity: 0.7, marginTop: 10, fontSize: 12 }}>
              Open DevTools Console for the full stack trace.
            </div>
          </div>
        </div>
      )}

      <div className="session-dock">
        <ModeSelectionMenu
          value={modeType}
          onChange={(t) => { setModeType(t); setSessionConfig(prev => ({ ...prev, type: t })); }}
        />
        <SessionConfigPanel value={sessionConfig} onChange={(next) => setSessionConfig(next)} />
        <div className="session-actions">
          <button onClick={() => { if (modeManagerRef.current) { modeManagerRef.current.setSessionConfig(sessionConfig); modeManagerRef.current.start(); setShowResults(false); engineRef.current?.startReplayRecording(sessionConfig.type); } }} style={btnStyle}>Start Session</button>
          <button onClick={() => { const mm = modeManagerRef.current; if (mm) { const res = mm.getResults(); if (res) { setSessionResults(res); setShowResults(true); } } }} style={btnStyle}>Show Results</button>
          {modeType === 'weekend' && (
            <button onClick={() => modeManagerRef.current?.advanceWeekendPhase()} style={btnStyle}>Next Phase ➜</button>
          )}
        </div>
        <CarSwitcher selectedCarId={selectedCarId} onCarSelected={handleCarSelected} />
      </div>

      

      <AiDirectorPanel
        open={showAiPanel}
        states={aiStates}
        settings={aiSettingsSnapshot}
        onClose={() => setShowAiPanel(false)}
        onSettingsChange={(patch) => {
          if (engineRef.current) {
            setAiSettingsSnapshot(engineRef.current.updateAiSettings(patch));
          } else {
            setAiSettingsSnapshot((prev) => ({ ...prev, ...patch }));
          }
        }}
      />

      

      {showTelemetry && (
        <TelemetryPanel telemetry={telemetry} onClose={() => setShowTelemetry(false)} />
      )}

      {showSettings && <GraphicsSettingsPanel />}

      {settings.perfHud && <PerfHud frame={perfFrame} />}

      {!carVisual?.overlayVisible && (
        <div className="hud-menu">
          <button onClick={() => setShowHudMenu((v) => !v)} style={btnStyle}>
            {showHudMenu ? 'HUD: OPEN' : 'HUD'}
          </button>
          {showHudMenu && (
            <div className="hud-menu-panel">
              <button onClick={() => setShowSettings((v) => !v)} style={btnStyle}>{showSettings ? 'Hide GFX' : 'Graphics'}</button>
              <button onClick={() => setShowTelemetry((v) => !v)} style={btnStyle}>{showTelemetry ? 'Telemetry: ON' : 'Telemetry'}</button>
              <button onClick={() => setShowAiPanel((v) => !v)} style={btnStyle}>{showAiPanel ? 'AI HUD: ON' : 'AI Director'}</button>
              <button onClick={() => setShowRaceControlLog((v) => !v)} style={btnStyle}>{showRaceControlLog ? 'Race Control: ON' : 'Race Control'}</button>
              <button onClick={() => setShowLeaderboard((v) => !v)} style={btnStyle}>{showLeaderboard ? 'Leaderboard: ON' : 'Leaderboard'}</button>
              <button onClick={() => setShowReplayList((v) => !v)} style={btnStyle}>{showReplayList ? 'Replays: ON' : 'Replays'}</button>
              <button onClick={toggleDebug} style={btnStyle}>{settings.debugOverlay ? 'Debug: ON' : 'Debug: OFF'}</button>
              <button onClick={togglePerfHud} style={btnStyle}>{settings.perfHud ? 'Perf HUD: ON' : 'Perf HUD: OFF'}</button>
              <button onClick={() => setShowDevtools((v) => !v)} style={btnStyle}>{showDevtools ? 'Devtools: ON' : 'Devtools'}</button>
              <button onClick={handleShowAssistSettings} style={btnStyle}>Assist Settings</button>
              <button onClick={handleShowInputRemap} style={btnStyle}>Remap Controls</button>
              <button onClick={handleShowDrivingFeelPanel} style={btnStyle}>Driving Feel</button>
              <button onClick={handleShowDrivingFeelOverlay} style={btnStyle}>{showDrivingFeelOverlay ? 'Hide Input Debug' : 'Show Input Debug'}</button>
            </div>
          )}
        </div>
      )}

      <NoticeStack notices={notices} />

      <div className="hud">
        <div className="hud-panel speed-panel">
          <div className="speed-value">
            {speedKph}
            <span className="speed-unit">km/h</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 16 }}>Position: {hud.position}/{hud.totalCars}</div>
        </div>

        <div className="hud-panel lap-panel">
          <div className="lap-label">Lap {hud.lapIndex + 1}</div>
          <div className="lap-time">{formatTime(hud.currentLapTime)}</div>

          {hud.lastLapTime !== null && (
            <div style={{ marginTop: 8 }}>
              <div className="lap-label">Last Lap</div>
              <div style={{ fontSize: 18 }}>{formatTime(hud.lastLapTime)}</div>
            </div>
          )}

          {hud.bestLapTime !== null && (
            <div style={{ marginTop: 8 }}>
              <div className="lap-label">Best Lap</div>
              <div className="best-time" style={{ fontSize: 18 }}>{formatTime(hud.bestLapTime)}</div>
            </div>
          )}
        </div>

        {telemetry && (
          <div className="hud-panel" style={{ bottom: 20, left: 20 }}>
            <TelemetryHudWidget telemetry={telemetry} />
          </div>
        )}

        <div className="controls-hint">WASD or Arrow Keys to drive • R to reset • V to tune visuals • T to toggle telemetry</div>
      </div>
      
      <AssistsDisplay abs={assists.abs} tcs={assists.tcs} />
      {/* New: Professional input/assist overlays */}
      {assistState && <AssistIndicatorWidget assistState={assistState} />}
      {showDrivingFeelOverlay && rawInput && assistState && (
        <DrivingFeelOverlay rawInput={rawInput} assistState={assistState} visible={showDrivingFeelOverlay} />
      )}
      {showAssistSettings && assistConfig && (
        <AssistSettingsPanel config={assistConfig} onConfigChange={setAssistConfig} onClose={() => setShowAssistSettings(false)} />
      )}
      {showInputRemap && inputConfig && (
        <InputRemappingPanel config={inputConfig} onConfigChange={handleInputConfigChange} onClose={() => setShowInputRemap(false)} />
      )}
      {showDrivingFeelPanel && inputConfig && (
        <DrivingFeelPanel config={inputConfig} onConfigChange={handleInputConfigChange} onClose={() => setShowDrivingFeelPanel(false)} />
      )}
      {carVisual && (
        <CarTuningOverlay
          carVisual={carVisual}
          onClose={() => engineRef.current?.setCarVisualOverlayVisible(false)}
          onProfileChange={(id) => engineRef.current?.setCarVisualProfile(id as 'GameplayDialed' | 'RealSpec')}
          onUpdateTuning={(partial) => engineRef.current?.updateCarVisualTuning(partial)}
          onToggleGuides={(value) => engineRef.current?.setGuidesVisible(value)}
          onSpinToggle={(value) => engineRef.current?.setSpinTest(value)}
          onSpinSpeedChange={(value) => engineRef.current?.setSpinTest(true, value)}
          onJitterToggle={(value) => engineRef.current?.setJitterTest(value)}
          onJitterAmplitudeChange={(value) => engineRef.current?.setJitterTest(true, value)}
          onJitterSpeedChange={(value) => engineRef.current?.setJitterTest(true, undefined, value)}
          onSaveProfile={() => engineRef.current?.saveGameplayProfile()}
          onLoadProfile={() => engineRef.current?.loadGameplayProfile()}
        />
      )}
      {debugState && <TrackDebugOverlay {...debugState} />}
      <PenaltyWidget state={penaltyHud} visible={true} />
      <RaceControlLog 
        events={raceControlEvents} 
        visible={showRaceControlLog}
      />
      {showResults && sessionResults && (
        <ResultsScreen
          results={sessionResults}
          onClose={() => setShowResults(false)}
          onSaveReplay={() => {
            const session = engineRef.current?.stopReplayRecording();
            if (session && replayStorageRef.current) {
              replayStorageRef.current.save(session);
              setSavedReplays(replayStorageRef.current.list());
              setReplaySession(session);
            }
          }}
          onWatchReplay={() => {
            if (replaySession) setShowReplayViewer(true);
          }}
        />
      )}
      {showLeaderboard && engineRef.current && persistenceRef.current && (
        <LeaderboardPanel engine={engineRef.current} pm={persistenceRef.current} onClose={() => setShowLeaderboard(false)} />
      )}
      {showReplayViewer && engineRef.current && replaySession && (
        <ReplayViewer engine={engineRef.current} replay={replaySession} onClose={() => setShowReplayViewer(false)} />
      )}
      {showReplayList && (
        <div style={{ position: 'absolute', right: 16, top: 60, zIndex: 190, width: 360, background: 'rgba(20,22,30,0.92)', border: '1px solid #333', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, color: '#e6e6e6' }}>Saved Replays</div>
            <button onClick={() => setShowReplayList(false)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: '#2f3240', color: '#e6e6e6' }}>Close</button>
          </div>
          <ReplayListPanel
            items={savedReplays}
            onSelect={(id) => {
              const replay = replayStorageRef.current?.load(id);
              if (replay) {
                setReplaySession(replay);
                setShowReplayViewer(true);
              }
            }}
            onDelete={(id) => {
              replayStorageRef.current?.remove(id);
              setSavedReplays(replayStorageRef.current?.list() ?? []);
            }}
          />
        </div>
      )}
      {engineRef.current && (
        <TrackConditionHud manager={engineRef.current.getTrackCondition()} />
      )}
      {engineRef.current && (
        <EvolutionHeatmap 
          field={engineRef.current.getTrackCondition().getField()} 
          track={engineRef.current.getTrack()} 
          mode="grip" 
          visible={false /* Managed inside component toggle */} 
        />
      )}
      {engineRef.current && benchmarkRunnerRef.current && scenarioRunnerRef.current && (
        <DevtoolsPanel
          open={showDevtools}
          onClose={() => setShowDevtools(false)}
          engine={engineRef.current}
          determinismSettings={determinismSettings}
          onDeterminismChange={handleDeterminismChange}
          benchmarkRunner={benchmarkRunnerRef.current}
          benchmarkState={benchmarkState}
          benchmarkResult={benchmarkResult}
          regressionReport={regressionReport}
          previousResult={previousBenchmark}
          scenarioRunner={scenarioRunnerRef.current}
        />
      )}
    </>
  );
}

function NoticeStack({ notices }: { notices: { message: string; kind: string; ts: number }[] }) {
  if (!notices.length) return null;
  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 150 }}>
      {notices.map((n) => (
        <div key={n.ts} style={{
          padding: '8px 10px',
          borderRadius: 6,
          background: n.kind === 'warn' ? 'rgba(255,140,0,0.9)' : 'rgba(80,160,255,0.9)',
          color: '#0c0c0c',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)'
        }}>
          {n.message}
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#1d1f27',
  color: '#e6e6e6',
  border: '1px solid #333',
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
};

export default function App() {
  return (
    <GraphicsSettingsProvider>
      <AppInner />
    </GraphicsSettingsProvider>
  );
}
