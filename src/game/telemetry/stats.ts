import type { TelemetryChannelId, TelemetryChannelStats, TelemetryLapStats, TelemetrySample } from './types';
import { calculateMean } from './utils';

function computeStats(values: number[]): TelemetryChannelStats {
  if (!values.length) return { min: 0, max: 0, avg: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max, avg: calculateMean(values) };
}

export function computeLapStats(samples: TelemetrySample[]): TelemetryLapStats {
  const channels: Record<TelemetryChannelId, number[]> = {
    speed: [],
    throttle: [],
    brake: [],
    steer: [],
    yawRate: [],
    slipAngle: [],
    gear: [],
  };

  let offTrackTime = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    channels.speed.push(s.speed);
    channels.throttle.push(s.throttle);
    channels.brake.push(s.brake);
    channels.steer.push(s.steer);
    channels.yawRate.push(s.yawRate);
    channels.slipAngle.push(s.slipAngle);
    if (s.gear !== null) channels.gear.push(s.gear);

    if (i > 0 && s.offTrack) {
      offTrackTime += s.time - samples[i - 1].time;
    }
  }

  const channelStats: Record<TelemetryChannelId, TelemetryChannelStats> = {
    speed: computeStats(channels.speed),
    throttle: computeStats(channels.throttle),
    brake: computeStats(channels.brake),
    steer: computeStats(channels.steer),
    yawRate: computeStats(channels.yawRate),
    slipAngle: computeStats(channels.slipAngle),
    gear: computeStats(channels.gear),
  };

  return {
    channelStats,
    offTrackTime,
    samples: samples.length,
  };
}
