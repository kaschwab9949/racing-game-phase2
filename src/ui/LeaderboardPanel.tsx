import React from 'react';
import type { GameEngine } from '../game/engine';
import { PersistenceManager } from '../game/persistence/manager';

export function LeaderboardPanel({ engine, pm, onClose }: { engine: GameEngine; pm: PersistenceManager; onClose: () => void }) {
  const entries = pm.getLeaderboard(engine);
  return (
    <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 190, background: 'rgba(20,22,30,0.92)', border: '1px solid #333', borderRadius: 8, padding: 12, minWidth: 340 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#e6e6e6' }}>Leaderboard</div>
        <button onClick={onClose} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: '#2f3240', color: '#e6e6e6' }}>Close</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 90px 60px', gap: 6, marginTop: 8 }}>
        <div style={{ opacity: 0.7 }}>#</div>
        <div style={{ opacity: 0.7 }}>Player</div>
        <div style={{ opacity: 0.7 }}>Car</div>
        <div style={{ opacity: 0.7 }}>Time</div>
        {entries.map((e, idx) => (
          <React.Fragment key={e.timestamp}>
            <div>{idx + 1}</div>
            <div>{e.playerName}</div>
            <div>{e.carId}</div>
            <div>{formatTime(e.lapTime)}{!e.valid && ' (X)'}</div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => pm.addLeaderboardFromLastLap(engine)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#2f3240', color: '#e6e6e6' }}>Submit Last Lap</button>
      </div>
    </div>
  );
}

function formatTime(t: number | null): string {
  if (t === null || !Number.isFinite(t)) return '--:--.---';
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
