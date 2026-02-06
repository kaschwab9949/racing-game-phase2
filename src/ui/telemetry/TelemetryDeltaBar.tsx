import type React from 'react';

export type TelemetryDeltaBarProps = {
  delta: number | null;
  label: string;
  maxAbs?: number;
};

export function TelemetryDeltaBar({ delta, label, maxAbs = 2 }: TelemetryDeltaBarProps) {
  const clamped = delta === null ? 0 : Math.max(-maxAbs, Math.min(maxAbs, delta));
  const ratio = clamped / maxAbs;
  const percent = Math.abs(ratio) * 50;
  const isPositive = clamped > 0;
  const color = delta === null ? '#64748b' : isPositive ? '#ef4444' : '#22c55e';
  const alignStyle = isPositive ? { left: '50%' } : { right: '50%' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ position: 'relative', height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }}>
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: `${percent}%`,
          background: color,
          borderRadius: 6,
          ...alignStyle,
        }} />
        <div style={{
          position: 'absolute',
          top: -2,
          bottom: -2,
          left: '50%',
          width: 2,
          background: 'rgba(255,255,255,0.5)'
        }} />
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
        {delta === null ? '--.--' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}s`}
      </div>
    </div>
  );
}
