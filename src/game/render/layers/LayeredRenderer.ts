import type { CarState } from '../../carPhysics';
import type { CarVisualRenderState } from '../../carVisualSystem';
import type { Vec2 } from '../../math';
import type { TrackModel } from '../../track/TrackModel';
import type { GraphicsSettings } from '../../settings/graphicsTypes';
import { OffscreenSurface } from './OffscreenSurface';
import { drawDynamicCars, type CarRenderInput } from './DynamicCarLayer';
import { drawDebugOverlay } from './DebugOverlayLayer';
import type { PerfLayerStats } from '../perf/PerfMonitor';
import type { EffectsSystem } from '../../effects';
import type { AiDebugState } from '../../ai/types';
import { ScreenEnvironmentLayer } from './ScreenEnvironmentLayer';
import { TrackPathCache } from './TrackPathCache';
import type { SurfaceLayerRenderer } from '../../trackCondition/Renderer/SurfaceLayerRenderer';

export type LayeredRenderInputs = {
  track: TrackModel;
  camera: { pos: Vec2; pxPerMeter: number };
  settings: GraphicsSettings;
  cars: CarState[];
  carVisuals: CarVisualRenderState;
  effects: EffectsSystem;
  aiOverlay: { enabled: boolean; states: AiDebugState[]; trackDebug: boolean };
  surfaceRenderer?: SurfaceLayerRenderer;
};

export class LayeredRenderer {
  private environment = new ScreenEnvironmentLayer();
  private trackPaths = new TrackPathCache();

  private effectsUnderSurface = new OffscreenSurface(1, 1, 1, 'dynamic');
  private effectsOverSurface = new OffscreenSurface(1, 1, 1, 'dynamic');

  render(ctx: CanvasRenderingContext2D, inputs: LayeredRenderInputs, perf?: PerfLayerStats): void {
    const { camera, settings, track } = inputs;

    // Screen-space background (cached, redraw only on resize)
    const envStats = this.environment.render(ctx);
    if (perf) perf.environment = envStats;

    const playerCar = inputs.cars.find((c) => c.isPlayer);

    // Screen-space effects
    this.effectsUnderSurface.resize(ctx.canvas.width, ctx.canvas.height);
    this.effectsOverSurface.resize(ctx.canvas.width, ctx.canvas.height);
    if (playerCar) {
      inputs.effects.render(this.effectsUnderSurface, settings, playerCar, camera, 'under');
      inputs.effects.render(this.effectsOverSurface, settings, playerCar, camera, 'over');
    } else {
      this.effectsUnderSurface.clear('transparent');
      this.effectsOverSurface.clear('transparent');
    }
    if (perf) perf.effects = { hits: 0, misses: 1 };

    // World-space layers: track + track condition
    ctx.save();
    applyCameraTransform(ctx, camera, settings);
    const trackStats = this.trackPaths.render(ctx, track);
    if (perf) perf.track = trackStats;
    if (inputs.surfaceRenderer) {
      inputs.surfaceRenderer.render(ctx, camera);
    }
    ctx.restore();

    // Effects under cars (screen space)
    ctx.drawImage(this.effectsUnderSurface.canvas, 0, 0);

    // World-space layers: cars + debug
    ctx.save();
    applyCameraTransform(ctx, camera, settings);

    const carInput: CarRenderInput = {
      cars: inputs.cars,
      playerVisuals: inputs.carVisuals,
    };
    drawDynamicCars(ctx, camera.pxPerMeter, carInput, settings);
    if (perf) perf.cars = { hits: 0, misses: 1 };

    if (playerCar) {
      drawDebugOverlay(
        ctx,
        {
          track,
          playerPos: playerCar.pos,
          trackDebugEnabled: inputs.aiOverlay.trackDebug,
          ai: { enabled: inputs.aiOverlay.enabled, states: inputs.aiOverlay.states },
        },
        settings,
      );
    }

    ctx.restore();

    // Effects over cars (screen space)
    ctx.drawImage(this.effectsOverSurface.canvas, 0, 0);
  }
}

function applyCameraTransform(
  ctx: CanvasRenderingContext2D,
  camera: { pos: Vec2; pxPerMeter: number },
  settings: GraphicsSettings,
): void {
  const { pos, pxPerMeter } = camera;

  if (settings.antialias === 'pixel') {
    ctx.imageSmoothingEnabled = false;
    // Half-pixel shift in screen space for crisp pixel snaps.
    ctx.translate(0.5, 0.5);
  } else {
    ctx.imageSmoothingEnabled = true;
  }

  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.scale(pxPerMeter, pxPerMeter);
  ctx.translate(-pos.x, -pos.y);
}
