import React, { useEffect, useState } from 'react';
import type { GameEngine } from '../../game/engine';
import { ReplayControls } from './ReplayControls';
import { ReplayTimeline } from './ReplayTimeline';
import { ReplayCameraControls } from './ReplayCameraControls';
import { ReplayInfoPanel } from './ReplayInfoPanel';
import type { ReplaySession } from '../../game/replay';

export function ReplayViewer({ engine, replay, onClose }: { engine: GameEngine; replay: ReplaySession; onClose: () => void }) {
  const [state, setState] = useState(() => engine.getReplayState());

  useEffect(() => {
    engine.startReplay(replay);
    const id = window.setInterval(() => {
      setState(engine.getReplayState());
    }, 120);
    return () => {
      window.clearInterval(id);
      engine.stopReplay();
    };
  }, [engine, replay]);

  if (!state) return null;

  const carOptions = replay.cars.map(c => ({ id: c.carId, label: c.label }));

  return (
    <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 220, background: 'rgba(20,22,30,0.92)', border: '1px solid #333', borderRadius: 8, padding: 12, width: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#e6e6e6' }}>Replay Viewer</div>
        <button onClick={onClose} style={btnStyle}>Exit</button>
      </div>
      <ReplayInfoPanel replay={replay} />
      <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
        <ReplayControls
          paused={state.paused}
          onToggle={() => engine.setReplayPaused(!state.paused)}
          speed={state.speed}
          onSpeedChange={(s) => engine.setReplaySpeed(s)}
        />
        <ReplayTimeline
          time={state.time}
          duration={state.duration}
          onScrub={(t) => engine.setReplayTime(t)}
        />
        <ReplayCameraControls
          mode={state.cameraMode}
          targetCarId={state.targetCarId}
          carOptions={carOptions}
          freePan={state.freePan}
          onModeChange={(m) => engine.setReplayCameraMode(m)}
          onTargetChange={(id) => engine.setReplayTargetCar(id)}
          onFreePanChange={(x, y) => engine.setReplayFreePan(x, y)}
        />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1d1f27',
  color: '#e6e6e6',
  cursor: 'pointer',
};
