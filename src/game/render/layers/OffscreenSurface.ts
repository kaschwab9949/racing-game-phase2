export type SurfaceKind = 'static' | 'dynamic';

export class OffscreenSurface {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public scale: number;
  public dirty = true;

  constructor(width: number, height: number, scale = 1, kind: SurfaceKind = 'static') {
    this.scale = scale;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.max(1, Math.floor(width * scale));
    this.canvas.height = Math.max(1, Math.floor(height * scale));
    const ctx = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D | null;
    if (!ctx) throw new Error('Failed to allocate offscreen surface');
    if (kind === 'static') {
      ctx.imageSmoothingEnabled = true;
    }
    this.ctx = ctx;
  }

  resize(width: number, height: number, scale = this.scale): boolean {
    const w = Math.max(1, Math.floor(width * scale));
    const h = Math.max(1, Math.floor(height * scale));
    if (w === this.canvas.width && h === this.canvas.height && scale === this.scale) return false;
    this.scale = scale;
    this.canvas.width = w;
    this.canvas.height = h;
    this.dirty = true;
    return true;
  }

  clear(color = 'transparent'): void {
    const ctx = this.ctx;
    if (color === 'transparent') {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }
  }
}
