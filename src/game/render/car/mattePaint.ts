import { getNoisePattern } from './noise';

export type MattePaintOptions = {
  base: string;
  shadow: string;
  highlight: string;
};

export function fillMattePaint(ctx: CanvasRenderingContext2D, path: () => void, options: MattePaintOptions): void {
  const { base, shadow, highlight } = options;
  const gradient = ctx.createLinearGradient(-2, -1, 2, 1);
  gradient.addColorStop(0, shadow);
  gradient.addColorStop(0.4, base);
  gradient.addColorStop(0.6, base);
  gradient.addColorStop(1, highlight);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  path();
  ctx.fill();

  const noise = getNoisePattern(ctx, {
    size: 32,
    intensity: 0.25,
    seed: 8123,
    alpha: 0.12,
  });
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = noise;
  ctx.beginPath();
  path();
  ctx.fill();

  ctx.restore();
}
