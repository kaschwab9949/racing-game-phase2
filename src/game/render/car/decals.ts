import type { CarDecal } from '../../cars/types';

export type DecalImage = {
  path: string;
  image: HTMLImageElement;
  ready: boolean;
  failed: boolean;
};

const decalCache = new Map<string, DecalImage>();

export function getDecalImage(path: string): DecalImage {
  const cached = decalCache.get(path);
  if (cached) return cached;

  const image = new Image();
  const decal: DecalImage = { path, image, ready: false, failed: false };
  image.onload = () => {
    decal.ready = true;
  };
  image.onerror = () => {
    decal.failed = true;
  };
  image.src = path;
  decalCache.set(path, decal);
  return decal;
}

export function drawDecals(ctx: CanvasRenderingContext2D, decals: CarDecal[], area: { x: number; y: number; w: number; h: number }): void {
  for (const decal of decals) {
    const image = getDecalImage(decal.path);
    if (!image.ready || image.failed) continue;

    ctx.save();
    ctx.globalAlpha = decal.opacity;
    ctx.translate(area.x + area.w * 0.5 + decal.offsetX, area.y + area.h * 0.5 + decal.offsetY);
    ctx.rotate(decal.rotation);

    const scale = decal.scale;
    const w = image.image.width * scale;
    const h = image.image.height * scale;
    ctx.drawImage(image.image, -w * 0.5, -h * 0.5, w, h);
    ctx.restore();
  }
}
