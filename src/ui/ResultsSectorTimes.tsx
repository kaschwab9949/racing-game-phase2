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

export function ResultsSectorTimes({ results }: { results: SessionResults }) {
  const sectorSummary = results.sectorSummary ?? [];
  if (!sectorSummary.length) return null;
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#e6e6e6' }}>Sector Times</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {sectorSummary.map(s => (
          <span key={s.sectorId} style={{ padding: '2px 6px', borderRadius: 4, background: '#1d1f27', border: '1px solid #333' }}>{s.sectorId}: {s.best !== null ? formatTime(s.best) : '—'}</span>
        ))}
      </div>
    </div>
  );
}
