// Main effects system coordinator

import type { Vec2 } from '../math';
import type { CarState } from '../carPhysics';
import type { EffectsSettings, PhysicsTelemetry } from './types';
import { SkidmarkRenderer } from './skidmarks';
import { ParticleSystem } from './particles';
import { ShadowRenderer } from './shadow';
import { CameraEffects } from './camera';
import { EffectsDebugOverlay } from './debug';
import { createTelemetryFromCarState } from './telemetry';
import type { OffscreenSurface } from '../render/layers/OffscreenSurface';

/**
 * Main effects system that coordinates all visual feedback effects
 */
export class EffectsSystem {
  private skidmarks: SkidmarkRenderer;
  private particles: ParticleSystem;
  private shadow: ShadowRenderer;
  private cameraEffects: CameraEffects;
  private debugOverlay: EffectsDebugOverlay;

  constructor() {
    this.skidmarks = new SkidmarkRenderer();
    this.particles = new ParticleSystem();
    this.shadow = new ShadowRenderer();
    this.cameraEffects = new CameraEffects();
    this.debugOverlay = new EffectsDebugOverlay();
  }

  /**
   * Update all effects systems
   */
  update(carState: CarState, dt: number, settings: EffectsSettings): void {
    // Convert car state to telemetry
    const telemetry = createTelemetryFromCarState(carState);

    // Update skidmarks
    if (settings.skidmarks) {
      this.skidmarks.update(telemetry, dt);
    }

    // Update particles
    if (settings.particles) {
      this.particles.update(telemetry, dt);
    }

    // Update camera effects
    if (settings.cameraShake) {
      this.cameraEffects.update(telemetry, dt);
    }

    // Update debug overlay
    this.debugOverlay.update(
      telemetry,
      this.particles.getActiveCount(),
      this.skidmarks.getSegmentCount() > 0
    );
  }

  /**
   * Render all effects
   */
  render(
    surface: OffscreenSurface,
    settings: EffectsSettings & { effectsDebug?: boolean },
    playerCar: CarState,
    camera: { pos: Vec2; pxPerMeter: number },
    layer: 'under' | 'over' | 'all' = 'all',
  ): void {
    surface.clear('transparent');
    const telemetry = createTelemetryFromCarState(playerCar);
    const renderUnder = layer === 'under' || layer === 'all';
    const renderOver = layer === 'over' || layer === 'all';

    // Render skidmarks (behind everything)
    if (renderUnder && settings.skidmarks) {
      this.skidmarks.render(surface.ctx, camera);
    }

    // Render shadows (before car)
    if (renderUnder && settings.shadows) {
      const carWidth = 2; // meters
      const carLength = 4; // meters
      this.shadow.renderAll(surface.ctx, playerCar.pos, playerCar.heading, carWidth, carLength, camera, telemetry);
    }

    // Car is rendered by main renderer here

    // Render particles (on top of car)
    if (renderOver && settings.particles) {
      this.particles.render(surface.ctx, camera);
    }

    if (renderOver && settings.effectsDebug) {
      this.debugOverlay.render(surface.ctx);
    }
  }

  /**
   * Get camera position with effects applied
   */
  getCameraPosition(targetPos: Vec2, dt: number, applyEffects: boolean): Vec2 {
    if (applyEffects) {
      return this.cameraEffects.applyEffects(targetPos, dt);
    }
    return targetPos;
  }

  /**
   * Get camera shake offset
   */
  getCameraShakeOffset(): Vec2 {
    return this.cameraEffects.getShakeOffset();
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.skidmarks.clear();
    this.particles.clear();
    this.cameraEffects.reset();
  }

  /**
   * Get performance stats
   */
  getStats() {
    return {
      skidmarkSegments: this.skidmarks.getSegmentCount(),
      activeParticles: this.particles.getActiveCount(),
      cameraShakeIntensity: this.cameraEffects.getShakeIntensity(),
    };
  }
}

// Export singleton instance
export const effectsSystem = new EffectsSystem();
