import type { Vec2 } from './math';
import type { CarState } from './carPhysics';
import type { CarVisualRenderState } from './carVisualSystem';
import type { TrackModel } from './track/TrackModel';
import type { GraphicsSettings } from './settings/graphicsTypes';
import { LayeredRenderer } from './render/layers/LayeredRenderer';
import type { PerfLayerStats } from './render/perf/PerfMonitor';
import type { EffectsSystem } from './effects';
import type { AiDebugState } from './ai/types';
import type { SurfaceLayerRenderer } from './trackCondition/Renderer/SurfaceLayerRenderer';
export interface Camera {
  pos: Vec2;
  pxPerMeter: number;
}

// Layered renderer reused across frames to keep caches warm
const layeredRenderer = new LayeredRenderer();

export function renderRace(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  camera: Camera,
  track: TrackModel,
  cars: CarState[],
  visuals: CarVisualRenderState,
  settings: GraphicsSettings,
  effects: EffectsSystem,
  aiOverlay: { enabled: boolean; states: AiDebugState[]; trackDebug: boolean },
  surfaceRenderer?: SurfaceLayerRenderer,
  perfStats?: PerfLayerStats,
): void {
  ctx.save();
  ctx.fillStyle = '#0c0f0c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const adjustedCamera = {
    pos: {
      x: camera.pos.x + visuals.jitterOffset.x,
      y: camera.pos.y + visuals.jitterOffset.y,
    },
    pxPerMeter: camera.pxPerMeter * settings.renderScale,
  };

  layeredRenderer.render(
    ctx,
    {
      track,
      camera: adjustedCamera,
      settings,
      cars,
      carVisuals: visuals,
      effects,
      aiOverlay,
      surfaceRenderer,
    },
    perfStats,
  );

  ctx.restore();
}
