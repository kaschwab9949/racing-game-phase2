import type { Vec2 } from '../../math';
import type { GraphicsSettings } from '../../settings/graphicsTypes';

export type CameraTransform = {
  translateX: number;
  translateY: number;
  scale: number;
};

export function buildCameraTransform(cameraPos: Vec2, pxPerMeter: number, canvas: HTMLCanvasElement, settings: GraphicsSettings): CameraTransform {
  const cx = canvas.width * 0.5;
  const cy = canvas.height * 0.5;
  let tx = cx - cameraPos.x * pxPerMeter;
  let ty = cy - cameraPos.y * pxPerMeter;
  if (settings.antialias === 'pixel') {
    tx = Math.round(tx);
    ty = Math.round(ty);
  }
  return { translateX: tx, translateY: ty, scale: pxPerMeter };
}
