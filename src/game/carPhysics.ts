import type { Vec2 } from './math';
import { add, scale, dot, len, normalize, perp, clamp } from './math';
import { GameClock } from '../devtools/determinism/GameClock';
import { randRange } from '../devtools/determinism/Random';
import type { CarSpec } from './cars/specs/types';

// A simplified physics state, not a full-blown simulation
interface CarPhysics {
  rpm: number;
  gear: number;
  // ... more can be added
}

export interface CarState {
  spec: CarSpec;
  pos: Vec2;
  vel: Vec2;
  heading: number;
  throttle: number;
  brake: number;
  steer: number;
  physics: CarPhysics;
  isPlayer: boolean;
  isAi: boolean;
  isGhost?: boolean;
  abs: boolean;
  tcs: boolean;
}

export interface CarInput {
  throttle: number;
  brake: number;
  steer: number;
  abs: boolean;
  tcs: boolean;
}

export function createCarState(spec: CarSpec, pos: Vec2, heading: number): CarState {
  return {
    spec,
    pos: { ...pos },
    vel: { x: 0, y: 0 },
    heading,
    throttle: 0,
    brake: 0,
    steer: 0,
    physics: {
      rpm: 800,
      gear: 1,
    },
    isPlayer: false,
    isAi: false,
    abs: true,
    tcs: true,
  };
}

function getPowerFactor(spec: CarSpec, rpm: number): number {
  const curve = spec.powerCurve;
  if (rpm <= curve[0][0]) {
    return curve[0][1] / curve[curve.length - 1][1];
  }
  if (rpm >= curve[curve.length - 1][0]) {
    return curve[curve.length - 1][1] / curve[curve.length - 1][1];
  }

  for (let i = 0; i < curve.length - 1; i++) {
    if (rpm >= curve[i][0] && rpm <= curve[i + 1][0]) {
      const t = (rpm - curve[i][0]) / (curve[i + 1][0] - curve[i][0]);
      const power = curve[i][1] + t * (curve[i + 1][1] - curve[i][1]);
      const maxPower = spec.powerCurve.reduce((max, p) => Math.max(max, p[1]), 0);
      return power / maxPower;
    }
  }
  return 0;
}

export function stepCar(state: CarState, input: CarInput, dt: number, gripMultiplier: number = 1.0): void {
  // Smooth inputs
  state.throttle += (input.throttle - state.throttle) * 8 * dt;
  state.brake += (input.brake - state.brake) * 10 * dt;
  state.steer += (input.steer - state.steer) * 6 * dt;

  const fwd = { x: Math.cos(state.heading), y: Math.sin(state.heading) };
  const right = perp(fwd);

  let vF = dot(state.vel, fwd);
  let vR = dot(state.vel, right);

  // Update assists state from input
  state.abs = input.abs;
  state.tcs = input.tcs;

  // RPM based on speed (very simplified)
  state.physics.rpm = 800 + Math.abs(vF) * 100;
  state.physics.rpm = clamp(state.physics.rpm, 800, state.spec.maxRpm);

  // Acceleration
  const powerFactor = getPowerFactor(state.spec, state.physics.rpm);
  let engineAccel = (state.spec.peakTorque / state.spec.massKg) * powerFactor * gripMultiplier;

  // TCS
  if (state.tcs && state.throttle > 0.5 && Math.abs(vF) < 10) {
    const slipRatio = (state.physics.rpm / 100 - Math.abs(vF)) / (Math.abs(vF) + 1);
    if (slipRatio > 0.3) {
      engineAccel *= 1 - clamp((slipRatio - 0.3) * 3, 0, 1);
    }
  }

  vF += state.throttle * engineAccel * dt;

  // Braking
  let brakeForce = state.brake * state.spec.brakePower * gripMultiplier;
  if (state.abs && state.brake > 0.8) {
    // Simple pulsing ABS
    const pulse = Math.sin(GameClock.nowMs() / 20) > 0 ? 1 : 0.7;
    brakeForce *= pulse;
  }

  if (Math.abs(vF) > 0.1) {
    vF -= Math.sign(vF) * brakeForce * dt;
  } else if (state.brake > 0.5) {
    vF = 0;
  }

  // Drag
  const dragForce = 0.5 * 1.225 * state.spec.dragCoefficient * state.spec.frontalArea * vF * vF;
  const dragAccel = dragForce / state.spec.massKg;
  vF -= dragAccel * Math.sign(vF) * dt;

  // Lateral grip
  const lateralGrip = state.spec.tireGrip * 9.8 * gripMultiplier;
  vR -= vR * lateralGrip * dt;

  // Steering (only when moving)
  const speedFactor = Math.min(1, Math.abs(vF) / 10);
  const steerRate = 3.5; // This can also be moved to spec
  state.heading += state.steer * steerRate * speedFactor * dt;

  // Update velocity
  state.vel = add(scale(fwd, vF), scale(right, vR));

  // Update position
  state.pos = add(state.pos, scale(state.vel, dt));
}

// Simple collision detection between two cars
export function checkCarCollision(
  a: CarState,
  b: CarState
): boolean {
  const radiusA = a.spec.lengthMm / 2000;
  const radiusB = b.spec.lengthMm / 2000;
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < radiusA + radiusB;
}

// Resolve collision with impulse-based physics
export function resolveCarCollision(
  a: CarState,
  b: CarState
): void {
  const massA = a.spec.massKg;
  const massB = b.spec.massKg;
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 0.01) return;

  const nx = dx / dist;
  const ny = dy / dist;

  // Relative velocity
  const dvx = a.vel.x - b.vel.x;
  const dvy = a.vel.y - b.vel.y;
  const dvn = dvx * nx + dvy * ny;

  // Don't resolve if moving apart
  if (dvn < 0) return;

  // Restitution (bounciness)
  const e = 0.5;
  const j = -(1 + e) * dvn / (1 / massA + 1 / massB);

  // Apply impulse
  a.vel.x -= (j / massA) * nx;
  a.vel.y -= (j / massA) * ny;
  b.vel.x += (j / massB) * nx;
  b.vel.y += (j / massB) * ny;

  // Separate cars
  const radiusA = a.spec.lengthMm / 2000;
  const radiusB = b.spec.lengthMm / 2000;
  const overlap = (radiusA + radiusB) - dist;
  if (overlap > 0) {
    const sep = overlap / 2 + 0.1;
    a.pos.x -= nx * sep;
    a.pos.y -= ny * sep;
    b.pos.x += nx * sep;
    b.pos.y += ny * sep;
  }

  // Add spin on impact
  a.heading += randRange(-0.05, 0.05);
  b.heading += randRange(-0.05, 0.05);
}
