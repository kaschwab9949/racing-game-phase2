import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BenchmarkResult, BenchmarkRunState, BenchmarkScenarioConfig } from '../../devtools/benchmark/types';
import { BENCHMARK_SCENARIOS } from '../../devtools/benchmark/BenchmarkScenario';
import { InputTapeStorage } from '../../devtools/determinism/InputTapeStorage';
import type { InputTapeSummary } from '../../devtools/determinism/types';
import type { BenchmarkRunner } from '../../devtools/benchmark/BenchmarkRunner';
import { buttonStyle, labelStyle, rowStyle, sectionStyle } from './DevtoolsStyles';

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #2a2d3a',
  background: '#101218',
  color: '#e6e6e6',
};

function formatTime(t: number | null): string {
  if (t === null || !Number.isFinite(t)) return '--';
  return `${t.toFixed(3)}s`;
}

export function BenchmarkPanel({
  runner,
  state,
  result,
}: {
  runner: BenchmarkRunner;
  state: BenchmarkRunState;
  result: BenchmarkResult | null;
}) {
  const [scenarioId, setScenarioId] = useState(BENCHMARK_SCENARIOS[0]?.id ?? '');
  const [duration, setDuration] = useState(20);
  const [seed, setSeed] = useState(1337);
  const [selectedTape, setSelectedTape] = useState<string | null>(null);
  const [tapes, setTapes] = useState<InputTapeSummary[]>([]);
  const storage = useMemo(() => new InputTapeStorage(), []);

  useEffect(() => {
    setTapes(storage.list());
  }, [storage]);

  const scenario = BENCHMARK_SCENARIOS.find((s) => s.id === scenarioId) ?? BENCHMARK_SCENARIOS[0];

  useEffect(() => {
    if (!scenario) return;
    setDuration(scenario.durationSec);
    setSeed(scenario.determinism.seed);
  }, [scenario?.id]);

  const handleStart = () => {
    if (!scenario) return;
    const scenarioOverride: BenchmarkScenarioConfig = {
      ...scenario,
      durationSec: duration,
      determinism: { ...scenario.determinism, seed },
      inputTapeId: selectedTape ?? scenario.inputTapeId,
    };
    const tape = selectedTape ? storage.load(selectedTape) ?? undefined : undefined;
    runner.start(scenarioOverride, tape);
  };

  const handleStop = () => runner.stop();

  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Benchmark</div>

      <div style={labelStyle}>Scenario</div>
      <div style={rowStyle}>
        <select
          style={inputStyle}
          value={scenarioId}
          onChange={(e) => setScenarioId(e.target.value)}
        >
          {BENCHMARK_SCENARIOS.map((sc) => (
            <option key={sc.id} value={sc.id}>{sc.label}</option>
          ))}
        </select>
      </div>

      <div style={labelStyle}>Duration (sec)</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>

      <div style={labelStyle}>Seed</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value))}
        />
      </div>

      <div style={labelStyle}>Input Tape (optional)</div>
      <div style={rowStyle}>
        <select
          style={inputStyle}
          value={selectedTape ?? ''}
          onChange={(e) => setSelectedTape(e.target.value || null)}
        >
          <option value="">No tape</option>
          {tapes.map((tape) => (
            <option key={tape.id} value={tape.id}>
              {new Date(tape.createdAt).toLocaleTimeString()} • {tape.frameCount} frames
            </option>
          ))}
        </select>
        <button style={buttonStyle} onClick={() => setTapes(storage.list())}>Refresh</button>
      </div>

      <div style={rowStyle}>
        {!runner.isRunning() ? (
          <button style={buttonStyle} onClick={handleStart}>Start Benchmark</button>
        ) : (
          <button style={{ ...buttonStyle, background: '#5b1f1f' }} onClick={handleStop}>Stop</button>
        )}
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {state.status === 'running'
            ? `${Math.round(state.progress * 100)}% • ${state.remainingSec.toFixed(1)}s left`
            : 'Idle'}
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Latest Result</div>
          <div>Avg FPS: {result.perf.avgFps.toFixed(1)}</div>
          <div>P95 Frame: {result.perf.p95FrameMs.toFixed(2)} ms</div>
          <div>Best Lap: {formatTime(result.gameplay.bestLap)}</div>
          <div>AI Overtakes: {result.gameplay.aiOvertakes}</div>
          <div>Penalties: {result.gameplay.penaltiesIssued}</div>
        </div>
      )}
    </div>
  );
}
