import type { Vec2 } from '../../math';
import type { CarState } from '../../carPhysics';
import type { GraphicsSettings } from '../../settings/graphicsTypes';
import type { OffscreenSurface } from './OffscreenSurface';
import { SkidmarkRenderer } from '../../effects/skidmarks';
import { ParticleSystem } from '../../effects/particles';
import { ShadowRenderer } from '../../effects/shadow';
import { EffectsDebugOverlay } from '../../effects/debug';
import { createTelemetryFromCarState } from '../../effects/telemetry';
import type { EffectsSettings } from '../../effects/types';

export class DynamicEffectsLayer {
  private skidmarks: SkidmarkRenderer;
  private particles: ParticleSystem;
  private shadow: ShadowRenderer;
  private debug: EffectsDebugOverlay;

  constructor() {
    this.skidmarks = new SkidmarkRenderer();
    this.particles = new ParticleSystem();
    this.shadow = new ShadowRenderer();
    this.debug = new EffectsDebugOverlay();
  }

  update(dt: number, carState: CarState, settings: EffectsSettings): void {
    const telemetry = createTelemetryFromCarState(carState);

    // Update effects systems
    if (settings.skidmarks) {
      this.skidmarks.update(telemetry, dt);
    }

    if (settings.particles) {
      this.particles.update(telemetry, dt);
    }

    // Update debug overlay
    this.debug.update(
      telemetry,
      this.particles.getActiveCount(),
      this.skidmarks.getSegmentCount() > 0
    );
  }

  render(
    surface: OffscreenSurface, 
    settings: GraphicsSettings,
    carState: CarState,
    camera: { pos: Vec2; pxPerMeter: number }
  ): void {
    surface.clear('transparent');
    const ctx = surface.ctx;

    ctx.save();

    // Apply camera transform to match world coordinates
    ctx.translate(surface.canvas.width / 2, surface.canvas.height / 2);
    ctx.scale(camera.pxPerMeter, camera.pxPerMeter);
    ctx.translate(-camera.pos.x, -camera.pos.y);

    // Render skidmarks (lowest layer)
    if (settings.skidmarks) {
      this.skidmarks.render(ctx, camera);
    }

    // Render shadows (before car)
    if (settings.shadows) {
      const telemetry = createTelemetryFromCarState(carState);
      const carWidth = 2;
      const carLength = 4;
      this.shadow.renderAll(ctx, carState.pos, carState.heading, carWidth, carLength, camera, telemetry);
    }

    ctx.restore();

    // Render particles (after car, in screen space)
    if (settings.particles) {
      this.particles.render(ctx, camera);
    }

    // Render debug overlay (screen space)
    if (settings.effectsDebug) {
      this.debug.render(ctx);
    }
  }

  clear(): void {
    this.skidmarks.clear();
    this.particles.clear();
  }
}
