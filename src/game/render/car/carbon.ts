type CarbonOptions = {
  base: string;
  highlight: string;
  size: number;
};

const carbonCache = new Map<string, CanvasPattern>();

export function getCarbonPattern(ctx: CanvasRenderingContext2D, options: CarbonOptions): CanvasPattern {
  const key = `${options.base}-${options.highlight}-${options.size}`;
  const cached = carbonCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = options.size;
  canvas.height = options.size;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('No canvas context');

  c.fillStyle = options.base;
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.strokeStyle = options.highlight;
  c.lineWidth = Math.max(1, options.size * 0.08);
  const step = options.size / 2;

  c.beginPath();
  c.moveTo(-step, step);
  c.lineTo(step, -step);
  c.moveTo(0, options.size + step);
  c.lineTo(options.size + step, 0);
  c.stroke();

  c.globalAlpha = 0.6;
  c.beginPath();
  c.moveTo(0, step);
  c.lineTo(step, 0);
  c.moveTo(step, options.size + step);
  c.lineTo(options.size + step, step);
  c.stroke();

  const pattern = ctx.createPattern(canvas, 'repeat');
  if (!pattern) throw new Error('Failed to create carbon pattern');
  carbonCache.set(key, pattern);
  return pattern;
}

export function fillCarbon(ctx: CanvasRenderingContext2D, path: () => void, base: string, highlight: string): void {
  ctx.save();
  ctx.fillStyle = getCarbonPattern(ctx, { base, highlight, size: 20 });
  ctx.beginPath();
  path();
  ctx.fill();
  ctx.restore();
}
