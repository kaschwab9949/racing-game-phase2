import type { CarGeometry } from './types';

export type GuideOptions = {
  alpha: number;
};

export function drawCarGuides(ctx: CanvasRenderingContext2D, geometry: CarGeometry, options: GuideOptions): void {
  const { body, wheels, bounds } = geometry;

  ctx.save();
  ctx.globalAlpha = options.alpha;
  ctx.lineWidth = 0.04;
  ctx.strokeStyle = '#59c1ff';
  ctx.setLineDash([0.15, 0.1]);

  // Centerline
  ctx.beginPath();
  ctx.moveTo(bounds.minX, 0);
  ctx.lineTo(bounds.maxX, 0);
  ctx.stroke();

  // Axle lines
  ctx.strokeStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(body.axleFrontX, bounds.minY);
  ctx.lineTo(body.axleFrontX, bounds.maxY);
  ctx.moveTo(body.axleRearX, bounds.minY);
  ctx.lineTo(body.axleRearX, bounds.maxY);
  ctx.stroke();

  // Track width markers
  ctx.strokeStyle = '#9bff95';
  for (const axleX of [body.axleFrontX, body.axleRearX]) {
    ctx.beginPath();
    ctx.moveTo(axleX, -body.width * 0.55);
    ctx.lineTo(axleX, body.width * 0.55);
    ctx.stroke();
  }

  // Overhang markers
  ctx.strokeStyle = '#ff7c7c';
  ctx.beginPath();
  ctx.moveTo(bounds.maxX, -body.width * 0.4);
  ctx.lineTo(bounds.maxX, body.width * 0.4);
  ctx.moveTo(bounds.minX, -body.width * 0.4);
  ctx.lineTo(bounds.minX, body.width * 0.4);
  ctx.stroke();

  ctx.setLineDash([]);

  // Wheel bounding boxes
  ctx.strokeStyle = '#b38bff';
  for (const wheel of wheels) {
    ctx.beginPath();
    ctx.rect(
      wheel.center.x - wheel.radius,
      wheel.center.y - wheel.width * 0.6,
      wheel.radius * 2,
      wheel.width * 1.2
    );
    ctx.stroke();
  }

  ctx.restore();
}
