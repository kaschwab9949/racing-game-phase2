import type { TelemetryLap, TelemetrySample } from './types';

export function telemetryToJson(lap: TelemetryLap): string {
  return JSON.stringify(lap, null, 2);
}

export function telemetryToCsv(lap: TelemetryLap): string {
  const headers = [
    'time',
    's',
    'speed',
    'throttle',
    'brake',
    'steer',
    'yawRate',
    'slipAngle',
    'offTrack',
    'gear',
  ];
  const lines = [headers.join(',')];
  for (const sample of lap.samples) {
    lines.push([
      sample.time.toFixed(4),
      sample.s.toFixed(3),
      sample.speed.toFixed(3),
      sample.throttle.toFixed(3),
      sample.brake.toFixed(3),
      sample.steer.toFixed(3),
      sample.yawRate.toFixed(5),
      sample.slipAngle.toFixed(5),
      sample.offTrack ? '1' : '0',
      sample.gear ?? '',
    ].join(','));
  }
  return lines.join('\n');
}

export function downloadTelemetry(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyTelemetry(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch {
    return false;
  }
}

export function exportLapJson(lap: TelemetryLap, label: string): void {
  downloadTelemetry(telemetryToJson(lap), `telemetry-${label}.json`, 'application/json');
}

export function exportLapCsv(lap: TelemetryLap, label: string): void {
  downloadTelemetry(telemetryToCsv(lap), `telemetry-${label}.csv`, 'text/csv');
}
