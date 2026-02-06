import type { Vec2 } from '../math';
import { add, sub, scale, len, normalize, dot } from '../math';

// Catmull-Rom spline interpolation
// p0, p1, p2, p3 are control points
// t is [0, 1] between p1 and p2
export function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  const x = p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3;
  const y = p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3;

  return { x, y };
}

export function catmullRomDerivative(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;

  const f0 = -1.5 * t2 + 2.0 * t - 0.5;
  const f1 = 4.5 * t2 - 5.0 * t;
  const f2 = -4.5 * t2 + 4.0 * t + 0.5;
  const f3 = 1.5 * t2 - 1.0 * t;

  const x = p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3;
  const y = p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3;

  return { x, y };
}
