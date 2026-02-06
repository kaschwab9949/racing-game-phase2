import React from 'react';

export function ReplayTimeline({ time, duration, onScrub }: { time: number; duration: number; onScrub: (t: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <input
        type="range"
        min={0}
        max={Math.max(0.01, duration)}
        step={0.01}
        value={Math.min(time, duration)}
        onChange={(e) => onScrub(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ fontSize: 12, opacity: 0.7 }}>{formatTime(time)} / {formatTime(duration)}</div>
    </div>
  );
}

function formatTime(t: number): string {
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
