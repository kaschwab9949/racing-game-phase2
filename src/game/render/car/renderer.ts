import type { CarRenderParams } from './types';
import { buildCarGeometry } from './geometry';
import { drawCar } from './drawCar';
import { drawCarGuides } from './guides';
import { renderSpriteCar } from './spriteRenderer';

export function renderCar(params: CarRenderParams): void {
  const {
    ctx,
    position,
    heading,
    steer,
    profile,
    spec,
    pxPerMeter,
    showGuides,
    ghostAlpha,
    tint,
    decalsEnabled,
    shadowsEnabled = true,
    antialias = 'smooth',
  } = params;

  const spriteRendered = renderSpriteCar({
    ctx,
    position,
    heading,
    spec,
    profile,
    pxPerMeter,
    ghostAlpha,
    tint,
  });

  if (spriteRendered) {
    if (showGuides) {
      const geometry = buildCarGeometry(spec, profile);
      ctx.save();
      ctx.translate(position.x, position.y);
      ctx.rotate(heading);
      drawCarGuides(ctx, geometry, { alpha: 0.8 });
      ctx.restore();
    }
    return;
  }

  const geometry = buildCarGeometry(spec, profile);

  const snap = (value: number) => Math.round(value * pxPerMeter) / pxPerMeter;
  const posX = snap(position.x);
  const posY = snap(position.y);

  ctx.save();
  ctx.imageSmoothingEnabled = antialias === 'smooth';
  ctx.translate(posX, posY);
  ctx.rotate(heading);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.imageSmoothingEnabled = true;

  // Shadow
  if (shadowsEnabled) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0.1, 0.12, geometry.body.length * 0.52, geometry.body.width * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCar(ctx, {
    geometry,
    profile,
    steer,
    ghostAlpha,
    tint,
    decalsEnabled,
  });

  if (showGuides) {
    drawCarGuides(ctx, geometry, { alpha: 0.8 });
  }

  ctx.restore();
}
