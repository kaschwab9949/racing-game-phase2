import type { CarGeometry } from './types';
import type { CarRenderProfile } from '../../cars/specs/types';
import { fillMattePaint } from './mattePaint';
import { fillCarbon } from './carbon';
import { fillMetallic, drawWheelSpokes } from './metallic';
import { drawDecals } from './decals';

export type DrawOptions = {
  geometry: CarGeometry;
  profile: CarRenderProfile;
  steer: number;
  ghostAlpha?: number;
  tint?: string | null;
  decalsEnabled?: boolean;
};

function bodyPath(ctx: CanvasRenderingContext2D, geometry: CarGeometry): void {
  const { body } = geometry;
  const halfW = body.width * 0.5;
  const halfL = body.length * 0.5;
  const bulge = body.fenderBulge;

  ctx.moveTo(halfL, -halfW * 0.65);
  ctx.quadraticCurveTo(halfL, -halfW, halfL - body.frontOverhang * 0.35, -halfW - bulge);
  ctx.lineTo(body.axleFrontX + body.hoodLength * 0.1, -halfW - bulge);
  ctx.quadraticCurveTo(body.axleFrontX, -halfW - bulge, body.axleFrontX, -halfW);

  ctx.lineTo(body.axleRearX, -halfW);
  ctx.quadraticCurveTo(body.axleRearX, -halfW - bulge, body.axleRearX - body.trunkLength * 0.1, -halfW - bulge);
  ctx.lineTo(-halfL + body.rearOverhang * 0.35, -halfW - bulge);
  ctx.quadraticCurveTo(-halfL, -halfW, -halfL, -halfW * 0.65);

  ctx.lineTo(-halfL, halfW * 0.65);
  ctx.quadraticCurveTo(-halfL, halfW, -halfL + body.rearOverhang * 0.35, halfW + bulge);
  ctx.lineTo(body.axleRearX - body.trunkLength * 0.1, halfW + bulge);
  ctx.quadraticCurveTo(body.axleRearX, halfW + bulge, body.axleRearX, halfW);

  ctx.lineTo(body.axleFrontX, halfW);
  ctx.quadraticCurveTo(body.axleFrontX, halfW + bulge, body.axleFrontX + body.hoodLength * 0.1, halfW + bulge);
  ctx.lineTo(halfL - body.frontOverhang * 0.35, halfW + bulge);
  ctx.quadraticCurveTo(halfL, halfW, halfL, halfW * 0.65);
  ctx.closePath();
}

function roofPath(ctx: CanvasRenderingContext2D, geometry: CarGeometry): void {
  const { body } = geometry;
  const roofW = body.roofWidth;
  const roofL = body.cabinLength * 0.85;
  const roofX = body.axleRearX + body.cabinLength * 0.2;

  ctx.roundRect(
    roofX,
    -roofW * 0.5,
    roofL,
    roofW,
    roofW * 0.25
  );
}

function windowPath(ctx: CanvasRenderingContext2D, geometry: CarGeometry): void {
  const { body } = geometry;
  const windowW = body.roofWidth * 0.92;
  const windowL = body.cabinLength * 0.78;
  const windowX = body.axleRearX + body.cabinLength * 0.22;

  ctx.roundRect(windowX, -windowW * 0.5, windowL, windowW, windowW * 0.22);
}

function drawWheels(
  ctx: CanvasRenderingContext2D,
  geometry: CarGeometry,
  profile: CarRenderProfile,
  steer: number,
): void {
  for (const wheel of geometry.wheels) {
    ctx.save();
    ctx.translate(wheel.center.x, wheel.center.y);
    if (wheel.steer) ctx.rotate(steer * 0.5);

    ctx.fillStyle = profile.theme.bodyColor; // Actually tire color, but not in spec
    ctx.beginPath();
    ctx.ellipse(0, 0, wheel.radius, wheel.width * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    fillMetallic(ctx, wheel.radius * 0.72, {
      base: profile.theme.wheelColor,
      highlight: '#fafafa', // Not in spec
    });

    drawWheelSpokes(ctx, wheel.radius * 0.7, 6, profile.theme.trimColor);

    ctx.fillStyle = profile.theme.trimColor;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawLights(
  ctx: CanvasRenderingContext2D,
  geometry: CarGeometry,
  profile: CarRenderProfile,
): void {
  const { body } = geometry;
  const halfW = body.width * 0.5;
  const halfL = body.length * 0.5;

  // Headlights
  ctx.fillStyle = '#ffffff'; // Not in spec
  ctx.beginPath();
  ctx.ellipse(halfL - 0.2, -halfW * 0.6, 0.3, 0.15, -0.2, 0, Math.PI * 2);
  ctx.ellipse(halfL - 0.2, halfW * 0.6, 0.3, 0.15, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#ff4444'; // Not in spec
  ctx.beginPath();
  ctx.ellipse(-halfL + 0.2, -halfW * 0.7, 0.4, 0.2, -0.1, 0, Math.PI * 2);
  ctx.ellipse(-halfL + 0.2, halfW * 0.7, 0.4, 0.2, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCar(ctx: CanvasRenderingContext2D, options: DrawOptions): void {
  const {
    geometry,
    profile,
    steer,
    ghostAlpha,
    tint,
    decalsEnabled,
  } = options;
  const { body } = geometry;

  ctx.save();

  if (ghostAlpha !== undefined) {
    ctx.globalAlpha = ghostAlpha;
  }

  // Body
  ctx.beginPath();
  bodyPath(ctx, geometry);

  // For now, let's just use a simple fill
  ctx.fillStyle = profile.theme.bodyColor;
  ctx.fill();


  if (tint) {
    ctx.fillStyle = tint;
    ctx.globalCompositeOperation = 'color';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Roof - for now, same as body
  ctx.fillStyle = profile.theme.bodyColor;
  ctx.beginPath();
  roofPath(ctx, geometry);
  ctx.fill();


  // Windows
  ctx.beginPath();
  windowPath(ctx, geometry);
  ctx.fillStyle = profile.theme.glassColor;
  ctx.fill();

  // Decals
  if (decalsEnabled && profile.decals) {
    // drawDecals(ctx, profile.decals); // TODO: Re-implement decals
  }

  // Wheels
  drawWheels(ctx, geometry, profile, steer);

  // Lights
  drawLights(ctx, geometry, profile);

  // Trim
  ctx.strokeStyle = profile.theme.trimColor;
  ctx.lineWidth = 0.05;
  ctx.beginPath();
  bodyPath(ctx, geometry);
  ctx.stroke();

  ctx.restore();
}
