import React from 'react';
import type { SessionResults } from '../game/modes/types';
function formatTime(t: number | null): string {
  if (t === null || !Number.isFinite(t)) return '--:--.---';
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function ResultsLapChart({ results }: { results: SessionResults }) {
  const laps = results.lapResults ?? [];
  if (!laps.length) return null;
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#e6e6e6' }}>Lap Chart</div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 100px 80px 1fr', gap: 6, marginTop: 6 }}>
        <div style={{ opacity: 0.7 }}>Lap</div>
        <div style={{ opacity: 0.7 }}>Time</div>
        <div style={{ opacity: 0.7 }}>Valid</div>
        <div style={{ opacity: 0.7 }}>Sectors</div>
        {laps.map((lap) => (
          <React.Fragment key={lap.lapIndex}>
            <div>#{lap.lapIndex + 1}</div>
            <div>{formatTime(lap.time)}</div>
            <div>{lap.valid ? '✔' : '✖'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(lap.sectors ?? []).map(s => (
                <span key={s.id} style={{ padding: '2px 6px', borderRadius: 4, background: '#1d1f27', border: '1px solid #333' }}>{s.id}: {s.time !== null ? formatTime(s.time) : '—'}</span>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
