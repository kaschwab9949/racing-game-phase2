import type { CarState } from '../carPhysics';
import { dot, len, perp } from '../math';
import type { TelemetrySample } from './types';
import { wrapAngle } from './utils';

export function buildTelemetrySample(
  car: CarState,
  s: number,
  time: number,
  dt: number,
  prevHeading: number,
  onTrack: boolean
): TelemetrySample {
  const fwd = { x: Math.cos(car.heading), y: Math.sin(car.heading) };
  const right = perp(fwd);
  const vF = dot(car.vel, fwd);
  const vR = dot(car.vel, right);
  const speed = len(car.vel);

  const yawRate = wrapAngle(car.heading - prevHeading) / Math.max(1e-6, dt);
  const slipAngle = Math.atan2(vR, Math.abs(vF));

  return {
    time,
    s,
    speed,
    throttle: car.throttle,
    brake: car.brake,
    steer: car.steer,
    yawRate,
    slipAngle,
    offTrack: !onTrack,
    gear: null,
  };
}
