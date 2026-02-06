import type { TelemetryChannelId, TelemetryGraphSeries } from './types';

export const TELEMETRY_CHANNELS: TelemetryGraphSeries[] = [
  { id: 'speed', label: 'Speed', color: '#38bdf8', unit: 'm/s' },
  { id: 'throttle', label: 'Throttle', color: '#22c55e', unit: '%' },
  { id: 'brake', label: 'Brake', color: '#ef4444', unit: '%' },
  { id: 'steer', label: 'Steer', color: '#a855f7', unit: 'rad' },
  { id: 'yawRate', label: 'Yaw Rate', color: '#f59e0b', unit: 'rad/s' },
  { id: 'slipAngle', label: 'Slip Angle', color: '#eab308', unit: 'rad' },
  { id: 'gear', label: 'Gear', color: '#94a3b8', unit: '' },
];

export const CHANNEL_ID_SET: Record<TelemetryChannelId, true> = {
  speed: true,
  throttle: true,
  brake: true,
  steer: true,
  yawRate: true,
  slipAngle: true,
  gear: true,
};

export const DEFAULT_CHANNELS: TelemetryChannelId[] = ['speed', 'throttle', 'brake', 'steer'];
