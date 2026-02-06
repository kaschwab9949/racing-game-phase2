import type React from 'react';
import type { TelemetryChannelId } from '../../game/telemetry/types';
import { TELEMETRY_CHANNELS } from '../../game/telemetry/channels';

export function TelemetryLegend({ channels }: { channels: TelemetryChannelId[] }) {
  const selected = TELEMETRY_CHANNELS.filter((c) => channels.includes(c.id));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {selected.map((channel) => (
        <div key={channel.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: channel.color }} />
          <span>{channel.label}</span>
        </div>
      ))}
    </div>
  );
}
