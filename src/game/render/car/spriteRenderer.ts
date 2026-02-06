import type { Vec2 } from '../../math';
import type { CarSpec, CarRenderProfile } from '../../cars/specs/types';
import { resolveCarDimensions } from '../../cars/profileMath';
import { getSpriteAsset } from './spriteCache';

export type SpriteRenderParams = {
  ctx: CanvasRenderingContext2D;
  position: Vec2;
  heading: number;
  spec: CarSpec;
  profile: CarRenderProfile;
  pxPerMeter: number;
  ghostAlpha?: number;
  tint?: string | null;
};

const SPRITE_HEADING_OFFSET = Math.PI / 2; // Sprite front points up; heading zero points +X

export function renderSpriteCar(params: SpriteRenderParams): boolean {
  const { ctx, position, heading, spec, profile, pxPerMeter, ghostAlpha, tint } = params;
  if (!spec.spritePath) return false;

  const asset = getSpriteAsset(spec.spritePath, {
    maskThreshold: spec.spriteMaskThreshold,
    trimPadding: spec.spriteTrimPadding,
  });
  if (!asset.ready || asset.failed || !asset.canvas) return false;

  const dims = resolveCarDimensions(spec, profile);
  const sprite = asset.canvas;
  const scale = spec.spriteScale ?? 1;
  const desiredHeightPx = dims.lengthM * pxPerMeter * scale;
  const desiredWidthPx = desiredHeightPx * (sprite.width / sprite.height);
  const offset = spec.spriteOffset ?? { x: 0, y: 0 };
  const offsetPxX = offset.x * pxPerMeter;
  const offsetPxY = offset.y * pxPerMeter;
  const trim = asset.trim;
  const originalWidth = asset.originalWidth || sprite.width;
  const originalHeight = asset.originalHeight || sprite.height;
  const trimCenterX = trim ? trim.x + trim.width / 2 : originalWidth / 2;
  const trimCenterY = trim ? trim.y + trim.height / 2 : originalHeight / 2;
  const centerOffsetX = ((trimCenterX - originalWidth / 2) / originalWidth) * desiredWidthPx;
  const centerOffsetY = ((trimCenterY - originalHeight / 2) / originalHeight) * desiredHeightPx;

  ctx.save();
  if (ghostAlpha !== undefined) ctx.globalAlpha = ghostAlpha;
  ctx.translate(position.x, position.y);
  ctx.rotate(heading + SPRITE_HEADING_OFFSET);

  const drawX = -desiredWidthPx * 0.5 - centerOffsetX + offsetPxX;
  const drawY = -desiredHeightPx * 0.5 - centerOffsetY + offsetPxY;
  ctx.drawImage(sprite, drawX, drawY, desiredWidthPx, desiredHeightPx);

  if (tint && asset.transparentRatio > 0.05) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = tint;
    ctx.fillRect(drawX, drawY, desiredWidthPx, desiredHeightPx);
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
  return true;
}
