import React from 'react';
import type { ReplaySessionMeta } from '../../game/replay';

export function ReplayListPanel({ items, onSelect, onDelete }: { items: ReplaySessionMeta[]; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #333', borderRadius: 6, padding: 6, background: '#12141b' }}>
      {items.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No saved replays</div>}
      {items.map((r) => (
        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #222' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{r.modeLabel}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{r.trackId} · {formatTime(r.duration)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onSelect(r.id)} style={btnStyle}>Watch</button>
            <button onClick={() => onDelete(r.id)} style={btnStyle}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid #333',
  background: '#1d1f27',
  color: '#e6e6e6',
  cursor: 'pointer',
};

function formatTime(t: number): string {
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
