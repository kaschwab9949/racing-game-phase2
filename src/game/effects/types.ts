// Type definitions for driving feedback effects system

import type { Vec2 } from '../math';

/**
 * Physics telemetry used to drive effects
 */
export interface PhysicsTelemetry {
  /** Front wheel slip ratio (0 = no slip, 1 = full slip) */
  frontSlipRatio: number;
  /** Rear wheel slip ratio */
  rearSlipRatio: number;
  /** Lateral slip angle in radians */
  slipAngle: number;
  /** Current speed in m/s */
  speed: number;
  /** Wheel angular velocity (rad/s) */
  wheelSpeed: number;
  /** Brake input [0-1] */
  brakeInput: number;
  /** Throttle input [0-1] */
  throttleInput: number;
  /** Car position */
  position: Vec2;
  /** Car heading in radians */
  heading: number;
}

/**
 * Particle in the particle system
 */
export interface Particle {
  id: number;
  active: boolean;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'dust' | 'smoke';
}

/**
 * Skidmark segment
 */
export interface SkidmarkSegment {
  pos: Vec2;
  heading: number;
  intensity: number;
  age: number;
}

/**
 * Skidmark trail
 */
export interface SkidmarkTrail {
  segments: SkidmarkSegment[];
  maxAge: number;
}

/**
 * Camera shake state
 */
export interface CameraShake {
  intensity: number;
  frequency: number;
  decay: number;
  offset: Vec2;
}

/**
 * Effects settings (subset of graphics settings)
 */
export interface EffectsSettings {
  shadows: boolean;
  skidmarks: boolean;
  particles: boolean;
  cameraShake: boolean;
}

/**
 * Debug info for slip visualization
 */
export interface SlipDebugInfo {
  frontSlip: number;
  rearSlip: number;
  slipAngle: number;
  particlesEmitted: number;
  skidmarksActive: boolean;
}
