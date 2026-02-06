import React from 'react';
import type { CSSProperties } from 'react';
import type { SessionType } from '../game/modes/types';

export function ModeSelectionMenu({
  value,
  onChange,
  className,
  style,
}: {
  value: SessionType;
  onChange: (v: SessionType) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const modes: { id: SessionType; label: string; desc: string }[] = [
    { id: 'practice', label: 'Practice', desc: 'Free run, no session end' },
    { id: 'time_trial', label: 'Time Trial', desc: 'Chase your PB with ghost' },
    { id: 'qualifying', label: 'Qualifying', desc: 'Set fastest lap for grid' },
    { id: 'race', label: 'Race', desc: 'Grid start, laps, standings' },
    { id: 'weekend', label: 'Weekend', desc: 'Practice → Qualifying → Race' },
  ];
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      <div style={{ fontWeight: 700, color: '#e6e6e6' }}>Session Mode</div>
      {modes.map(m => (
        <button key={m.id} onClick={() => onChange(m.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: value === m.id ? '#2f3240' : '#1d1f27', color: '#e6e6e6', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontWeight: 600 }}>{m.label}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{m.desc}</div>
        </button>
      ))}
    </div>
  );
}
