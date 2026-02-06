import type { CarSpec } from '../../cars/specs/types';
import type { RacingLineSample, SpeedProfile, SpeedProfilePoint } from '../types';
import { clamp } from '../../math';

export type SpeedProfileSolverOptions = {
  gripFactor?: number;
  dragFactor?: number;
  brakingEfficiency?: number;
};

export class SpeedProfileSolver {
  constructor(private spec: CarSpec, private line: RacingLineSample[], private opts: SpeedProfileSolverOptions = {}) {}

  solve(): SpeedProfile {
    const points: SpeedProfilePoint[] = [];
    const maxLatGrip = (this.opts.gripFactor ?? 1) * this.spec.tireGrip * 9.81;
    const drag = (this.opts.dragFactor ?? 1) * this.spec.dragCoefficient;

    for (let i = 0; i < this.line.length; i++) {
      const sample = this.line[i];
      const curvature = Math.abs(sample.curvature);
      const radius = curvature > 0.0001 ? 1 / curvature : 1e6;
      const vmax = Math.sqrt(maxLatGrip * radius);
      points.push({ s: sample.s, maxSpeed: vmax, desiredAccel: 0 });
    }

    // Backward pass for braking limits
    const braking = (this.opts.brakingEfficiency ?? 1) * this.spec.brakePower;
    for (let i = points.length - 2; i >= 0; i--) {
      const current = points[i];
      const next = points[i + 1];
      const ds = Math.max(0.01, next.s - current.s);
      const maxEntrySpeed = Math.sqrt(Math.max(0, next.maxSpeed * next.maxSpeed + 2 * braking * ds));
      current.maxSpeed = Math.min(current.maxSpeed, maxEntrySpeed);
      current.desiredAccel = (next.maxSpeed - current.maxSpeed) / Math.max(0.01, ds);
    }

    // Forward pass for acceleration capability
    const accel = this.spec.peakTorque / this.spec.massKg;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const ds = Math.max(0.01, current.s - prev.s);
      const maxExitSpeed = Math.sqrt(Math.max(0, prev.maxSpeed * prev.maxSpeed + 2 * accel * ds));
      current.maxSpeed = Math.min(current.maxSpeed + drag * ds, maxExitSpeed);
    }

    return { specId: this.spec.id, samples: points, trackLength: this.line[this.line.length - 1]?.s ?? 0 };
  }
}
