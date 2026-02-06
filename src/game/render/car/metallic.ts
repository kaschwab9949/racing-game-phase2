export type MetallicOptions = {
  base: string;
  highlight: string;
};

export function fillMetallic(ctx: CanvasRenderingContext2D, radius: number, options: MetallicOptions): void {
  const grad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, radius * 0.2, 0, 0, radius);
  grad.addColorStop(0, options.highlight);
  grad.addColorStop(0.4, options.base);
  grad.addColorStop(0.7, options.base);
  grad.addColorStop(1, '#5f4a18');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWheelSpokes(ctx: CanvasRenderingContext2D, radius: number, count: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.02, radius * 0.08);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.2, Math.sin(angle) * radius * 0.2);
    ctx.lineTo(Math.cos(angle) * radius * 0.95, Math.sin(angle) * radius * 0.95);
    ctx.stroke();
  }
  ctx.restore();
}
