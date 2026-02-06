import React from 'react';
import type { ReplayCameraMode } from '../../game/replay';

export function ReplayCameraControls({ mode, targetCarId, carOptions, freePan, onModeChange, onTargetChange, onFreePanChange }: {
  mode: ReplayCameraMode;
  targetCarId: string | null;
  carOptions: { id: string; label: string }[];
  freePan: { x: number; y: number };
  onModeChange: (m: ReplayCameraMode) => void;
  onTargetChange: (id: string | null) => void;
  onFreePanChange: (x: number, y: number) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <label style={{ color: '#cfcfcf' }}>Camera Mode
        <select value={mode} onChange={(e) => onModeChange(e.target.value as ReplayCameraMode)} style={{ width: '100%', marginTop: 4 }}>
          <option value="follow_player">Follow Player</option>
          <option value="follow_car">Follow Car</option>
          <option value="overhead">Overhead</option>
          <option value="free_pan">Free Pan</option>
        </select>
      </label>
      <label style={{ color: '#cfcfcf' }}>Target Car
        <select value={targetCarId ?? ''} onChange={(e) => onTargetChange(e.target.value || null)} style={{ width: '100%', marginTop: 4 }}>
          {carOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      {mode === 'free_pan' && (
        <>
          <label style={{ color: '#cfcfcf' }}>Pan X
            <input type="number" value={freePan.x} onChange={(e) => onFreePanChange(Number(e.target.value), freePan.y)} style={{ width: '100%', marginTop: 4 }} />
          </label>
          <label style={{ color: '#cfcfcf' }}>Pan Y
            <input type="number" value={freePan.y} onChange={(e) => onFreePanChange(freePan.x, Number(e.target.value))} style={{ width: '100%', marginTop: 4 }} />
          </label>
        </>
      )}
    </div>
  );
}
