import type React from 'react';
import type { TelemetrySectorSplit } from '../../game/telemetry/types';

function formatDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--.--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}s`;
}

function formatTime(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--:--';
  const ms = Math.floor(value * 1000);
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TelemetrySectorWidget({ sectors }: { sectors: TelemetrySectorSplit[] }) {
  if (!sectors.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase' }}>Sectors</div>
      {sectors.map((sector) => (
        <div key={sector.sector.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, fontSize: 12 }}>
          <div style={{ opacity: 0.9 }}>{sector.sector.name ?? `Sector ${sector.sector.id + 1}`}</div>
          <div style={{ fontFamily: 'monospace' }}>{formatTime(sector.time)}</div>
          <div style={{ fontFamily: 'monospace', color: sector.deltaBest !== null && sector.deltaBest <= 0 ? '#22c55e' : '#f97316' }}>
            {formatDelta(sector.deltaBest)}
          </div>
        </div>
      ))}
    </div>
  );
}
