import type React from 'react';
import type { TelemetryChannelId } from '../../game/telemetry/types';
import { TELEMETRY_CHANNELS } from '../../game/telemetry/channels';

export type TelemetryChannelPickerProps = {
  selected: TelemetryChannelId[];
  onChange: (next: TelemetryChannelId[]) => void;
};

export function TelemetryChannelPicker({ selected, onChange }: TelemetryChannelPickerProps) {
  const toggle = (id: TelemetryChannelId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
      {TELEMETRY_CHANNELS.map((channel) => (
        <label key={channel.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={selected.includes(channel.id)}
            onChange={() => toggle(channel.id)}
          />
          <span style={{ color: channel.color }}>{channel.label}</span>
        </label>
      ))}
    </div>
  );
}
