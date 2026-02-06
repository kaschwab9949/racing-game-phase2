import type React from 'react';
import type { TelemetryHudState } from '../../game/telemetry/types';
import { TelemetryDeltaBar } from './TelemetryDeltaBar';
import { TelemetrySectorWidget } from './TelemetrySectorWidget';

export function TelemetryHudWidget({ telemetry }: { telemetry: TelemetryHudState | null }) {
  if (!telemetry) return null;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TelemetryDeltaBar delta={telemetry.delta.vsBest} label="Delta vs Best" />
        <TelemetryDeltaBar delta={telemetry.delta.vsGhost} label="Delta vs Ghost" />
      </div>
      <TelemetrySectorWidget sectors={telemetry.sectors} />
    </div>
  );
}
