import type React from 'react';
import type { TelemetryLap } from '../../game/telemetry/types';
import { copyTelemetry, exportLapCsv, exportLapJson, telemetryToCsv, telemetryToJson } from '../../game/telemetry/exporter';

export function TelemetryExportPanel({ lastLap, bestLap }: { lastLap: TelemetryLap | null; bestLap: TelemetryLap | null }) {
  const handleCopy = async (lap: TelemetryLap, format: 'json' | 'csv') => {
    const content = format === 'json' ? telemetryToJson(lap) : telemetryToCsv(lap);
    await copyTelemetry(content);
  };

  const renderButtons = (lap: TelemetryLap | null, label: string) => {
    if (!lap) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button onClick={() => exportLapJson(lap, label)} style={btnStyle}>Download JSON</button>
        <button onClick={() => exportLapCsv(lap, label)} style={btnStyle}>Download CSV</button>
        <button onClick={() => handleCopy(lap, 'json')} style={btnStyle}>Copy JSON</button>
        <button onClick={() => handleCopy(lap, 'csv')} style={btnStyle}>Copy CSV</button>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Last Lap Export</div>
        {renderButtons(lastLap, 'last') ?? <div style={{ fontSize: 12, opacity: 0.5 }}>No last lap data.</div>}
      </div>
      <div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Best Lap Export</div>
        {renderButtons(bestLap, 'best') ?? <div style={{ fontSize: 12, opacity: 0.5 }}>No best lap data.</div>}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e5e7eb',
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 12,
  cursor: 'pointer',
};
