import type { TelemetrySample } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function wrapAngle(rad: number): number {
  const twoPi = Math.PI * 2;
  let angle = rad % twoPi;
  if (angle > Math.PI) angle -= twoPi;
  if (angle < -Math.PI) angle += twoPi;
  return angle;
}

export function binarySearchByS(samples: TelemetrySample[], s: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const midS = samples[mid].s;
    if (midS === s) return mid;
    if (midS < s) lo = mid + 1;
    else hi = mid - 1;
  }
  return Math.max(0, lo - 1);
}

export function interpolateSample(samples: TelemetrySample[], s: number): TelemetrySample | null {
  if (samples.length === 0) return null;
  const i = binarySearchByS(samples, s);
  const a = samples[i];
  const b = samples[Math.min(i + 1, samples.length - 1)];
  if (!b || a.s === b.s) return a;
  const t = clamp((s - a.s) / (b.s - a.s), 0, 1);
  return {
    time: lerp(a.time, b.time, t),
    s: lerp(a.s, b.s, t),
    speed: lerp(a.speed, b.speed, t),
    throttle: lerp(a.throttle, b.throttle, t),
    brake: lerp(a.brake, b.brake, t),
    steer: lerp(a.steer, b.steer, t),
    yawRate: lerp(a.yawRate, b.yawRate, t),
    slipAngle: lerp(a.slipAngle, b.slipAngle, t),
    offTrack: a.offTrack || b.offTrack,
    gear: a.gear ?? b.gear ?? null,
  };
}

export function normalizeInput(value: number): number {
  return clamp(value, -1, 1);
}

export function toPercent(value: number): number {
  return clamp(value, 0, 1) * 100;
}

export function calculateMean(values: number[]): number {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}
