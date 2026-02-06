import type React from 'react';
import type { TelemetryLap } from '../../game/telemetry/types';
import { TELEMETRY_CHANNELS } from '../../game/telemetry/channels';

export type TelemetryStatsPanelProps = {
  lap: TelemetryLap | null;
  title: string;
};

function formatValue(value: number, unit: string): string {
  if (!Number.isFinite(value)) return '--';
  if (unit === '%') return `${(value * 100).toFixed(0)}%`;
  if (unit) return `${value.toFixed(2)} ${unit}`;
  return value.toFixed(2);
}

export function TelemetryStatsPanel({ lap, title }: TelemetryStatsPanelProps) {
  if (!lap) {
    return (
      <div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>No data.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, fontSize: 12 }}>
        <div style={{ opacity: 0.7 }}>Channel</div>
        <div style={{ opacity: 0.7 }}>Min</div>
        <div style={{ opacity: 0.7 }}>Max</div>
        <div style={{ opacity: 0.7 }}>Avg</div>
        {TELEMETRY_CHANNELS.flatMap((channel) => {
          const stats = lap.stats.channelStats[channel.id];
          const unit = channel.unit === '%' ? '%' : channel.unit;
          return [
            <div key={`${channel.id}-label`} style={{ color: channel.color }}>{channel.label}</div>,
            <div key={`${channel.id}-min`}>{formatValue(stats.min, unit)}</div>,
            <div key={`${channel.id}-max`}>{formatValue(stats.max, unit)}</div>,
            <div key={`${channel.id}-avg`}>{formatValue(stats.avg, unit)}</div>,
          ];
        })}
      </div>
    </div>
  );
}
