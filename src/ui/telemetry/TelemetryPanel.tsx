import { useMemo, useState } from 'react';
import type React from 'react';
import type { TelemetryChannelId, TelemetryHudState } from '../../game/telemetry/types';
import { DEFAULT_CHANNELS } from '../../game/telemetry/channels';
import { TelemetryGraph } from './TelemetryGraph';
import { TelemetryChannelPicker } from './TelemetryChannelPicker';
import { TelemetryLegend } from './TelemetryLegend';
import { TelemetryExportPanel } from './TelemetryExportPanel';
import { TelemetryLapOverview } from './TelemetryLapOverview';
import { TelemetryStatsPanel } from './TelemetryStatsPanel';

export type TelemetryPanelProps = {
  telemetry: TelemetryHudState | null;
  onClose: () => void;
};

export function TelemetryPanel({ telemetry, onClose }: TelemetryPanelProps) {
  const [channels, setChannels] = useState<TelemetryChannelId[]>(DEFAULT_CHANNELS);
  const [zoom, setZoom] = useState({ start: 0, end: 1 });

  const lap = telemetry?.currentLap ?? telemetry?.lastLap ?? null;
  const bestLap = telemetry?.bestLap ?? null;
  const ghostLap = telemetry?.ghostLap ?? null;

  const zoomRange = useMemo(() => {
    if (zoom.start >= zoom.end) {
      return { start: 0, end: 1 };
    }
    return zoom;
  }, [zoom]);

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <div>
          <div className="telemetry-title">Telemetry</div>
          <div className="telemetry-subtitle">Track distance on X-axis</div>
        </div>
        <button className="telemetry-close" onClick={onClose}>Close</button>
      </div>

      <div className="telemetry-section">
        <TelemetryLapOverview
          current={telemetry?.currentLap ?? null}
          last={telemetry?.lastLap ?? null}
          best={telemetry?.bestLap ?? null}
        />
      </div>

      <div className="telemetry-section">
        <TelemetryGraph
          lap={lap}
          bestLap={bestLap}
          ghostLap={ghostLap}
          channels={channels}
          zoom={zoomRange}
        />
        <div style={{ marginTop: 8 }}>
          <TelemetryLegend channels={channels} />
        </div>
      </div>

      <div className="telemetry-section telemetry-grid">
        <div>
          <div className="telemetry-section-title">Channels</div>
          <TelemetryChannelPicker selected={channels} onChange={setChannels} />
        </div>
        <div>
          <div className="telemetry-section-title">Zoom</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12 }}>Start ({(zoom.start * 100).toFixed(0)}%)</label>
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.01}
              value={zoom.start}
              onChange={(e) => setZoom((prev) => ({ ...prev, start: Number(e.target.value) }))}
            />
            <label style={{ fontSize: 12 }}>End ({(zoom.end * 100).toFixed(0)}%)</label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={zoom.end}
              onChange={(e) => setZoom((prev) => ({ ...prev, end: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div>
          <div className="telemetry-section-title">Export</div>
          <TelemetryExportPanel lastLap={telemetry?.lastLap ?? null} bestLap={telemetry?.bestLap ?? null} />
        </div>
      </div>

      <div className="telemetry-section telemetry-grid">
        <TelemetryStatsPanel lap={telemetry?.currentLap ?? null} title="Current Lap Stats" />
        <TelemetryStatsPanel lap={telemetry?.bestLap ?? null} title="Best Lap Stats" />
      </div>

      {!lap && (
        <div className="telemetry-empty">No telemetry data yet. Complete a lap to populate graphs.</div>
      )}
    </div>
  );
}
