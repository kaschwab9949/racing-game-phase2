import { OffscreenSurface } from './OffscreenSurface';

export type ScreenEnvironmentStats = {
  hits: number;
  misses: number;
};

export class ScreenEnvironmentLayer {
  private surface: OffscreenSurface;
  private lastW = 0;
  private lastH = 0;
  private stats: ScreenEnvironmentStats = { hits: 0, misses: 0 };

  constructor() {
    this.surface = new OffscreenSurface(1, 1, 1, 'static');
  }

  private redraw(): void {
    const surf = this.surface;
    const ctx = surf.ctx;
    const w = surf.canvas.width;
    const h = surf.canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0d1e0d');
    grad.addColorStop(1, '#0a140a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle dot/noise pattern (cheap, only on resize)
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#ffffff';
    const step = 18;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const jitter = (Math.sin(x * 0.1 + y * 0.07) + 1) * 0.5;
        ctx.fillRect(x + jitter * 4, y + jitter * 4, 2, 2);
      }
    }
    ctx.restore();

    // Light vignette
    ctx.save();
    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    surf.dirty = false;
  }

  render(ctx: CanvasRenderingContext2D): ScreenEnvironmentStats {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w;
      this.lastH = h;
      this.surface.resize(w, h, 1);
      this.surface.dirty = true;
    }

    if (this.surface.dirty) {
      this.stats.misses++;
      this.redraw();
    } else {
      this.stats.hits++;
    }

    ctx.drawImage(this.surface.canvas, 0, 0);
    const out = { ...this.stats };
    this.stats = { hits: 0, misses: 0 };
    return out;
  }
}
