import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameEngine } from '../../game/engine';
import type { DeterminismSettings } from '../../devtools/determinism/types';
import type { BenchmarkRunner } from '../../devtools/benchmark/BenchmarkRunner';
import type { BenchmarkResult, BenchmarkRunState } from '../../devtools/benchmark/types';
import type { RegressionReport } from '../../devtools/regression/types';
import type { DevScenarioRunner } from '../../devtools/scenarios/DevScenarioRunner';
import { DeterminismPanel } from './DeterminismPanel';
import { BenchmarkPanel } from './BenchmarkPanel';
import { RegressionPanel } from './RegressionPanel';
import { ScenarioPanel } from './ScenarioPanel';
import { panelStyle, buttonStyle } from './DevtoolsStyles';
import { TrackMapTracer } from '../../game/track/TrackMapTracer';

const tabButtonStyle: CSSProperties = {
  ...buttonStyle,
  padding: '4px 8px',
  fontSize: 12,
};

export function DevtoolsPanel({
  open,
  onClose,
  engine,
  determinismSettings,
  onDeterminismChange,
  benchmarkRunner,
  benchmarkState,
  benchmarkResult,
  regressionReport,
  previousResult,
  scenarioRunner,
}: {
  open: boolean;
  onClose: () => void;
  engine: GameEngine;
  determinismSettings: DeterminismSettings;
  onDeterminismChange: (patch: Partial<DeterminismSettings>) => void;
  benchmarkRunner: BenchmarkRunner;
  benchmarkState: BenchmarkRunState;
  benchmarkResult: BenchmarkResult | null;
  regressionReport: RegressionReport | null;
  previousResult: BenchmarkResult | null;
  scenarioRunner: DevScenarioRunner;
}) {
  const [tab, setTab] = useState<'determinism' | 'benchmark' | 'regression' | 'scenarios' | 'track'>('determinism');

  if (!open) return null;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>Devtools</div>
        <button style={buttonStyle} onClick={onClose}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <button style={tabButtonStyle} onClick={() => setTab('determinism')}>Determinism</button>
        <button style={tabButtonStyle} onClick={() => setTab('benchmark')}>Benchmark</button>
        <button style={tabButtonStyle} onClick={() => setTab('regression')}>Regression</button>
        <button style={tabButtonStyle} onClick={() => setTab('scenarios')}>Scenarios</button>
        <button style={tabButtonStyle} onClick={() => setTab('track')}>Track Map</button>
      </div>

      {tab === 'determinism' && (
        <DeterminismPanel
          engine={engine}
          settings={determinismSettings}
          onSettingsChange={onDeterminismChange}
        />
      )}

      {tab === 'benchmark' && (
        <BenchmarkPanel
          runner={benchmarkRunner}
          state={benchmarkState}
          result={benchmarkResult}
        />
      )}

      {tab === 'regression' && (
        <RegressionPanel
          current={benchmarkResult}
          previous={previousResult}
          report={regressionReport}
        />
      )}

      {tab === 'scenarios' && (
        <ScenarioPanel runner={scenarioRunner} />
      )}

      {tab === 'track' && (
        <TrackMapTracer />
      )}
    </div>
  );
}
