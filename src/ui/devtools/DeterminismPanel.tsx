import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GameEngine } from '../../game/engine';
import type { DeterminismSettings } from '../../devtools/determinism/types';
import { InputTapeStorage } from '../../devtools/determinism/InputTapeStorage';
import type { InputTapeSummary } from '../../devtools/determinism/types';
import { buttonStyle, labelStyle, rowStyle, sectionStyle } from './DevtoolsStyles';

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid #2a2d3a',
  background: '#101218',
  color: '#e6e6e6',
};

export function DeterminismPanel({
  engine,
  settings,
  onSettingsChange,
}: {
  engine: GameEngine;
  settings: DeterminismSettings;
  onSettingsChange: (patch: Partial<DeterminismSettings>) => void;
}) {
  const storage = useMemo(() => new InputTapeStorage(), []);
  const [tapes, setTapes] = useState<InputTapeSummary[]>([]);
  const [selectedTapeId, setSelectedTapeId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const playbackProgress = engine.getInputPlaybackProgress();

  useEffect(() => {
    setTapes(storage.list());
  }, [storage]);

  const refreshTapes = () => setTapes(storage.list());

  const handleToggleDeterminism = () => {
    onSettingsChange({ enabled: !settings.enabled });
  };

  const handleSeedChange = (value: string) => {
    const seed = Number(value);
    if (!Number.isFinite(seed)) return;
    onSettingsChange({ seed });
  };

  const handleFixedDtChange = (value: string) => {
    const dt = Number(value);
    if (!Number.isFinite(dt) || dt <= 0) return;
    onSettingsChange({ fixedStep: { ...settings.fixedStep, dt } });
  };

  const handleRecord = () => {
    onSettingsChange({ enabled: true, mode: 'record' });
    engine.startInputRecording(notes || undefined);
  };

  const handleStopRecord = () => {
    const tape = engine.stopInputRecording();
    if (tape) {
      storage.save(tape);
      refreshTapes();
    }
    onSettingsChange({ mode: 'off' });
  };

  const handlePlayback = () => {
    if (!selectedTapeId) return;
    const tape = storage.load(selectedTapeId);
    if (!tape) return;
    onSettingsChange({
      enabled: true,
      mode: 'playback',
      seed: tape.seed,
      fixedStep: { ...settings.fixedStep, dt: tape.frameDt },
      tapeId: tape.id,
    });
    engine.startInputPlayback(tape);
  };

  const handleStopPlayback = () => {
    engine.stopInputPlayback();
    onSettingsChange({ mode: 'off', tapeId: undefined });
  };

  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Determinism</div>

      <div style={rowStyle}>
        <button style={buttonStyle} onClick={handleToggleDeterminism}>
          {settings.enabled ? 'Disable' : 'Enable'}
        </button>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Seeded RNG + fixed-step clock
        </div>
      </div>

      <div style={labelStyle}>Seed</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="number"
          value={settings.seed}
          onChange={(e) => handleSeedChange(e.target.value)}
        />
      </div>

      <div style={labelStyle}>Fixed DT (seconds)</div>
      <div style={rowStyle}>
        <label style={{ fontSize: 12, opacity: 0.8 }}>
          <input
            type="checkbox"
            checked={settings.fixedStep.enabled}
            onChange={(e) => onSettingsChange({ fixedStep: { ...settings.fixedStep, enabled: e.target.checked } })}
          />{' '}
          Fixed Step
        </label>
      </div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          type="number"
          step="0.001"
          value={settings.fixedStep.dt}
          onChange={(e) => handleFixedDtChange(e.target.value)}
        />
      </div>

      <div style={{ fontWeight: 700, margin: '10px 0 6px' }}>Input Tapes</div>
      <div style={labelStyle}>Notes (optional)</div>
      <div style={rowStyle}>
        <input
          style={inputStyle}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., clean lap baseline"
        />
      </div>

      <div style={rowStyle}>
        {settings.mode !== 'record' ? (
          <button style={buttonStyle} onClick={handleRecord}>Record</button>
        ) : (
          <button style={{ ...buttonStyle, background: '#5b1f1f' }} onClick={handleStopRecord}>Stop Recording</button>
        )}
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {settings.mode === 'record' ? 'Recording input each tick' : 'Record a repeatable run'}
        </div>
      </div>

      <div style={labelStyle}>Saved Tapes</div>
      <div style={rowStyle}>
        <select
          style={inputStyle}
          value={selectedTapeId ?? ''}
          onChange={(e) => setSelectedTapeId(e.target.value || null)}
        >
          <option value="">Select a tape</option>
          {tapes.map((tape) => (
            <option key={tape.id} value={tape.id}>
              {new Date(tape.createdAt).toLocaleTimeString()} • {tape.frameCount} frames
            </option>
          ))}
        </select>
        <button style={buttonStyle} onClick={refreshTapes}>Refresh</button>
      </div>

      <div style={rowStyle}>
        {settings.mode !== 'playback' ? (
          <button style={buttonStyle} onClick={handlePlayback}>Play Tape</button>
        ) : (
          <button style={{ ...buttonStyle, background: '#3a2b12' }} onClick={handleStopPlayback}>Stop Playback</button>
        )}
        {playbackProgress && (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Playback {playbackProgress.index}/{playbackProgress.total}
          </div>
        )}
      </div>
    </div>
  );
}
