import type React from 'react';
import type { TelemetryLap } from '../../game/telemetry/types';

function formatTime(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--:--.---';
  const ms = Math.floor(value * 1000);
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  const msPart = ms % 1000;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(msPart).padStart(3, '0')}`;
}

export function TelemetryLapOverview({
  current,
  last,
  best,
}: {
  current: TelemetryLap | null;
  last: TelemetryLap | null;
  best: TelemetryLap | null;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Current Lap</div>
        <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{formatTime(current?.lapTime ?? null)}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Samples: {current?.stats.samples ?? 0}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Last Lap</div>
        <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{formatTime(last?.lapTime ?? null)}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Off-track: {last ? `${last.stats.offTrackTime.toFixed(2)}s` : '--'}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Best Lap</div>
        <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#22c55e' }}>{formatTime(best?.lapTime ?? null)}</div>
        <div style={{ fontSize: 11, opacity: 0.6 }}>Off-track: {best ? `${best.stats.offTrackTime.toFixed(2)}s` : '--'}</div>
      </div>
    </div>
  );
}
