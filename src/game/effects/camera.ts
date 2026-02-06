// Camera shake and smoothing effects

import type { Vec2 } from '../math';
import type { CameraShake, PhysicsTelemetry } from './types';
import { CAMERA_SHAKE_CONSTANTS } from './constants';

/**
 * Camera effects system for shake and smoothing
 */
export class CameraEffects {
  private shake: CameraShake = {
    intensity: 0,
    frequency: CAMERA_SHAKE_CONSTANTS.FREQUENCY,
    decay: CAMERA_SHAKE_CONSTANTS.DECAY_RATE,
    offset: { x: 0, y: 0 },
  };

  private smoothedPos: Vec2 = { x: 0, y: 0 };
  private time: number = 0;

  /**
   * Update camera shake based on speed
   */
  update(telemetry: PhysicsTelemetry, dt: number): void {
    this.time += dt;

    // Calculate target shake intensity based on speed
    let targetIntensity = 0;
    if (telemetry.speed > CAMERA_SHAKE_CONSTANTS.SPEED_THRESHOLD) {
      const speedFactor = (telemetry.speed - CAMERA_SHAKE_CONSTANTS.SPEED_THRESHOLD) / 
                         (80 - CAMERA_SHAKE_CONSTANTS.SPEED_THRESHOLD); // Normalize to max speed
      targetIntensity = CAMERA_SHAKE_CONSTANTS.MAX_INTENSITY * Math.min(1, speedFactor);
    }

    // Smoothly interpolate shake intensity
    if (targetIntensity > this.shake.intensity) {
      this.shake.intensity += (targetIntensity - this.shake.intensity) * 0.1;
    } else {
      this.shake.intensity -= this.shake.decay * dt;
      this.shake.intensity = Math.max(0, this.shake.intensity);
    }

    // Generate shake offset using sine waves
    if (this.shake.intensity > 0.001) {
      const freq = this.shake.frequency;
      // Use multiple frequencies for more organic shake
      const shake1 = Math.sin(this.time * freq * Math.PI * 2) * this.shake.intensity;
      const shake2 = Math.sin(this.time * freq * 1.5 * Math.PI * 2) * this.shake.intensity * 0.5;
      const shake3 = Math.cos(this.time * freq * 0.8 * Math.PI * 2) * this.shake.intensity;
      const shake4 = Math.cos(this.time * freq * 1.2 * Math.PI * 2) * this.shake.intensity * 0.5;

      this.shake.offset.x = shake1 + shake2;
      this.shake.offset.y = shake3 + shake4;
    } else {
      this.shake.offset.x = 0;
      this.shake.offset.y = 0;
    }
  }

  /**
   * Apply camera smoothing to a position
   */
  applySmoothingToPosition(targetPos: Vec2, dt: number): Vec2 {
    // Initialize smoothed position if needed
    if (this.smoothedPos.x === 0 && this.smoothedPos.y === 0) {
      this.smoothedPos = { ...targetPos };
    }

    // Smooth interpolation
    const smoothing = CAMERA_SHAKE_CONSTANTS.SMOOTHING;
    this.smoothedPos.x += (targetPos.x - this.smoothedPos.x) * (1 - smoothing);
    this.smoothedPos.y += (targetPos.y - this.smoothedPos.y) * (1 - smoothing);

    return { ...this.smoothedPos };
  }

  /**
   * Get current shake offset
   */
  getShakeOffset(): Vec2 {
    return { ...this.shake.offset };
  }

  /**
   * Get current shake intensity
   */
  getShakeIntensity(): number {
    return this.shake.intensity;
  }

  /**
   * Apply both smoothing and shake to camera position
   */
  applyEffects(targetPos: Vec2, dt: number): Vec2 {
    const smoothed = this.applySmoothingToPosition(targetPos, dt);
    
    return {
      x: smoothed.x + this.shake.offset.x,
      y: smoothed.y + this.shake.offset.y,
    };
  }

  /**
   * Reset camera effects
   */
  reset(): void {
    this.shake.intensity = 0;
    this.shake.offset = { x: 0, y: 0 };
    this.smoothedPos = { x: 0, y: 0 };
    this.time = 0;
  }
}
