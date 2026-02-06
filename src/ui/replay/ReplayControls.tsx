import React from 'react';

export function ReplayControls({ paused, onToggle, speed, onSpeedChange }: { paused: boolean; onToggle: () => void; speed: number; onSpeedChange: (s: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onToggle} style={btnStyle}>{paused ? 'Play' : 'Pause'}</button>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0.5, 1, 2].map((s) => (
          <button key={s} onClick={() => onSpeedChange(s)} style={{ ...btnStyle, background: speed === s ? '#2f3240' : '#1d1f27' }}>{s}x</button>
        ))}
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
